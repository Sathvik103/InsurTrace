#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/fabric-samples/test-network"

export PATH="$DIR/bin:$PATH"

echo "Using PATH: $PATH"
echo "Peer version:"
peer version

echo "Shutting down existing network if any..."
./network.sh down

echo "Starting Fabric network with channel 'mychannel' and CAs..."
./network.sh up createChannel -c mychannel -ca
