const express = require('express');
const cors = require('cors');
const { exec, execSync } = require('child_process');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const BASE_DIR = process.env.FABRIC_BASE_DIR || '/mnt/c/Users/kansa/Documents/Personal/Projects/ClaimSure/backend/blockchain';
const CHANNEL = process.env.FABRIC_CHANNEL || 'mychannel';
const CHAINCODE = process.env.FABRIC_CHAINCODE || 'vehicle';

// Helper to check if Fabric network peer is running in WSL/Docker
function isFabricActive() {
    try {
        const cmd = `wsl -d Ubuntu -e bash -c "docker ps --filter 'name=peer0.org1' --format '{{.Status}}'"`;
        const output = execSync(cmd, { timeout: 10000 }).toString();
        return output.includes('Up');
    } catch (e) {
        return false;
    }
}

// 1. Health check endpoint
app.get('/api/health', (req, res) => {
    const active = isFabricActive();
    res.json({
        status: active ? 'UP' : 'DEGRADED',
        network_mode: active ? 'REAL_FABRIC' : 'UNAVAILABLE',
        channel: CHANNEL,
        chaincode: CHAINCODE,
        timestamp: new Date().toISOString()
    });
});

// 2. Commit transaction endpoint
app.post('/api/commit', async (req, res) => {
    const { vehicleId, eventType, entityId, localDataHash } = req.body;

    if (!vehicleId || !eventType || !entityId || !localDataHash) {
        return res.status(400).json({ error: "Missing required event fields (vehicleId, eventType, entityId, localDataHash)" });
    }

    if (!isFabricActive()) {
        return res.status(503).json({
            success: false,
            network_mode: "UNAVAILABLE",
            error: "Hyperledger Fabric network peer containers are not running."
        });
    }

    const timestamp = new Date().toISOString();
    console.log(`[Fabric Gateway] Submitting transaction for ${vehicleId} (${eventType})...`);

    const bashCmd = `
    cd ${BASE_DIR}/fabric-samples/test-network && \
    export PATH="${BASE_DIR}/bin:$PATH" && \
    export FABRIC_CFG_PATH="${BASE_DIR}/config" && \
    export CORE_PEER_TLS_ENABLED=true && \
    export CORE_PEER_LOCALMSPID="Org1MSP" && \
    export CORE_PEER_TLS_ROOTCERT_FILE=\${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem && \
    export CORE_PEER_MSPCONFIGPATH=\${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp && \
    export CORE_PEER_ADDRESS=localhost:7051 && \
    ORDERER_CA=\${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem && \
    PEER0_ORG1_CA=\${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem && \
    PEER0_ORG2_CA=\${PWD}/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem && \
    peer chaincode invoke \
      -o localhost:7050 \
      --ordererTLSHostnameOverride orderer.example.com \
      --tls --cafile "$ORDERER_CA" \
      -C ${CHANNEL} -n ${CHAINCODE} \
      --peerAddresses localhost:7051 --tlsRootCertFiles "$PEER0_ORG1_CA" \
      --peerAddresses localhost:9051 --tlsRootCertFiles "$PEER0_ORG2_CA" \
      --waitForEvent \
      -c '{"function":"RecordEvent","Args":["${vehicleId}","${eventType}","${entityId}","${localDataHash}","${timestamp}"]}'
    `;

    exec(`wsl -d Ubuntu -e bash -c '${bashCmd.replace(/'/g, "'\\''")}'`, { timeout: 25000 }, (error, stdout, stderr) => {
        const hasValid = output.includes('COMMITTED') || output.includes('VALID');
        const hasError = output.includes('Error:') || output.includes('SERVICE_UNAVAILABLE') || output.includes('error sending transaction');
        if (hasValid && !hasError) {
            // Extract real Fabric transaction ID
            const txMatch = output.match(/txid \[([a-f0-9]{64})\]/i);
            const txId = txMatch ? txMatch[1] : `fabric_tx_${localDataHash.slice(0, 16)}`;

            return res.json({
                success: true,
                network_mode: "REAL_FABRIC",
                transaction_id: txId,
                timestamp: timestamp,
                raw_response: output.trim()
            });
        } else {
            console.error(`[Fabric Gateway] Commit error:`, output);
            return res.status(500).json({
                success: false,
                network_mode: "REAL_FABRIC",
                error: output.trim() || error?.message
            });
        }
    });
});

// 3. Verify ledger state endpoint
app.get('/api/verify', async (req, res) => {
    const { vehicleId, timestamp, entityId } = req.query;

    if (!vehicleId || !timestamp || !entityId) {
        return res.status(400).json({ error: "Missing required query parameters: vehicleId, timestamp, entityId" });
    }

    if (!isFabricActive()) {
        return res.status(503).json({
            success: false,
            network_mode: "UNAVAILABLE",
            error: "Hyperledger Fabric network peer containers are not running."
        });
    }

    const bashCmd = `
    cd ${BASE_DIR}/fabric-samples/test-network && \
    export PATH="${BASE_DIR}/bin:$PATH" && \
    export FABRIC_CFG_PATH="${BASE_DIR}/config" && \
    export CORE_PEER_TLS_ENABLED=true && \
    export CORE_PEER_LOCALMSPID="Org1MSP" && \
    export CORE_PEER_TLS_ROOTCERT_FILE=\${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem && \
    export CORE_PEER_MSPCONFIGPATH=\${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp && \
    export CORE_PEER_ADDRESS=localhost:7051 && \
    peer chaincode query -C ${CHANNEL} -n ${CHAINCODE} -c '{"function":"VerifyEvent","Args":["${vehicleId}","${timestamp}","${entityId}"]}'
    `;

    exec(`wsl -d Ubuntu -e bash -c '${bashCmd.replace(/'/g, "'\\''")}'`, { timeout: 25000 }, (error, stdout, stderr) => {
        if (error || !stdout.trim()) {
            return res.status(404).json({
                success: false,
                network_mode: "REAL_FABRIC",
                error: stderr.trim() || "Record not found on ledger"
            });
        }
        try {
            const record = JSON.parse(stdout.trim());
            return res.json({
                success: true,
                network_mode: "REAL_FABRIC",
                record: record,
                localDataHash: record.localDataHash
            });
        } catch (err) {
            return res.json({
                success: true,
                network_mode: "REAL_FABRIC",
                raw: stdout.trim()
            });
        }
    });
});

// 4. Vehicle History endpoint
app.get('/api/history/:vehicleId', (req, res) => {
    const vehicleId = req.params.vehicleId;

    if (!isFabricActive()) {
        return res.status(503).json({
            success: false,
            network_mode: "UNAVAILABLE",
            error: "Hyperledger Fabric network peer containers are not running."
        });
    }

    const bashCmd = `
    cd ${BASE_DIR}/fabric-samples/test-network && \
    export PATH="${BASE_DIR}/bin:$PATH" && \
    export FABRIC_CFG_PATH="${BASE_DIR}/config" && \
    export CORE_PEER_TLS_ENABLED=true && \
    export CORE_PEER_LOCALMSPID="Org1MSP" && \
    export CORE_PEER_TLS_ROOTCERT_FILE=\${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem && \
    export CORE_PEER_MSPCONFIGPATH=\${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp && \
    export CORE_PEER_ADDRESS=localhost:7051 && \
    peer chaincode query -C ${CHANNEL} -n ${CHAINCODE} -c '{"function":"GetVehicleHistory","Args":["${vehicleId}"]}'
    `;

    exec(`wsl -d Ubuntu -e bash -c '${bashCmd.replace(/'/g, "'\\''")}'`, { timeout: 25000 }, (error, stdout, stderr) => {
        if (error || !stdout.trim()) {
            return res.status(404).json({
                success: false,
                network_mode: "REAL_FABRIC",
                error: stderr.trim() || "No events found for vehicle"
            });
        }
        try {
            const records = JSON.parse(stdout.trim());
            return res.json({
                success: true,
                network_mode: "REAL_FABRIC",
                events: records
            });
        } catch (err) {
            return res.json({
                success: true,
                network_mode: "REAL_FABRIC",
                raw: stdout.trim()
            });
        }
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`[InsureTrace Gateway] Active on port ${PORT} connected to ${CHANNEL}:${CHAINCODE}`);
});
