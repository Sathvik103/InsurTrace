/**
 * Facts shown on the System page (/system). Keep them true to the code:
 * when an architecture detail changes, change it here.
 */

export type NodeId = 'web' | 'engine' | 'assistant' | 'vercel' | 'api' | 'pdf' | 'auth' | 'db' | 'gateway' | 'fabric';

export interface Node {
  id: NodeId;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  zone: 'device' | 'edge' | 'server' | 'data' | 'ledger';
  role: string;
  tech: string[];
  notes: string[];
}

export const NODES: Node[] = [
  {
    id: 'web', x: 30, y: 40, w: 230, h: 92, title: 'Web app', sub: 'Next.js · React', zone: 'device',
    role: 'Everything you see and click. Runs in your browser after the first page load.',
    tech: ['Next.js 16 (App Router)', 'React 19', 'TypeScript', 'Tailwind CSS 4', 'Framer Motion', 'three.js (3D car)'],
    notes: ['Signed-in pages call the API with your session token.', 'Public pages and the 26 guide articles are pre-rendered, so they need no server work.'],
  },
  {
    id: 'engine', x: 30, y: 220, w: 230, h: 92, title: 'Claim engine', sub: 'TypeScript, in your browser', zone: 'device',
    role: 'Works out depreciation, deductible, payout, No-Claim Bonus loss, the claim-or-pay verdict, repair-or-sell and fleet triage.',
    tech: ['Fixed rules (depreciation schedule, NCB slabs, IDV cap)', 'Same engine in Python on the server'],
    notes: ['No network request: results appear instantly and your figures stay on your device.', '305 test cases check that the browser and server engines give identical answers, to the paisa.'],
  },
  {
    id: 'assistant', x: 30, y: 400, w: 230, h: 92, title: 'Assistant', sub: 'Guide search, in your browser', zone: 'device',
    role: 'Answers questions from a reviewed guide of 26 entries, and explains your result using the numbers already on screen.',
    tech: ['Keyword and synonym matching', 'No language model'],
    notes: ['It can only say what is written in the guide, so it can’t invent policy rules.', 'When it doesn’t know, it says so.'],
  },
  {
    id: 'vercel', x: 365, y: 112, w: 230, h: 80, title: 'Vercel', sub: 'Pages and CDN', zone: 'edge',
    role: 'Builds the website from GitHub on every push and serves it from a global CDN.',
    tech: ['Static generation', 'Server rendering where needed', 'Automatic HTTPS'],
    notes: ['Sitemap, robots rules and share images are generated here.'],
  },
  {
    id: 'api', x: 365, y: 210, w: 230, h: 112, title: 'ClearClaim API', sub: 'FastAPI · Render (Singapore)', zone: 'server',
    role: 'The only part that can read or write stored data. Checks who you are and what you may see on every request.',
    tech: ['Python 3.12', 'FastAPI', 'Pydantic 2', 'SlowAPI rate limits', 'GZip', 'Docker'],
    notes: [
      'Your sign-in token is verified locally with Supabase’s public keys (cached), so no extra call per request.',
      'Your role comes from the database, never from the browser.',
      'Runs on Render’s free tier, which sleeps when idle: the first request can take 30 to 60 seconds.',
    ],
  },
  {
    id: 'pdf', x: 365, y: 410, w: 230, h: 92, title: 'Document reader', sub: 'pdfplumber + Tesseract OCR', zone: 'server',
    role: 'Pulls IDV, No-Claim Bonus, deductible, premium and repair lines out of policies and estimates, with the page each value came from.',
    tech: ['pdfplumber for PDFs with text', 'Tesseract OCR for scans and photos', 'Fixed rules to find each field'],
    notes: ['Accepts PDFs and JPEG or PNG photos up to 10 MB, checked by their contents, not their name.', 'The file is read in memory and not stored.', 'OCR can misread digits, so values from photos are marked and the user checks them.'],
  },
  {
    id: 'auth', x: 700, y: 20, w: 230, h: 82, title: 'Supabase Auth', sub: 'Sign-in', zone: 'data',
    role: 'Creates accounts and issues signed session tokens.',
    tech: ['ES256-signed tokens', 'Published public keys (JWKS)'],
    notes: ['Sign-up can only create car owner, fleet or workshop accounts.'],
  },
  {
    id: 'db', x: 700, y: 150, w: 230, h: 92, title: 'Postgres', sub: 'Supabase', zone: 'data',
    role: 'Stores accounts, organisations, vehicles, saved checks, sharing grants and the audit log.',
    tech: ['PostgreSQL', '16 tables', 'SQL migrations in the repo'],
    notes: ['Only the API holds the database key; the browser never talks to the database directly.'],
  },
  {
    id: 'gateway', x: 700, y: 290, w: 230, h: 92, title: 'Fabric gateway', sub: 'Node.js · optional', zone: 'ledger',
    role: 'A small service the API calls to write and read fingerprints on the ledger.',
    tech: ['Node.js', 'Express', 'fabric-network SDK', 'API-key protected'],
    notes: ['In local development the API can drive the ledger directly through the Fabric command line instead.'],
  },
  {
    id: 'fabric', x: 700, y: 430, w: 230, h: 92, title: 'Fabric network', sub: '2 peers · Raft orderer', zone: 'ledger',
    role: 'Holds SHA-256 fingerprints of saved records, so later edits can be detected.',
    tech: ['Hyperledger Fabric 2.5', 'Chaincode in JavaScript: RecordEvent, GetVehicleHistory, VerifyEvent'],
    notes: ['A test network. It is not connected to the live site right now, so new records wait as “pending” until it is.', 'Only fingerprints go on the ledger, never names or contact details.'],
  },
];

export type EdgeId = string;
export const EDGES: { id: EdgeId; a: NodeId; b: NodeId; label: string }[] = [
  { id: 'web-vercel', a: 'web', b: 'vercel', label: 'pages' },
  { id: 'web-engine', a: 'web', b: 'engine', label: 'in browser' },
  { id: 'web-assistant', a: 'web', b: 'assistant', label: 'in browser' },
  { id: 'web-auth', a: 'web', b: 'auth', label: 'sign in' },
  { id: 'web-api', a: 'web', b: 'api', label: 'HTTPS + token' },
  { id: 'api-auth', a: 'api', b: 'auth', label: 'public keys' },
  { id: 'api-db', a: 'api', b: 'db', label: 'SQL' },
  { id: 'api-pdf', a: 'api', b: 'pdf', label: 'in process' },
  { id: 'api-gateway', a: 'api', b: 'gateway', label: 'HTTPS + key' },
  { id: 'gateway-fabric', a: 'gateway', b: 'fabric', label: 'gRPC' },
];

export const ZONE: Record<Node['zone'], { label: string; dot: string }> = {
  device: { label: 'Your device', dot: 'bg-signal-600' },
  edge: { label: 'Edge', dot: 'bg-ink-400' },
  server: { label: 'Our server', dot: 'bg-forest-600' },
  data: { label: 'Managed data', dot: 'bg-forest-400' },
  ledger: { label: 'Ledger', dot: 'bg-loss' },
};

/* ================================================================ flows */
/** One message in a step: who calls whom, and what. A part calling itself is internal work. */
export type Call = [from: NodeId, to: NodeId, label: string];

export interface Step {
  text: string;
  nodes: NodeId[];
  edges: EdgeId[];
  calls: Call[];
}

export const FLOWS: { id: string; label: string; steps: Step[] }[] = [
  {
    id: 'check',
    label: 'Run a claim check',
    steps: [
      { text: 'You enter the car, the damage and your policy details in the web app.', nodes: ['web'], edges: [], calls: [['web', 'web', 'collect car, damage, policy']] },
      {
        text: 'The claim engine calculates the result in your browser. No request leaves your device.',
        nodes: ['web', 'engine'],
        edges: ['web-engine'],
        calls: [['web', 'engine', 'calculate(quote, policy)'], ['engine', 'web', 'payout, your cost, bonus loss, verdict']],
      },
      {
        text: 'Ask the assistant and it explains the result from the numbers already on screen, also on-device.',
        nodes: ['web', 'assistant'],
        edges: ['web-assistant'],
        calls: [['web', 'assistant', 'explain my result'], ['assistant', 'web', 'answer from the guide']],
      },
    ],
  },
  {
    id: 'save',
    label: 'Save a record',
    steps: [
      { text: 'You press “Save claim record”. The app sends the result to the API with your session token.', nodes: ['web', 'api'], edges: ['web-api'], calls: [['web', 'api', 'POST /claims + token']] },
      {
        text: 'The API checks the token against Supabase’s public keys (cached) and loads your role from the database.',
        nodes: ['api', 'auth', 'db'],
        edges: ['api-auth', 'api-db'],
        calls: [['api', 'auth', 'public keys (cached 1 h)'], ['api', 'db', 'load profile and role']],
      },
      {
        text: 'It checks the vehicle is yours, stores the claim, and computes a SHA-256 fingerprint of the record.',
        nodes: ['api', 'db'],
        edges: ['api-db'],
        calls: [['api', 'db', 'check owner, insert claim'], ['api', 'api', 'SHA-256 fingerprint']],
      },
      {
        text: 'The fingerprint is sent through the gateway to the Fabric network (RecordEvent).',
        nodes: ['api', 'gateway', 'fabric'],
        edges: ['api-gateway', 'gateway-fabric'],
        calls: [['api', 'gateway', 'RecordEvent(fingerprint)'], ['gateway', 'fabric', 'submit transaction']],
      },
      {
        text: 'The ledger status is saved as committed, or pending if the ledger is offline. Retrying later is safe: it never anchors twice.',
        nodes: ['api', 'db', 'web'],
        edges: ['api-db', 'web-api'],
        calls: [['fabric', 'gateway', 'committed or unavailable'], ['gateway', 'api', 'result'], ['api', 'db', 'status: committed / pending'], ['api', 'web', 'saved']],
      },
    ],
  },
  {
    id: 'pdf',
    label: 'Read a document',
    steps: [
      { text: 'You upload a policy or estimate, as a PDF or a photo. The app sends it to the API.', nodes: ['web', 'api'], edges: ['web-api'], calls: [['web', 'api', 'POST /documents/extract']] },
      {
        text: 'The API checks the size (10 MB) and that it really is a PDF or photo. PDFs with text are read directly; scans and photos go through OCR.',
        nodes: ['api', 'pdf'],
        edges: ['api-pdf'],
        calls: [['api', 'api', 'check size and file type'], ['api', 'pdf', 'read text (or OCR)']],
      },
      {
        text: 'Fixed rules find each figure and note the page it came from. Values read by OCR are marked as less certain.',
        nodes: ['pdf'],
        edges: [],
        calls: [['pdf', 'pdf', 'find IDV, NCB, premium, lines'], ['pdf', 'api', 'fields + page numbers']],
      },
      { text: 'The figures come back for you to review. The file itself is not stored.', nodes: ['web', 'api'], edges: ['web-api'], calls: [['api', 'web', 'fields to review']] },
      { text: 'After you check them, they go straight into a claim check in your browser.', nodes: ['web', 'engine'], edges: ['web-engine'], calls: [['web', 'engine', 'calculate with reviewed values']] },
    ],
  },
  {
    id: 'share',
    label: 'Share with a workshop',
    steps: [
      { text: 'You choose a car, a workshop and how long it may see the records.', nodes: ['web', 'api'], edges: ['web-api'], calls: [['web', 'api', 'POST /consent']] },
      { text: 'The API stores the grant and writes an audit-log entry.', nodes: ['api', 'db'], edges: ['api-db'], calls: [['api', 'db', 'insert grant + audit log']] },
      {
        text: 'When the workshop opens the car, the API checks ownership or an active grant on every request. Anything else returns “not found”.',
        nodes: ['api', 'db'],
        edges: ['api-db'],
        calls: [['web', 'api', 'workshop opens the car'], ['api', 'db', 'owner or active grant?'], ['api', 'web', 'records, or “not found”']],
      },
    ],
  },
  {
    id: 'verify',
    label: 'Verify a record',
    steps: [
      { text: 'You ask to verify a saved record.', nodes: ['web', 'api'], edges: ['web-api'], calls: [['web', 'api', 'GET verify']] },
      { text: 'The API recomputes the fingerprint from the record as it is stored now.', nodes: ['api', 'db'], edges: ['api-db'], calls: [['api', 'db', 'load record'], ['api', 'api', 'recompute SHA-256']] },
      {
        text: 'It reads the anchored fingerprint from the ledger (VerifyEvent) and compares the two: a match means unchanged since saving.',
        nodes: ['api', 'gateway', 'fabric'],
        edges: ['api-gateway', 'gateway-fabric'],
        calls: [['api', 'gateway', 'VerifyEvent'], ['gateway', 'fabric', 'read anchored hash'], ['api', 'web', 'unchanged / changed']],
      },
    ],
  },
];

export const STACK: { group: string; items: { name: string; version?: string; why: string }[] }[] = [
  {
    group: 'Frontend',
    items: [
      { name: 'Next.js', version: '16.3', why: 'Pre-renders public pages for speed and search, and hosts the app in one codebase.' },
      { name: 'React', version: '19.2', why: 'Component model for the interactive tools.' },
      { name: 'TypeScript', version: '5', why: 'Catches mistakes in money calculations before they ship.' },
      { name: 'Tailwind CSS', version: '4', why: 'Design tokens (colours, type, spacing) in one place.' },
      { name: 'Framer Motion', version: '13', why: 'Animations that switch off when your device asks for reduced motion.' },
      { name: 'three.js', version: '0.170', why: 'The 3D car for marking damage, loaded only on that step.' },
      { name: 'Sonner and Lucide', why: 'Notifications and icons.' },
    ],
  },
  {
    group: 'Backend',
    items: [
      { name: 'Python', version: '3.12', why: 'The original claim engine and PDF reading live here.' },
      { name: 'FastAPI', version: '0.141', why: 'Typed request validation and automatic API docs.' },
      { name: 'Pydantic', version: '2.13', why: 'Validates every input and the server settings at start-up.' },
      { name: 'pdfplumber', version: '0.11', why: 'Reads text and tables from PDFs, so each value can cite its page.' },
      { name: 'Tesseract OCR', version: '5', why: 'Reads scanned PDFs and photos of documents, installed in the server image.' },
      { name: 'SlowAPI', version: '0.1', why: 'Per-client rate limits on sensitive endpoints.' },
      { name: 'PyJWT', version: '2.14', why: 'Verifies sign-in tokens locally against cached public keys.' },
    ],
  },
  {
    group: 'Data and identity',
    items: [
      { name: 'Supabase Postgres', why: 'Relational data with foreign keys; migrations kept in the repo.' },
      { name: 'Supabase Auth', why: 'Email sign-in with ES256-signed tokens.' },
    ],
  },
  {
    group: 'Ledger',
    items: [
      { name: 'Hyperledger Fabric', version: '2.5', why: 'Permissioned ledger: known organisations, no cryptocurrency, no public mining.' },
      { name: 'Fabric chaincode (JavaScript)', why: 'RecordEvent, GetVehicleHistory and VerifyEvent.' },
      { name: 'Node.js gateway', why: 'Express service the API calls, protected by an API key.' },
    ],
  },
  {
    group: 'Hosting and quality',
    items: [
      { name: 'Vercel', why: 'Builds and serves the website on every push to main.' },
      { name: 'Render', why: 'Runs the API in a Docker container in Singapore.' },
      { name: 'pytest', why: '64 backend tests: access rules, ledger states, uploads, OCR handling, tokens.' },
      { name: 'Golden tests', why: '305 cases keep the browser and server engines identical.' },
      { name: 'ESLint and TypeScript checks', why: 'Run before each release; not yet automated in CI.' },
    ],
  },
];

export const TABLES: { name: string; holds: string; links: string[] }[] = [
  { name: 'profiles', holds: 'Each account and its role', links: ['organizations', 'ownership_history', 'consents', 'audit_logs'] },
  { name: 'organizations', holds: 'Fleets, workshops, insurers, surveyors', links: ['profiles', 'consents', 'policies'] },
  { name: 'vehicles', holds: 'Registration, make, model, IDV, NCB', links: ['ownership_history', 'policies', 'claims', 'consents', 'documents'] },
  { name: 'ownership_history', holds: 'Who registered each vehicle', links: ['vehicles', 'profiles'] },
  { name: 'policies', holds: 'Policy number, IDV, deductible, dates', links: ['vehicles', 'organizations', 'claims'] },
  { name: 'claims', holds: 'Saved claim checks and their figures', links: ['vehicles', 'policies', 'ledger_references', 'documents'] },
  { name: 'ledger_references', holds: 'Fingerprint, ledger status, transaction ID', links: ['claims'] },
  { name: 'consents', holds: 'Who may see which vehicle, until when', links: ['vehicles', 'organizations', 'profiles'] },
  { name: 'documents', holds: 'Metadata of read documents (not the file)', links: ['claims', 'vehicles'] },
  { name: 'audit_logs', holds: 'Grants, revocations and other changes', links: ['profiles'] },
];

export const TRADEOFFS = [
  {
    title: 'Calculations run in the browser',
    gain: 'Instant results, no server cost per check, and your figures never leave your device.',
    cost: 'The same rules exist in TypeScript and Python. 305 shared test cases keep them identical.',
  },
  {
    title: 'Fingerprints on a ledger, data in Postgres',
    gain: 'Records stay private and quick to read; the ledger only proves they weren’t edited later.',
    cost: 'A second system to run. It proves a record is unchanged, not that what it describes is true.',
  },
  {
    title: 'Access checks in the API, not database row rules',
    gain: 'One place to read and test every rule; cross-account access is covered by tests.',
    cost: 'The API must never leak its database key. It lives only in server settings.',
  },
  {
    title: 'Rules and OCR for documents, no AI model',
    gain: 'Predictable and explainable; every value cites its page, and photos work too.',
    cost: 'Unusual layouts can hide a field, and OCR can misread digits, so the user always reviews the values.',
  },
  {
    title: 'A guide-based assistant, no language model',
    gain: 'Free, instant, and it can’t invent policy rules.',
    cost: 'It only answers what the guide covers, and says so when it can’t.',
  },
  {
    title: 'Exact fleet optimisation, with a cap',
    gain: 'Up to 12 incidents per vehicle, every claim/pay combination is tried (4,096), so the plan is truly the cheapest.',
    cost: 'Above 12 it switches to a fast rule of thumb that may miss the very best plan.',
  },
  {
    title: 'Free hosting tiers',
    gain: 'Costs nothing to run while the product is young.',
    cost: 'The API sleeps when idle, so the first request can take 30 to 60 seconds. The app shows a waking-up message.',
  },
];

export const SCALE = [
  { area: 'Claim checks', today: 'Run in each visitor’s browser, so more users add no server load.', next: 'Nothing to change: this part scales with the number of devices.' },
  { area: 'Public pages', today: 'Pre-rendered and served from Vercel’s CDN.', next: 'Already global; new guide articles are generated at build time.' },
  { area: 'API', today: 'One stateless container on Render’s free tier. Tokens are verified locally, profiles cached for 60 seconds, status for 30.', next: 'Run several instances behind a load balancer on a paid plan so it never sleeps. Move the in-memory caches to a shared cache such as Redis.' },
  { area: 'Database', today: 'Lists load in a fixed number of queries (no query per row), with lookups by key.', next: 'Connection pooling, indexes tuned from real traffic, and a read replica for history pages.' },
  { area: 'Ledger writes', today: 'Done while saving; if the ledger is down the record is kept as pending and can be retried safely.', next: 'Move anchoring to a background queue that batches fingerprints, and run peers for each participating organisation.' },
  { area: 'PDF reading', today: 'In the API process, one file at a time per request, 10 MB cap.', next: 'Move to a separate worker so large files never slow other requests; add scanned-page support.' },
  { area: 'Abuse', today: 'Per-client rate limits, size limits and strict input validation.', next: 'Add a web application firewall and per-account quotas.' },
];
