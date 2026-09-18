#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/fabric-samples/test-network"

export PATH="$DIR/bin:$PATH"
export FABRIC_CFG_PATH="$DIR/config"

echo "Deploying VehicleHistory chaincode (v2.0, seq 2) to mychannel..."
./network.sh deployCC -ccn vehicle -ccp ../../chaincode -ccl javascript -ccv 2.0 -ccs 2
