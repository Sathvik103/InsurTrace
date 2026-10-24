/**
 * ClearClaim Fabric gateway.
 *
 * A small authenticated HTTP service that sits next to a Fabric peer network
 * and exposes RecordEvent / VerifyEvent / GetVehicleHistory to the ClearClaim API.
 * It is called server-to-server only (no browser CORS), requires the
 * X-Gateway-Key header, and runs the peer CLI via execFile (no shell), so request
 * values can never be interpreted as shell syntax.
 *
 * Env:
 *   GATEWAY_API_KEY   required shared secret (min 24 chars)
 *   FABRIC_BASE_DIR   directory containing bin/, config/ and fabric-samples/
 *   FABRIC_RUNNER     "native" (peer CLI on this host) or "wsl" (Windows host)
 *   FABRIC_CHANNEL, FABRIC_CHAINCODE, PORT
 */
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { execFile } = require('child_process');

const API_KEY = process.env.GATEWAY_API_KEY || '';
const RUNNER = process.env.FABRIC_RUNNER || (process.platform === 'win32' ? 'wsl' : 'native');
function defaultBaseDir() {
  const local = path.resolve(__dirname, '..');
  if (RUNNER !== 'wsl') return local;
  // C:\Users\me\...\blockchain -> /mnt/c/Users/me/.../blockchain
  const [drive, ...rest] = local.split(/[\\/]+/);
  return `/mnt/${drive.replace(':', '').toLowerCase()}/${rest.join('/')}`;
}
const BASE_DIR = process.env.FABRIC_BASE_DIR || defaultBaseDir();
const CHANNEL = process.env.FABRIC_CHANNEL || 'mychannel';
const CHAINCODE = process.env.FABRIC_CHAINCODE || 'vehicle';
const PORT = process.env.PORT || 3001;
const CLI_TIMEOUT_MS = 25000;

if (API_KEY.length < 24) {
  console.error('[gateway] GATEWAY_API_KEY must be set to a secret of at least 24 characters.');
  process.exit(1);
}

const SAFE_ARG = /^[A-Za-z0-9_.:+\-]{1,160}$/;
const TN = `${BASE_DIR}/fabric-samples/test-network`;
const ORG1 = `${TN}/organizations/peerOrganizations/org1.example.com`;
const PEER_ENV = {
  FABRIC_CFG_PATH: `${BASE_DIR}/config`,
  CORE_PEER_TLS_ENABLED: 'true',
  CORE_PEER_LOCALMSPID: 'Org1MSP',
  CORE_PEER_TLS_ROOTCERT_FILE: `${ORG1}/tlsca/tlsca.org1.example.com-cert.pem`,
  CORE_PEER_MSPCONFIGPATH: `${ORG1}/users/Admin@org1.example.com/msp`,
  CORE_PEER_ADDRESS: 'localhost:7051',
};

function run(argv, env, timeout = CLI_TIMEOUT_MS) {
  let file;
  let args;
  let options = { timeout, maxBuffer: 4 * 1024 * 1024 };
  if (RUNNER === 'wsl') {
    const envArgs = Object.entries(env || {}).map(([k, v]) => `${k}=${v}`);
    file = 'wsl';
    args = ['-d', 'Ubuntu', '-e', ...(envArgs.length ? ['env', ...envArgs] : []), ...argv];
  } else {
    [file, ...args] = argv;
    options.env = { ...process.env, ...(env || {}) };
  }
  return new Promise((resolve) => {
    execFile(file, args, options, (error, stdout, stderr) => {
      resolve({ ok: !error, stdout: String(stdout || ''), stderr: String(stderr || ''), error });
    });
  });
}

async function fabricActive() {
  const res = await run(['docker', 'ps', '--filter', 'name=peer0.org1', '--format', '{{.Status}}'], null, 12000);
  return res.stdout.includes('Up');
}

function safe(...values) {
  return values.every((v) => typeof v === 'string' && SAFE_ARG.test(v));
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

app.use((req, res, next) => {
  const given = Buffer.from(req.get('X-Gateway-Key') || '');
  const expected = Buffer.from(API_KEY);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return res.status(401).json({ success: false, error: 'Invalid gateway key' });
  }
  next();
});

app.get('/api/health', async (req, res) => {
  const active = await fabricActive();
  res.json({
    status: active ? 'UP' : 'DEGRADED',
    network_mode: active ? 'REAL_FABRIC' : 'UNAVAILABLE',
    channel: CHANNEL,
    chaincode: CHAINCODE,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/commit', async (req, res) => {
  const { vehicleId, eventType, entityId, localDataHash } = req.body || {};
  const timestamp = (req.body && req.body.timestamp) || new Date().toISOString();
  if (!safe(vehicleId, eventType, entityId, localDataHash, timestamp)) {
    return res.status(400).json({ success: false, error: 'Missing or invalid event fields' });
  }
  if (!(await fabricActive())) {
    return res.status(503).json({ success: false, network_mode: 'UNAVAILABLE', error: 'Fabric peer containers are not running.' });
  }

  const ctor = JSON.stringify({ function: 'RecordEvent', Args: [vehicleId, eventType, entityId, localDataHash, timestamp] });
  const argv = [
    `${BASE_DIR}/bin/peer`, 'chaincode', 'invoke',
    '-o', 'localhost:7050', '--ordererTLSHostnameOverride', 'orderer.example.com',
    '--tls', '--cafile', `${TN}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem`,
    '-C', CHANNEL, '-n', CHAINCODE,
    '--peerAddresses', 'localhost:7051', '--tlsRootCertFiles', PEER_ENV.CORE_PEER_TLS_ROOTCERT_FILE,
    '--peerAddresses', 'localhost:9051', '--tlsRootCertFiles', `${TN}/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem`,
    '--waitForEvent', '-c', ctor,
  ];

  const result = await run(argv, PEER_ENV);
  const output = result.stdout + result.stderr;
  const txMatch = output.match(/txid \[([a-f0-9]{64})\]/i);
  if (result.ok && txMatch && /VALID|COMMITTED/.test(output)) {
    return res.json({ success: true, network_mode: 'REAL_FABRIC', transaction_id: txMatch[1], timestamp });
  }
  const transient = output.includes('no Raft leader');
  console.error('[gateway] commit failed:', output.slice(0, 500));
  return res.status(transient ? 503 : 502).json({
    success: false,
    network_mode: transient ? 'UNAVAILABLE' : 'REAL_FABRIC',
    error: transient ? 'Ordering service has no Raft leader yet; retry shortly.' : output.trim().slice(0, 500) || 'Invoke failed',
  });
});

async function query(fn, args, res) {
  if (!safe(...args)) return res.status(400).json({ success: false, error: 'Invalid query parameters' });
  if (!(await fabricActive())) {
    return res.status(503).json({ success: false, network_mode: 'UNAVAILABLE', error: 'Fabric peer containers are not running.' });
  }
  const ctor = JSON.stringify({ function: fn, Args: args });
  const result = await run([`${BASE_DIR}/bin/peer`, 'chaincode', 'query', '-C', CHANNEL, '-n', CHAINCODE, '-c', ctor], PEER_ENV);
  if (!result.ok || !result.stdout.trim()) {
    return res.status(404).json({ success: false, network_mode: 'REAL_FABRIC', error: result.stderr.trim().slice(0, 300) || 'Not found on ledger' });
  }
  try {
    return res.json({ success: true, network_mode: 'REAL_FABRIC', data: JSON.parse(result.stdout.trim()) });
  } catch (e) {
    return res.status(502).json({ success: false, network_mode: 'REAL_FABRIC', error: 'Invalid ledger response' });
  }
}

app.get('/api/verify', async (req, res) => {
  const { vehicleId, timestamp, entityId } = req.query;
  const send = res.json.bind(res);
  res.json = (body) => {
    if (body && body.success) {
      body.record = body.data;
      body.localDataHash = body.data && body.data.localDataHash;
      delete body.data;
    }
    return send(body);
  };
  return query('VerifyEvent', [vehicleId, timestamp, entityId], res);
});

app.get('/api/history/:vehicleId', async (req, res) => {
  const send = res.json.bind(res);
  res.json = (body) => {
    if (body && body.success) {
      body.events = body.data;
      delete body.data;
    }
    return send(body);
  };
  return query('GetVehicleHistory', [req.params.vehicleId], res);
});

app.listen(PORT, () => {
  console.log(`[gateway] listening on ${PORT} (runner=${RUNNER}, channel=${CHANNEL}, chaincode=${CHAINCODE})`);
});
