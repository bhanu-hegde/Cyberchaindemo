import { createHmac, createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT ?? 5000);
const TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'replace-this-in-production';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const createTimestamp = () =>
  new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;

const shortHash = (value) => `0x${createHash('sha256').update(String(value)).digest('hex').slice(0, 12)}`;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const base64UrlEncode = (value) =>
  Buffer.from(typeof value === 'string' ? value : JSON.stringify(value))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const base64UrlDecode = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
};

const signToken = (payload) => {
  const encodedPayload = base64UrlEncode(payload);
  const signature = createHmac('sha256', TOKEN_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
};

const verifyToken = (token) => {
  const [encodedPayload, signature] = String(token).split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = createHmac('sha256', TOKEN_SECRET).update(encodedPayload).digest();
  const providedSignature = Buffer.from(signature, 'base64url');

  if (expectedSignature.length !== providedSignature.length) return null;
  if (!timingSafeEqual(expectedSignature, providedSignature)) return null;

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
};

const hashPassword = (password, salt = randomBytes(16).toString('hex')) => ({
  salt,
  hash: scryptSync(password, salt, 64).toString('hex'),
});

const verifyPassword = (password, salt, hash) => {
  const candidate = scryptSync(password, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const readJson = (req) =>
  new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });

    req.on('error', reject);
  });

const serializeUser = (user, viewer) => {
  const isAdminViewer = viewer?.role === 'admin';
  const isSelf = viewer?.id === user.id;

  return {
    id: user.id,
    name: user.name,
    email: isAdminViewer || isSelf ? user.email : undefined,
    role: user.role,
    balance: isAdminViewer || isSelf ? user.balance : undefined,
    riskScore: user.riskScore,
  };
};

const withImmutableHash = (transaction) => ({
  ...transaction,
  immutableHash: shortHash(
    `${transaction.id}|${transaction.fromUserId}|${transaction.toUserId}|${transaction.amount}|${transaction.timestamp}`,
  ),
});

const seedUsers = [
  { id: 'u-admin', name: 'System Admin', email: 'admin@cyberchain.app', role: 'admin', balance: 450000, riskScore: 'low', password: 'Admin@123' },
  { id: 'u-1001', name: 'Aarav Sharma', email: 'aarav@cyberchain.app', role: 'user', balance: 2450, riskScore: 'medium', password: 'User@123' },
  { id: 'u-1002', name: 'Diya Verma', email: 'diya@cyberchain.app', role: 'user', balance: 3725, riskScore: 'low', password: 'User@123' },
  { id: 'u-1003', name: 'Kabir Singh', email: 'kabir@cyberchain.app', role: 'user', balance: 1980, riskScore: 'medium', password: 'User@123' },
  { id: 'u-1004', name: 'Meera Iyer', email: 'meera@cyberchain.app', role: 'user', balance: 4210, riskScore: 'low', password: 'User@123' },
];

const createSeedTransactions = () => [
  withImmutableHash({
    id: 'tx-1101',
    fromUserId: 'u-admin',
    toUserId: 'u-1001',
    from: 'System Admin',
    to: 'Aarav Sharma',
    amount: 1200,
    status: 'settled',
    timestamp: '09:10:12 AM',
    integrity: 'clean',
    route: 'admin reserve -> payment gateway -> central ledger',
    note: 'Treasury allocation moved to end-user wallet.',
    flags: ['reserve-allocation'],
  }),
  withImmutableHash({
    id: 'tx-1102',
    fromUserId: 'u-1001',
    toUserId: 'u-1002',
    from: 'Aarav Sharma',
    to: 'Diya Verma',
    amount: 150,
    status: 'settled',
    timestamp: '09:24:48 AM',
    integrity: 'clean',
    route: 'wallet -> payment gateway -> central ledger',
    note: 'Peer payment approved by centralized verifier.',
    flags: ['verified'],
  }),
  withImmutableHash({
    id: 'tx-1103',
    fromUserId: 'u-1002',
    toUserId: 'u-1003',
    from: 'Diya Verma',
    to: 'Kabir Singh',
    amount: 210,
    status: 'settled',
    timestamp: '10:05:03 AM',
    integrity: 'clean',
    route: 'wallet -> payment gateway -> central ledger',
    note: 'Routine transfer across customer wallets.',
    flags: ['verified'],
  }),
  withImmutableHash({
    id: 'tx-1104',
    fromUserId: 'u-1003',
    toUserId: 'u-1004',
    from: 'Kabir Singh',
    to: 'Meera Iyer',
    amount: 90,
    status: 'settled',
    timestamp: '10:18:29 AM',
    integrity: 'clean',
    route: 'wallet -> payment gateway -> central ledger',
    note: 'Small-value transfer settled through centralized processing.',
    flags: ['verified'],
  }),
];

const createSeedLogs = () => [
  { id: 'log-1', timestamp: '09:00:01 AM', tone: 'info', message: 'Payment gateway is online and accepting transfer requests.' },
  { id: 'log-2', timestamp: '09:02:19 AM', tone: 'success', message: 'Treasury reserve synced for initial user wallet provisioning.' },
  { id: 'log-3', timestamp: '09:04:33 AM', tone: 'info', message: 'Central ledger replication is running in active mode.' },
];

const createBlocks = (transactions, systemMode) => {
  const blocks = [];

  transactions.slice(0, 8).forEach((tx, index) => {
    const previousHash = index === 0 ? 'GENESIS' : blocks[index - 1].hash;
    const data = `${tx.from} -> ${tx.to} | ${tx.amount} | ${tx.status}`;

    blocks.push({
      id: `block-${index + 1}`,
      label: `Block ${index + 1}`,
      transactionId: tx.id,
      data,
      previousHash,
      hash: shortHash(`${tx.id}:${data}:${previousHash}`),
      edited: false,
      attackVector: null,
      threatSignal: false,
      consensusLayer: systemMode === 'blockchain' ? 'active' : 'inactive',
    });
  });

  return blocks;
};

const isChainValid = (blocks) =>
  blocks.every((block, index) => {
    if (index === 0) return block.previousHash === 'GENESIS' && !block.edited;
    return block.previousHash === blocks[index - 1].hash && !block.edited;
  });

const createInitialState = () => {
  const users = seedUsers.map((entry) => {
    const { salt, hash } = hashPassword(entry.password);

    return {
      id: entry.id,
      name: entry.name,
      email: normalizeEmail(entry.email),
      role: entry.role,
      balance: entry.balance,
      riskScore: entry.riskScore,
      passwordSalt: salt,
      passwordHash: hash,
    };
  });

  const systemMode = 'centralized';
  const transactions = createSeedTransactions();

  return {
    schemaVersion: 1,
    systemMode,
    recovery: {
      status: 'idle',
      lastRecoveryAt: null,
    },
    users,
    transactions,
    logs: createSeedLogs(),
    attackState: {
      type: null,
      level: 'stable',
      title: 'No active threat',
      message: 'Transaction pipeline is stable with no detected intrusion.',
      impacts: [],
    },
    attackEvidence: [],
    blocks: createBlocks(transactions, systemMode),
  };
};

const ensureDataDir = () => {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
};

const saveState = (state) => {
  ensureDataDir();
  writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf8');
};

const loadState = () => {
  ensureDataDir();

  if (!existsSync(DB_FILE)) {
    const seeded = createInitialState();
    saveState(seeded);
    return seeded;
  }

  try {
    const raw = readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    if (!parsed?.users || !parsed?.transactions || !parsed?.blocks) {
      throw new Error('Invalid database schema');
    }

    parsed.attackEvidence = Array.isArray(parsed.attackEvidence) ? parsed.attackEvidence : [];
    parsed.recovery = parsed.recovery ?? { status: 'idle', lastRecoveryAt: null };
    parsed.systemMode = parsed.systemMode === 'blockchain' ? 'blockchain' : 'centralized';

    return parsed;
  } catch {
    const seeded = createInitialState();
    saveState(seeded);
    return seeded;
  }
};

let state = loadState();

const appendLog = (message, tone = 'info') => {
  state.logs.unshift({
    id: createId('log'),
    timestamp: createTimestamp(),
    tone,
    message,
  });

  state.logs = state.logs.slice(0, 32);
};

const pushAttackEvidence = ({ attackType, summary, rows }) => {
  const evidenceRows = Array.isArray(rows) ? rows : [];

  state.attackEvidence.unshift({
    id: createId('evidence'),
    attackType,
    summary,
    timestamp: createTimestamp(),
    rows: evidenceRows.map((row) => ({
      key: row.key,
      before: String(row.before),
      after: String(row.after),
      changed: String(row.before) !== String(row.after),
    })),
  });

  state.attackEvidence = state.attackEvidence.slice(0, 20);
};

const markThreatSignal = (type) => {
  if (!state.blocks.length) return;

  let targetIndex = 0;
  if (type === 'mitm') targetIndex = Math.min(1, state.blocks.length - 1);
  if (type === 'tampering') targetIndex = Math.min(2, state.blocks.length - 1);
  if (type === 'double') targetIndex = Math.min(3, state.blocks.length - 1);

  const block = state.blocks[targetIndex];
  if (!block) return;

  block.threatSignal = true;
  block.attackVector = type;

  if (state.systemMode === 'centralized') {
    const compromisedData = `${block.data} | anomaly:${type.toUpperCase()}#${Math.floor(Math.random() * 900 + 100)}`;
    block.data = compromisedData;
    block.hash = shortHash(`${block.transactionId}:${compromisedData}:${block.previousHash}`);
    block.edited = true;
  }
};

const calculateSecurityScore = () => {
  const compromised = state.transactions.filter((tx) => tx.integrity === 'compromised').length;
  const warning = state.transactions.filter((tx) => tx.integrity === 'warning').length;
  const chainPenalty = isChainValid(state.blocks) ? 0 : 30;
  const attackPenalty = state.attackState.level === 'critical' ? 15 : state.attackState.level === 'warning' ? 8 : 0;
  const modeBonus = state.systemMode === 'blockchain' ? 8 : 0;

  const raw = 100 - compromised * 8 - warning * 4 - chainPenalty - attackPenalty + modeBonus;
  return Math.max(12, Math.min(100, raw));
};

const buildStateFor = (viewer) => {
  const visibleTransactions =
    viewer.role === 'admin'
      ? state.transactions
      : state.transactions.filter((tx) => tx.fromUserId === viewer.id || tx.toUserId === viewer.id);

  const compromisedCount = state.transactions.filter((tx) => tx.integrity === 'compromised').length;
  const warningCount = state.transactions.filter((tx) => tx.integrity === 'warning').length;

  const securityScore = calculateSecurityScore();

  return {
    profile: serializeUser(viewer, viewer),
    role: viewer.role,
    users: state.users.map((user) => serializeUser(user, viewer)),
    transactions: clone(visibleTransactions),
    logs: clone(state.logs),
    blocks: clone(state.blocks),
    attackState: clone(state.attackState),
    attackEvidence: clone(state.attackEvidence),
    chainValid: isChainValid(state.blocks),
    securityScore,
    systemHealth: securityScore > 84 ? 'Healthy' : securityScore > 62 ? 'Elevated Risk' : 'Compromised',
    totalValue: state.users.reduce((sum, user) => sum + user.balance, 0),
    systemMode: state.systemMode,
    recoveryStatus: state.recovery.status,
    lastRecoveryAt: state.recovery.lastRecoveryAt,
    compromisedCount,
    warningCount,
  };
};

const createAuthPayload = (user) => ({
  sub: user.id,
  role: user.role,
  exp: Date.now() + TOKEN_TTL_MS,
});

const getAuthorizedUser = (req) => {
  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Bearer ')) return null;

  const token = header.slice(7).trim();
  const payload = verifyToken(token);
  if (!payload?.sub) return null;

  return state.users.find((entry) => entry.id === payload.sub) ?? null;
};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(payload));
};

const ensureAdmin = (user, res) => {
  if (user.role !== 'admin') {
    sendJson(res, 403, { error: 'Admin privileges are required for this action.' });
    return false;
  }

  return true;
};

const persist = () => {
  saveState(state);
};

const createTransfer = ({ id, fromUserId, toUserId, from, to, amount, status, note, flags, route }) =>
  withImmutableHash({
    id,
    fromUserId,
    toUserId,
    from,
    to,
    amount,
    status,
    timestamp: createTimestamp(),
    integrity: 'clean',
    route,
    note,
    flags,
  });

const runAttackOnCentralized = (type) => {
  if (type === 'mitm') {
    const target = state.transactions[0];
    const originalAmount = target.amount;
    target.amount = Math.round(target.amount * 1.42);
    target.status = 'intercepted in transit';
    target.integrity = 'compromised';
    target.note = 'Transfer amount was altered during gateway interception.';
    target.flags = [...new Set([...(target.flags ?? []), 'mitm', 'intercepted'])];
    target.impact = { originalAmount, modifiedAmount: target.amount };

    state.attackState = {
      type,
      level: 'critical',
      title: 'MITM interception detected',
      message: 'An attacker modified transaction amount while data was moving through the gateway.',
      impacts: [
        `Original amount: INR ${originalAmount}`,
        `Modified amount: INR ${target.amount}`,
        'Integrity downgraded to compromised',
      ],
    };

    appendLog('MITM interception changed transfer amount before ledger persistence.', 'danger');

    pushAttackEvidence({
      attackType: 'mitm',
      summary: 'MITM changed transaction amount in transit',
      rows: [
        { key: 'amount', before: originalAmount, after: target.amount },
        { key: 'status', before: 'settled', after: target.status },
        { key: 'integrity', before: 'clean', after: target.integrity },
      ],
    });
  }

  if (type === 'tampering') {
    state.transactions = state.transactions.map((entry, index) => {
      if (index > 1) return entry;

      const originalAmount = entry.amount;
      const modifiedAmount = entry.amount + (index + 1) * 120;

      return {
        ...entry,
        amount: modifiedAmount,
        status: 'record tampered',
        integrity: 'compromised',
        note: 'Ledger record fields were altered after settlement.',
        flags: [...new Set([...(entry.flags ?? []), 'tampered'])],
        impact: { originalAmount, modifiedAmount },
      };
    });

    state.attackState = {
      type,
      level: 'critical',
      title: 'Ledger tampering detected',
      message: 'Historical transaction records were modified inside centralized storage.',
      impacts: [
        'At least two records had amount and status overwritten',
        'Centralized history can be altered without chain-level consensus',
      ],
    };

    appendLog('Data tampering altered stored transaction history entries.', 'danger');

    const impactedRows = state.transactions
      .slice(0, 2)
      .map((entry) => ({
        key: `${entry.id} amount`,
        before: entry.impact?.originalAmount ?? entry.amount,
        after: entry.amount,
      }));

    pushAttackEvidence({
      attackType: 'tampering',
      summary: 'Stored ledger values were modified post-settlement',
      rows: impactedRows,
    });
  }

  if (type === 'double') {
    const source = state.transactions[0];
    const duplicate = {
      ...source,
      id: createId('tx'),
      timestamp: createTimestamp(),
      status: 'duplicate pending reconciliation',
      integrity: 'warning',
      note: 'Duplicate transfer entered queue before reconciliation lock.',
      flags: [...new Set([...(source.flags ?? []), 'double-spend'])],
    };

    state.transactions.unshift(duplicate);

    state.attackState = {
      type,
      level: 'critical',
      title: 'Double-spend attempt detected',
      message: 'A duplicate transfer was inserted ahead of settlement reconciliation.',
      impacts: [
        'Duplicate transaction id entered pipeline',
        'Reconciliation queue must resolve conflicting spend intents',
      ],
    };

    appendLog('Double-spending attempt inserted a duplicate transfer record.', 'danger');

    pushAttackEvidence({
      attackType: 'double',
      summary: 'Duplicate spend intent entered the queue',
      rows: [
        { key: 'queue_count', before: state.transactions.length - 1, after: state.transactions.length },
        { key: 'duplicate_status', before: 'none', after: duplicate.status },
      ],
    });
  }
};

const runAttackBlockedByBlockchain = (type) => {
  const snapshot = state.transactions[0];
  state.attackState = {
    type,
    level: 'warning',
    title: 'Attack attempt detected and blocked',
    message: 'Consensus verification rejected malicious mutation before ledger compromise.',
    impacts: [
      'Threat telemetry captured and block flagged',
      'Ledger values remained canonical',
      'Blockchain consensus prevented silent corruption',
    ],
  };
    appendLog(`Attack attempt (${type}) was blocked by blockchain consensus controls.`, 'warning');
  pushAttackEvidence({
        attackType: `${type}-blocked`,
    summary: 'Consensus validation blocked mutation before ledger write.',
    rows: [
      { key: 'system_mode', before: 'blockchain', after: 'blockchain' },
      { key: 'ledger_mutation', before: 'blocked', after: 'blocked' },
      { key: 'reference_tx', before: snapshot?.id ?? 'n/a', after: snapshot?.id ?? 'n/a' },
    ],
  });
};
const recalculateProofOfWork = () => {
  state.recovery.status = 'in_progress';
  
  let currentHash = 'GENESIS';
  state.blocks.forEach((block) => {
    block.previousHash = currentHash;
    block.hash = shortHash(`${block.transactionId}:${block.data}:${currentHash}`);
    currentHash = block.hash;
    block.edited = false;
    block.threatSignal = false;
    block.attackVector = null;
  });

  state.systemMode = 'blockchain';
  state.attackState = {
    type: null,
    level: 'stable',
    title: 'Chain re-mined via Proof of Work',
    message: 'Hashes recalculated from corrupted data. Chain is valid, but original data was lost.',
    impacts: [
      'Hashes recalculated to accept current block data',
      'Chain linkage rebuilt and verified',
      'Consensus mode enabled for future transfers',
    ],
  };
  state.recovery = {
    status: 'secured',
    lastRecoveryAt: createTimestamp(),
  };

  appendLog('Proof of Work recalculation complete. New genesis to tip constructed.', 'warning');
};

const rollbackState = () => {
  state.recovery.status = 'in_progress';
  
  const validBlocks = [];
  let currentHash = 'GENESIS';
  
  for (const block of state.blocks) {
    if (block.edited || block.previousHash !== currentHash) break;
    validBlocks.push(block);
    currentHash = block.hash;
  }
  
  state.blocks = validBlocks;
  const validTxIds = state.blocks.map(b => b.transactionId);
  state.transactions = state.transactions.filter(tx => validTxIds.includes(tx.id));

  state.systemMode = 'blockchain';
  state.attackState = {
    type: null,
    level: 'stable',
    title: 'System state rolled back',
    message: 'Corrupted blocks and associated transactions were dropped to preserve integrity.',
    impacts: [
      'Corrupted blocks permanently deleted',
      'Unverified transactions dropped from ledger',
      'Consensus mode enabled for future transfers',
    ],
  };
  state.recovery = {
    status: 'secured',
    lastRecoveryAt: createTimestamp(),
  };

  appendLog('State rollback complete. Compromised blocks were purged.', 'warning');
};

const reconcileWithBlockchain = () => {
  state.recovery.status = 'in_progress';

  state.transactions = state.transactions.map((tx) => {
    if (tx.integrity === 'clean') {
      return tx;
    }

    let nextAmount = tx.amount;

    if (Number.isFinite(tx.impact?.originalAmount)) {
      nextAmount = tx.impact.originalAmount;
    }

    return {
      ...tx,
      amount: nextAmount,
      integrity: 'clean',
      status: tx.flags?.includes('double-spend') ? 'duplicate rejected by consensus' : 'reconciled by blockchain consensus',
      note: 'Consensus reconciliation restored canonical transaction values.',
      flags: [...new Set([...(tx.flags ?? []), 'reconciled'])],
      impact: undefined,
    };
  });

  state.systemMode = 'blockchain';
  state.blocks = createBlocks(state.transactions, state.systemMode);
  state.attackState = {
    type: null,
    level: 'stable',
    title: 'Ledger secured by blockchain consensus',
    message: 'Canonical values restored and chain integrity re-established.',
    impacts: [
      'Compromised transfers reconciled',
      'Chain linkage rebuilt and verified',
      'Consensus mode enabled for future transfers',
    ],
  };
  state.recovery = {
    status: 'secured',
    lastRecoveryAt: createTimestamp(),
  };

  appendLog('Blockchain recovery workflow completed; ledger integrity restored.', 'success');

  pushAttackEvidence({
    attackType: 'recovery',
    summary: 'Blockchain reconciliation restored canonical ledger state',
    rows: [
      { key: 'recovery_status', before: 'required', after: 'secured' },
      { key: 'system_mode', before: 'centralized', after: 'blockchain' },
    ],
  });
};

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const { pathname } = url;

  try {
    if (req.method === 'GET' && pathname === '/api/health') {
      sendJson(res, 200, { status: 'ok', service: 'cyberchain-api' });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/auth/register') {
      const body = await readJson(req);
      const name = String(body.name || '').trim();
      const email = normalizeEmail(body.email);
      const password = String(body.password || '');

      if (!name || !email || password.length < 8) {
        sendJson(res, 400, { error: 'Name, valid email, and password (min 8 characters) are required.' });
        return;
      }

      const exists = state.users.some((entry) => entry.email === email);
      if (exists) {
        sendJson(res, 409, { error: 'An account with this email already exists.' });
        return;
      }

      const { salt, hash } = hashPassword(password);
      const newUser = {
        id: createId('u'),
        name,
        email,
        role: 'user',
        balance: 1200,
        riskScore: 'medium',
        passwordSalt: salt,
        passwordHash: hash,
      };

      state.users.push(newUser);
      appendLog(`New account created for ${name}.`, 'success');
      persist();

      const token = signToken(createAuthPayload(newUser));
      sendJson(res, 201, {
        token,
        user: serializeUser(newUser, newUser),
        state: buildStateFor(newUser),
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const body = await readJson(req);
      const email = normalizeEmail(body.email);
      const password = String(body.password || '');

      const user = state.users.find((entry) => entry.email === email);
      if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
        sendJson(res, 401, { error: 'Invalid email or password.' });
        return;
      }

      appendLog(`${user.name} signed in.`, 'info');
      persist();

      const token = signToken(createAuthPayload(user));
      sendJson(res, 200, {
        token,
        user: serializeUser(user, user),
        state: buildStateFor(user),
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/state') {
      const user = getAuthorizedUser(req);
      if (!user) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return;
      }

      sendJson(res, 200, buildStateFor(user));
      return;
    }

    const user = getAuthorizedUser(req);
    if (!user) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/transactions/send') {
      const body = await readJson(req);
      const recipientId = String(body.recipientId || '');
      const amount = Number(body.amount);

      if (!recipientId || !Number.isFinite(amount) || amount <= 0) {
        sendJson(res, 400, { error: 'Recipient and valid amount are required.' });
        return;
      }

      const sender = state.users.find((entry) => entry.id === user.id);
      const recipient = state.users.find((entry) => entry.id === recipientId);

      if (!sender || !recipient || sender.id === recipient.id) {
        sendJson(res, 400, { error: 'Invalid recipient.' });
        return;
      }

      if (sender.balance < amount) {
        sendJson(res, 400, { error: 'Insufficient wallet balance.' });
        return;
      }

      sender.balance -= amount;
      recipient.balance += amount;

      const settlementLabel = state.systemMode === 'blockchain' ? 'consensus settled' : 'settled';
      const route =
        state.systemMode === 'blockchain'
          ? 'wallet -> consensus mempool -> chained ledger'
          : 'wallet -> payment gateway -> central ledger';

      state.transactions.unshift(
        createTransfer({
          id: createId('tx'),
          fromUserId: sender.id,
          toUserId: recipient.id,
          from: sender.name,
          to: recipient.name,
          amount,
          status: settlementLabel,
          route,
          note:
            state.systemMode === 'blockchain'
              ? 'Transfer validated through blockchain consensus rules.'
              : 'Transfer passed through centralized validation checks.',
          flags: state.systemMode === 'blockchain' ? ['on-chain', 'verified'] : ['verified'],
        }),
      );

      state.blocks = createBlocks(state.transactions, state.systemMode);
      state.attackState = {
        type: null,
        level: 'stable',
        title: 'No active threat',
        message: 'Transaction pipeline is stable with no detected intrusion.',
        impacts: [],
      };

      appendLog(`Transfer of INR ${amount} moved from ${sender.name} to ${recipient.name}.`, 'success');
      persist();

      sendJson(res, 200, { state: buildStateFor(user) });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/admin/credit') {
      if (!ensureAdmin(user, res)) return;

      const body = await readJson(req);
      const targetId = String(body.userId || '');
      const amount = Number(body.amount);

      if (!targetId || !Number.isFinite(amount) || amount <= 0) {
        sendJson(res, 400, { error: 'User and valid amount are required.' });
        return;
      }

      const targetUser = state.users.find((entry) => entry.id === targetId);
      if (!targetUser || targetUser.role !== 'user') {
        sendJson(res, 400, { error: 'Target user not found.' });
        return;
      }

      targetUser.balance += amount;

      state.transactions.unshift(
        createTransfer({
          id: createId('tx'),
          fromUserId: 'u-admin',
          toUserId: targetUser.id,
          from: 'System Admin',
          to: targetUser.name,
          amount,
          status: state.systemMode === 'blockchain' ? 'on-chain treasury credit' : 'treasury credit',
          route:
            state.systemMode === 'blockchain'
              ? 'admin reserve -> consensus mempool -> chained ledger'
              : 'admin reserve -> payment gateway -> central ledger',
          note:
            state.systemMode === 'blockchain'
              ? 'Treasury credit validated via consensus before settlement.'
              : 'Treasury reserve credited to customer wallet.',
          flags: state.systemMode === 'blockchain' ? ['admin-credit', 'on-chain'] : ['admin-credit'],
        }),
      );

      state.blocks = createBlocks(state.transactions, state.systemMode);
      appendLog(`Treasury credit of INR ${amount} issued to ${targetUser.name}.`, 'success');
      persist();
      sendJson(res, 200, { state: buildStateFor(user) });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/system/mode') {
      const body = await readJson(req);
      const mode = String(body.mode || '').toLowerCase();

      if (!['centralized', 'blockchain'].includes(mode)) {
        sendJson(res, 400, { error: 'Mode must be either centralized or blockchain.' });
        return;
      }

      state.systemMode = mode;
      state.blocks = createBlocks(state.transactions, state.systemMode);

      appendLog(
        mode === 'blockchain'
          ? 'Blockchain consensus mode enabled for transaction settlement.'
          : 'Centralized processing mode enabled for transaction settlement.',
        'info',
      );
      persist();

      sendJson(res, 200, { state: buildStateFor(user) });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/attacks/trigger') {
      const body = await readJson(req);
      const type = String(body.type || '').toLowerCase();

      if (!['mitm', 'tampering', 'double'].includes(type)) {
        sendJson(res, 400, { error: 'Unsupported attack type.' });
        return;
      }

      if (!state.transactions.length) {
        sendJson(res, 400, { error: 'No transactions available for attack simulation.' });
        return;
      }

      if (state.systemMode === 'blockchain') {
        runAttackBlockedByBlockchain(type);
        markThreatSignal(type);
      } else {
        runAttackOnCentralized(type);
        state.blocks = createBlocks(state.transactions, state.systemMode);
        markThreatSignal(type);
      }

      state.recovery.status = state.attackState.level === 'critical' ? 'required' : state.recovery.status;
      persist();
      sendJson(res, 200, { state: buildStateFor(user) });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/blockchain/recover') {
      const body = await readJson(req);
      const method = String(body.method || 'pbft').toLowerCase();
      
      if (method === 'pow') recalculateProofOfWork();
      else if (method === 'rollback') rollbackState();
      else reconcileWithBlockchain();
      
      persist();
      sendJson(res, 200, { state: buildStateFor(user) });
      return;
    }

    if (req.method === 'PATCH' && pathname.startsWith('/api/blockchain/')) {
      const blockId = pathname.split('/').at(-1);
      const body = await readJson(req);
      const data = String(body.data || '').trim();

      if (!data) {
        sendJson(res, 400, { error: 'Block data is required.' });
        return;
      }

      const block = state.blocks.find((entry) => entry.id === blockId);
      if (!block) {
        sendJson(res, 404, { error: 'Block not found.' });
        return;
      }
      const previousData = block.data;
      const previousHash = block.hash;
      block.data = data;
            block.hash = shortHash(`${block.transactionId}:${data}:${block.previousHash}`);
      block.edited = true;
      block.attackVector = block.attackVector ?? 'manual-edit';
      block.threatSignal = true;
      state.attackState = {
        type: 'manual-edit',
        level: 'critical',
        title: 'Manual chain mutation detected',
        message: 'Block payload changed without consensus recalculation.',
        impacts: ['Hash-link inconsistency triggered integrity failure.'],
      };
      state.recovery.status = 'required';
            appendLog(`Block ${block.label} was manually edited; integrity check failed.`, 'danger');
      pushAttackEvidence({
        attackType: 'manual-edit',
                summary: `Manual mutation applied to ${block.label} without consensus.`,
        rows: [
                    { key: `${block.label} data`, before: previousData, after: block.data },
                    { key: `${block.label} hash`, before: previousHash, after: block.hash },
          { key: 'chain_valid', before: 'true', after: String(isChainValid(state.blocks)) },
        ],
      });
      persist();
      sendJson(res, 200, { state: buildStateFor(user) });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/system/reset') {
      if (!ensureAdmin(user, res)) return;

      state = createInitialState();
      appendLog(`System state reset by ${user.name}; ledgers returned to baseline.`, 'info');
      persist();

      const nextAdmin = state.users.find((entry) => entry.id === 'u-admin') ?? state.users[0];
      sendJson(res, 200, { state: buildStateFor(nextAdmin) });
      return;
    }

    sendJson(res, 404, { error: 'Route not found.' });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unexpected server failure.',
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`CyberChain API running on http://127.0.0.1:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Database file: ${DB_FILE}`);
});









