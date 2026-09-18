import subprocess
import json
import logging
import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class FabricClient:
    """
    Direct client for Hyperledger Fabric test-network running in WSL.
    Communicates with peer0.org1.example.com and orderer.example.com on mychannel.
    """

    def __init__(self, channel: str = "mychannel", chaincode: str = "vehicle"):
        self.channel = channel
        self.chaincode = chaincode
        self.base_dir = "/mnt/c/Users/kansa/Documents/Personal/Projects/ClaimSure/backend/blockchain"

    def is_network_active(self) -> bool:
        """Checks if Fabric peer containers are actively running in Docker."""
        try:
            res = subprocess.run(
                ["wsl", "-d", "Ubuntu", "-e", "bash", "-c", "docker ps --filter 'name=peer0.org1' --format '{{.Status}}'"],
                capture_output=True,
                text=True,
                timeout=25
            )
            return "Up" in res.stdout
        except Exception as e:
            logger.warning(f"Failed to check Fabric network status: {e}")
            return False

    def record_event(self, vehicle_id: str, event_type: str, entity_id: str, local_hash: str, timestamp: Optional[str] = None) -> Dict[str, Any]:
        """Submits a real RecordEvent transaction to the Fabric ledger."""
        if not self.is_network_active():
            return {
                "success": False,
                "network_mode": "UNAVAILABLE",
                "error": "Hyperledger Fabric network peer containers are not running."
            }

        if not timestamp:
            timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        # Prepare invoke command
        bash_cmd = f"""
        cd {self.base_dir}/fabric-samples/test-network
        export PATH="{self.base_dir}/bin:$PATH"
        export FABRIC_CFG_PATH="{self.base_dir}/config"
        export CORE_PEER_TLS_ENABLED=true
        export CORE_PEER_LOCALMSPID="Org1MSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=${{PWD}}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
        export CORE_PEER_MSPCONFIGPATH=${{PWD}}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
        export CORE_PEER_ADDRESS=localhost:7051

        ORDERER_CA=${{PWD}}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
        PEER0_ORG1_CA=${{PWD}}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
        PEER0_ORG2_CA=${{PWD}}/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem

        peer chaincode invoke \
          -o localhost:7050 \
          --ordererTLSHostnameOverride orderer.example.com \
          --tls --cafile "$ORDERER_CA" \
          -C {self.channel} -n {self.chaincode} \
          --peerAddresses localhost:7051 --tlsRootCertFiles "$PEER0_ORG1_CA" \
          --peerAddresses localhost:9051 --tlsRootCertFiles "$PEER0_ORG2_CA" \
          --waitForEvent \
          -c '{{"function":"RecordEvent","Args":["{vehicle_id}","{event_type}","{entity_id}","{local_hash}","{timestamp}"]}}'
        """

        for attempt in range(2):
            try:
                res = subprocess.run(
                    ["wsl", "-d", "Ubuntu", "-e", "bash", "-c", bash_cmd],
                    capture_output=True,
                    text=True,
                    timeout=25
                )
                output = res.stdout + res.stderr
                has_valid = ("COMMITTED" in output or "VALID" in output)
                has_error = ("Error:" in output or "SERVICE_UNAVAILABLE" in output or "error sending transaction" in output)
                if has_valid and not has_error:
                    import re
                    tx_match = re.search(r'txid \[([a-f0-9]{64})\]', output)
                    if tx_match:
                        tx_id = tx_match.group(1)
                    else:
                        gen_match = re.search(r'txid:?\s*\[?([a-f0-9]{16,64})\]?', output, re.IGNORECASE)
                        tx_id = gen_match.group(1) if gen_match else f"fabric_tx_{local_hash[:16]}"

                    return {
                        "success": True,
                        "network_mode": "REAL_FABRIC",
                        "transaction_id": tx_id,
                        "timestamp": timestamp,
                        "raw_response": output.strip()
                    }
                elif "no Raft leader" in output and attempt == 0:
                    import time
                    time.sleep(2.5)
                    continue
                else:
                    return {
                        "success": False,
                        "network_mode": "REAL_FABRIC",
                        "error": f"Invoke failed: {output.strip()}"
                    }
            except Exception as e:
                return {
                    "success": False,
                    "network_mode": "UNAVAILABLE",
                    "error": str(e)
                }

    def get_vehicle_history(self, vehicle_id: str) -> Dict[str, Any]:
        """Queries GetVehicleHistory directly from the Fabric chaincode."""
        if not self.is_network_active():
            return {
                "success": False,
                "network_mode": "UNAVAILABLE",
                "error": "Hyperledger Fabric network peer containers are not running."
            }

        bash_cmd = f"""
        cd {self.base_dir}/fabric-samples/test-network
        export PATH="{self.base_dir}/bin:$PATH"
        export FABRIC_CFG_PATH="{self.base_dir}/config"
        export CORE_PEER_TLS_ENABLED=true
        export CORE_PEER_LOCALMSPID="Org1MSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=${{PWD}}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
        export CORE_PEER_MSPCONFIGPATH=${{PWD}}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
        export CORE_PEER_ADDRESS=localhost:7051

        peer chaincode query -C {self.channel} -n {self.chaincode} -c '{{"function":"GetVehicleHistory","Args":["{vehicle_id}"]}}'
        """

        try:
            res = subprocess.run(
                ["wsl", "-d", "Ubuntu", "-e", "bash", "-c", bash_cmd],
                capture_output=True,
                text=True,
                timeout=25
            )
            if res.returncode == 0 and res.stdout.strip():
                try:
                    records = json.loads(res.stdout.strip())
                    return {
                        "success": True,
                        "network_mode": "REAL_FABRIC",
                        "events": records
                    }
                except json.JSONDecodeError:
                    return {
                        "success": True,
                        "network_mode": "REAL_FABRIC",
                        "raw_output": res.stdout.strip()
                    }
            return {
                "success": False,
                "network_mode": "REAL_FABRIC",
                "error": res.stderr.strip() or "No history found"
            }
        except Exception as e:
            return {
                "success": False,
                "network_mode": "UNAVAILABLE",
                "error": str(e)
            }

    def verify_event(self, vehicle_id: str, timestamp: str, entity_id: str) -> Dict[str, Any]:
        """Queries VerifyEvent directly from the Fabric ledger state."""
        if not self.is_network_active():
            return {
                "success": False,
                "network_mode": "UNAVAILABLE",
                "error": "Hyperledger Fabric network peer containers are not running."
            }

        bash_cmd = f"""
        cd {self.base_dir}/fabric-samples/test-network
        export PATH="{self.base_dir}/bin:$PATH"
        export FABRIC_CFG_PATH="{self.base_dir}/config"
        export CORE_PEER_TLS_ENABLED=true
        export CORE_PEER_LOCALMSPID="Org1MSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=${{PWD}}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
        export CORE_PEER_MSPCONFIGPATH=${{PWD}}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
        export CORE_PEER_ADDRESS=localhost:7051

        peer chaincode query -C {self.channel} -n {self.chaincode} -c '{{"function":"VerifyEvent","Args":["{vehicle_id}","{timestamp}","{entity_id}"]}}'
        """

        try:
            res = subprocess.run(
                ["wsl", "-d", "Ubuntu", "-e", "bash", "-c", bash_cmd],
                capture_output=True,
                text=True,
                timeout=25
            )
            if res.returncode == 0 and res.stdout.strip():
                try:
                    record = json.loads(res.stdout.strip())
                    return {
                        "success": True,
                        "network_mode": "REAL_FABRIC",
                        "record": record,
                        "localDataHash": record.get("localDataHash")
                    }
                except json.JSONDecodeError:
                    return {
                        "success": False,
                        "network_mode": "REAL_FABRIC",
                        "error": f"Invalid JSON response: {res.stdout.strip()}"
                    }
            else:
                return {
                    "success": False,
                    "network_mode": "REAL_FABRIC",
                    "error": res.stderr.strip() or "Event not found on ledger"
                }
        except Exception as e:
            return {
                "success": False,
                "network_mode": "UNAVAILABLE",
                "error": str(e)
            }
