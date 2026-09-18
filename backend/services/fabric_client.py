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

    def record_event(self, vehicle_id: str, event_type: str, entity_id: str, local_hash: str) -> Dict[str, Any]:
        """Submits a real RecordEvent transaction to the Fabric ledger."""
        if not self.is_network_active():
            return {
                "success": False,
                "network_mode": "UNAVAILABLE",
                "error": "Hyperledger Fabric network peer containers are not running."
            }

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
          -c '{{"function":"RecordEvent","Args":["{vehicle_id}","{event_type}","{entity_id}","{local_hash}","{timestamp}"]}}'
        """

        try:
            res = subprocess.run(
                ["wsl", "-d", "Ubuntu", "-e", "bash", "-c", bash_cmd],
                capture_output=True,
                text=True,
                timeout=15
            )
            output = res.stdout + res.stderr
            if "status:200" in output:
                # Extract txid if available or generate deterministic reference
                return {
                    "success": True,
                    "network_mode": "REAL_FABRIC",
                    "transaction_id": f"fabric_tx_{local_hash[:16]}",
                    "timestamp": timestamp,
                    "raw_response": output.strip()
                }
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
