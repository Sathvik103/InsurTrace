"""
Direct client for the Hyperledger Fabric test network (peer CLI).

Commands are executed as argv lists (never through a shell), so ledger
arguments cannot be interpreted as shell syntax. On a Windows host the peer
CLI runs inside WSL; on Linux it runs natively.
"""

import datetime
import json
import logging
import os
import re
import shutil
import subprocess
import time
from pathlib import Path, PureWindowsPath
from typing import Any, Dict, List, Optional

from config import get_settings

logger = logging.getLogger(__name__)

# Ledger arguments must be simple identifiers, ISO timestamps or hex hashes.
_SAFE_ARG = re.compile(r"^[A-Za-z0-9_.:+\-]{1,160}$")
_TX_ID = re.compile(r"txid \[([a-f0-9]{64})\]", re.IGNORECASE)


class LedgerArgumentError(ValueError):
    pass


def validate_ledger_args(*values: str) -> None:
    for v in values:
        if not isinstance(v, str) or not _SAFE_ARG.match(v):
            raise LedgerArgumentError(f"Unsafe ledger argument rejected: {v!r}")


def _to_wsl_path(p: Path) -> str:
    win = PureWindowsPath(str(p))
    drive = win.drive.rstrip(":").lower()
    rest = "/".join(win.parts[1:])
    return f"/mnt/{drive}/{rest}"


def default_base_dir(use_wsl: bool) -> str:
    local = Path(__file__).resolve().parents[1] / "blockchain"
    return _to_wsl_path(local) if use_wsl else str(local)


class FabricClient:
    """Peer-CLI client for the local test network (peer0.org1, peer0.org2, Raft orderer)."""

    PROBE_CACHE_SECONDS = 15.0
    LEADER_RETRY_DELAYS = (3.0, 5.0, 0.0)

    def __init__(self, channel: Optional[str] = None, chaincode: Optional[str] = None):
        s = get_settings()
        self.channel = channel or s.fabric_channel
        self.chaincode = chaincode or s.fabric_chaincode
        self.use_wsl = os.name == "nt"
        self.base_dir = s.fabric_base_dir or default_base_dir(self.use_wsl)
        self.timeout = s.fabric_timeout_seconds
        self.probe_timeout = s.fabric_probe_timeout_seconds
        self._probe_cache: Optional[tuple[float, str]] = None

    # ------------------------------------------------------------------ runtime
    def runtime_available(self) -> bool:
        return shutil.which("wsl" if self.use_wsl else "docker") is not None

    def _run(self, argv: List[str], env: Optional[Dict[str, str]] = None, timeout: Optional[float] = None):
        if self.use_wsl:
            env_args = [f"{k}={v}" for k, v in (env or {}).items()]
            cmd = ["wsl", "-d", "Ubuntu", "-e", *(["env", *env_args] if env_args else []), *argv]
            run_env = None
        else:
            cmd = argv
            run_env = {**os.environ, **env} if env else None
        return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout or self.timeout, env=run_env)

    def container_status(self) -> str:
        """Returns `docker ps` name/status output, cached briefly to keep status checks fast."""
        now = time.monotonic()
        if self._probe_cache and now - self._probe_cache[0] < self.PROBE_CACHE_SECONDS:
            return self._probe_cache[1]
        output = ""
        if self.runtime_available():
            try:
                res = self._run(["docker", "ps", "--format", "{{.Names}}: {{.Status}}"], timeout=self.probe_timeout)
                output = res.stdout
            except Exception as e:
                logger.info("Fabric container probe failed: %s", e)
        self._probe_cache = (now, output)
        return output

    def is_network_active(self) -> bool:
        status = self.container_status()
        return any(line.startswith("peer0.org1") and "Up" in line for line in status.splitlines())

    # ------------------------------------------------------------------ peer CLI
    @property
    def _tn(self) -> str:
        return f"{self.base_dir}/fabric-samples/test-network"

    def _peer_env(self) -> Dict[str, str]:
        org1 = f"{self._tn}/organizations/peerOrganizations/org1.example.com"
        return {
            "FABRIC_CFG_PATH": f"{self.base_dir}/config",
            "CORE_PEER_TLS_ENABLED": "true",
            "CORE_PEER_LOCALMSPID": "Org1MSP",
            "CORE_PEER_TLS_ROOTCERT_FILE": f"{org1}/tlsca/tlsca.org1.example.com-cert.pem",
            "CORE_PEER_MSPCONFIGPATH": f"{org1}/users/Admin@org1.example.com/msp",
            "CORE_PEER_ADDRESS": "localhost:7051",
        }

    def _peer(self) -> str:
        return f"{self.base_dir}/bin/peer"

    def _unavailable(self) -> Dict[str, Any]:
        return {
            "success": False,
            "network_mode": "UNAVAILABLE",
            "error": "Hyperledger Fabric network peer containers are not running.",
        }

    def record_event(self, vehicle_id: str, event_type: str, entity_id: str, local_hash: str,
                     timestamp: Optional[str] = None) -> Dict[str, Any]:
        """Submits a real RecordEvent transaction endorsed by both peers."""
        timestamp = timestamp or datetime.datetime.now(datetime.timezone.utc).isoformat()
        validate_ledger_args(vehicle_id, event_type, entity_id, local_hash, timestamp)
        if not self.is_network_active():
            return self._unavailable()

        orderer_ca = f"{self._tn}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem"
        org2_ca = f"{self._tn}/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem"
        env = self._peer_env()
        ctor = json.dumps({"function": "RecordEvent",
                           "Args": [vehicle_id, event_type, entity_id, local_hash, timestamp]})
        argv = [
            self._peer(), "chaincode", "invoke",
            "-o", "localhost:7050", "--ordererTLSHostnameOverride", "orderer.example.com",
            "--tls", "--cafile", orderer_ca,
            "-C", self.channel, "-n", self.chaincode,
            "--peerAddresses", "localhost:7051", "--tlsRootCertFiles", env["CORE_PEER_TLS_ROOTCERT_FILE"],
            "--peerAddresses", "localhost:9051", "--tlsRootCertFiles", org2_ca,
            "--waitForEvent", "-c", ctor,
        ]

        # A freshly started orderer needs a few seconds to elect a Raft leader;
        # that is transient, so back off and retry before reporting the ledger as unavailable.
        output = ""
        for delay in self.LEADER_RETRY_DELAYS:
            try:
                res = self._run(argv, env)
            except Exception as e:
                return {"success": False, "network_mode": "UNAVAILABLE", "error": str(e)}
            output = res.stdout + res.stderr
            committed = ("COMMITTED" in output or "VALID" in output) and res.returncode == 0
            if committed:
                match = _TX_ID.search(output)
                if not match:
                    return {"success": False, "network_mode": "REAL_FABRIC",
                            "error": "Fabric reported success but no transaction ID was found in the response."}
                return {"success": True, "network_mode": "REAL_FABRIC",
                        "transaction_id": match.group(1), "timestamp": timestamp}
            if "no Raft leader" not in output:
                return {"success": False, "network_mode": "REAL_FABRIC", "error": f"Invoke failed: {output.strip()[:500]}"}
            if delay:
                time.sleep(delay)
        return {"success": False, "network_mode": "UNAVAILABLE",
                "error": "The ordering service has no Raft leader yet (network still starting). Retry shortly."}

    def _query(self, function: str, args: List[str]) -> Dict[str, Any]:
        validate_ledger_args(*args)
        if not self.is_network_active():
            return self._unavailable()
        ctor = json.dumps({"function": function, "Args": args})
        argv = [self._peer(), "chaincode", "query", "-C", self.channel, "-n", self.chaincode, "-c", ctor]
        try:
            res = self._run(argv, self._peer_env())
        except Exception as e:
            return {"success": False, "network_mode": "UNAVAILABLE", "error": str(e)}
        if res.returncode != 0 or not res.stdout.strip():
            return {"success": False, "network_mode": "REAL_FABRIC",
                    "error": res.stderr.strip()[:500] or "Not found on ledger"}
        try:
            return {"success": True, "network_mode": "REAL_FABRIC", "data": json.loads(res.stdout.strip())}
        except json.JSONDecodeError:
            return {"success": False, "network_mode": "REAL_FABRIC",
                    "error": f"Invalid JSON response: {res.stdout.strip()[:200]}"}

    def get_vehicle_history(self, vehicle_id: str) -> Dict[str, Any]:
        res = self._query("GetVehicleHistory", [vehicle_id])
        if res.get("success"):
            res["events"] = res.pop("data")
        return res

    def verify_event(self, vehicle_id: str, timestamp: str, entity_id: str) -> Dict[str, Any]:
        res = self._query("VerifyEvent", [vehicle_id, timestamp, entity_id])
        if res.get("success"):
            record = res.pop("data")
            res["record"] = record
            res["localDataHash"] = record.get("localDataHash") if isinstance(record, dict) else None
        return res
