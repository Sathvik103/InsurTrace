# Hyperledger Fabric Deployment, Persistence & Disaster Recovery Guide

This document outlines the operational and infrastructure architecture for deploying and persisting the **InsureTrace India** Hyperledger Fabric consortium network in staging and production environments.

---

## 1. Multi-Tier Production Architecture

In enterprise production, components are separated across specialized infrastructure rather than run on a single machine:

```
+-------------------------------------------------------------------------------+
|                       Tier 1: Web & Edge (Vercel / CDN)                       |
|                       Next.js 16 App (Port 3000 / HTTPS)                      |
+---------------------------------------+---------------------------------------+
                                        | (REST / HTTPS)
+---------------------------------------v---------------------------------------+
|                    Tier 2: Application API (AWS ECS / Render)                 |
|                       FastAPI Microservice (Port 8000)                        |
+-------------------+-----------------------------------+-----------------------+
                    |                                   | (gRPC / HTTP Gateway)
+-------------------v-------------------+       +-------v-----------------------+
|         Tier 3: Database & Auth       |       |  Tier 4: Enterprise Ledger    |
|               (Supabase)              |       |   (Dedicated Linux Cluster)   |
|  - PostgreSQL 15 with RLS             |       |  - Orderer (Raft Consensus)   |
|  - Auth Service & JWT Verification    |       |  - Org1 Peer (Digit Insurer)  |
|  - Storage Buckets (Policies/Photos)  |       |  - Org2 Peer (Independent)    |
|  - Transaction Pooler (PgBouncer)     |       |  - VehicleHistory Chaincode   |
+---------------------------------------+       +-------------------------------+
```

---

## 2. Fabric Ledger Persistence & Volume Mounts

By default, development test networks create ephemeral containers. In production, every peer node and orderer must mount persistent, high-IOPS block storage volumes (e.g., AWS EBS `gp3` or NVMe volumes).

### Required Mount Points

| Node | Mount Path | Purpose |
| :--- | :--- | :--- |
| `orderer.example.com` | `/var/hyperledger/production/orderer` | Raft consensus write-ahead log & block store |
| `peer0.org1.example.com` | `/var/hyperledger/production` | Org1 ledger blocks, private data, & LevelDB/CouchDB state |
| `peer0.org2.example.com` | `/var/hyperledger/production` | Org2 replica ledger blocks & state |
| Certificate Authorities | `/etc/hyperledger/fabric-ca-server` | CA root certificates, sqlite/postgres identity DB |

### Production Docker Compose Persistence Example
```yaml
services:
  orderer.example.com:
    image: hyperledger/fabric-orderer:2.5
    environment:
      - ORDERER_GENERAL_LISTENPORT=7050
      - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
      - ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp
      - ORDERER_GENERAL_TLS_ENABLED=true
      - ORDERER_FILELEDGER_LOCATION=/var/hyperledger/production/orderer
    volumes:
      - /opt/fabric/production/orderer:/var/hyperledger/production/orderer
      - /opt/fabric/crypto/ordererOrganizations:/var/hyperledger/orderer/msp
    restart: always

  peer0.org1.example.com:
    image: hyperledger/fabric-peer:2.5
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_PEER_ID=peer0.org1.example.com
      - CORE_PEER_ADDRESS=peer0.org1.example.com:7051
      - CORE_PEER_LOCALMSPID=Org1MSP
      - CORE_PEER_FILESYSTEMPATH=/var/hyperledger/production
    volumes:
      - /opt/fabric/production/peer0_org1:/var/hyperledger/production
      - /opt/fabric/crypto/peerOrganizations/org1.example.com:/etc/hyperledger/fabric
    restart: always
```

---

## 3. Cold Restart & Disaster Recovery Procedure

### Planned Maintenance / Cold Restart
To reboot or update host systems without corrupting ledger state:
1. Gracefully stop incoming traffic at the Gateway level (`systemctl stop insuretrace-gateway`).
2. Flush and stop the Fabric nodes:
   ```bash
   docker stop $(docker ps -q --filter "name=peer0")
   docker stop orderer.example.com
   ```
3. Reboot host VM.
4. Restart containers (`docker start orderer.example.com && docker start peer0.org1.example.com`).
5. Verify channel consensus:
   ```bash
   peer channel getinfo -c mychannel
   ```

### Backup & Snapshotting
- **Daily Automated EBS Snapshots**: Schedule hourly snapshots of `/opt/fabric/production/` volumes.
- **Crypto Asset Cold Storage**: Store the CA root private keys (`tlsca.*-cert.pem` and `*_sk`) in HashiCorp Vault or AWS Secrets Manager.

---

## 4. Alternative Managed Blockchain Services

If maintaining raw Docker/Kubernetes Fabric nodes in-house is not preferred:
1. **Kaleido (ConsenSys)**: Cloud-native Hyperledger Fabric hosting with built-in REST API gateways and automated key management.
2. **Oracle Blockchain Platform**: Fully managed enterprise Fabric 2.5 with zero-downtime upgrades.
