#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/fabric-samples/test-network"
export PATH="$DIR/bin:$PATH"
export FABRIC_CFG_PATH="$DIR/config"

# Environment variables for Org1
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
PEER0_ORG1_CA=${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
PEER0_ORG2_CA=${PWD}/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem

echo "=== 1. Invoking RecordEvent on vehicle chaincode ==="
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "$ORDERER_CA" \
  -C mychannel -n vehicle \
  --peerAddresses localhost:7051 --tlsRootCertFiles "$PEER0_ORG1_CA" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "$PEER0_ORG2_CA" \
  -c '{"function":"RecordEvent","Args":["V-REAL-101","CLAIM_CREATED","CLM-999","d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592","2026-09-18T18:20:00Z"]}'

echo ""
echo "=== 2. Waiting 3 seconds for block commit ==="
sleep 3

echo ""
echo "=== 3. Querying GetVehicleHistory ==="
peer chaincode query -C mychannel -n vehicle -c '{"function":"GetVehicleHistory","Args":["V-REAL-101"]}'

echo ""
echo "=== 4. Querying VerifyEvent ==="
peer chaincode query -C mychannel -n vehicle -c '{"function":"VerifyEvent","Args":["V-REAL-101","2026-09-18T18:20:00Z","CLM-999"]}'
