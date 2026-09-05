import { structuralThreat } from './securityGuard';
import { sealPrivate, openPrivate } from './dataProtection';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export type SecuritySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type SecurityActionTaken = 'BLOCKED_AND_QUARANTINED' | 'USER_ACCOUNT_PAUSED' | 'SELF_REPAIRED' | 'WARNED' | 'OBSERVED';

export interface AccountSecurityState {
  accountId: string;
  userEmail?: string;
  status: 'ACTIVE' | 'PAUSED' | 'QUARANTINED';
  pausedUntil: number;
  pauseReason: string;
  requestTimestamps: number[];
  rapidClicksCount: number;
  totalRequests: number;
  trustScore: number;
  lastRequestTime: number;
}

export interface SecurityIncident {
  id: string;
  timestamp: string;
  threatOriginIp: string;
  userAgent: string;
  endpoint: string;
  method: string;
  severity: SecuritySeverity;
  threatType: string;
  rawSignatureExcerpt: string;
  actionTaken: SecurityActionTaken;
  autoRepairApplied?: string;
  quarantineUntil?: number;
  recommendedRemediation: string;
}

export interface SecurityStats {
  totalRequestsInspected: number;
  threatsBlocked: number;
  selfRepairsExecuted: number;
  activeQuarantinedIps: number;
  quarantinedIps: string[];
  severityCounts: Record<SecuritySeverity, number>;
  uptimeSeconds: number;
  lastIncidentTimestamp?: string;
}

const LOGS_DIR = path.join(process.cwd(), 'logs');
const AUDIT_FILE = path.join(LOGS_DIR, 'security-audit.json');
const HEALTH_LOG_FILE = path.join(LOGS_DIR, 'system-health.log');

// Memory store for incident records & IP tracking
const securityIncidents: SecurityIncident[] = [];
const quarantinedIps = new Map<string, number>();
const QUARANTINE_MS = 5 * 60 * 1000;
const recoveryWindows = new Map<string, { count: number; start: number }>();
function expireQuarantines() {
  for (const [key, until] of quarantinedIps) if (until <= Date.now()) quarantinedIps.delete(key);
}
const ipRequestWindows = new Map<string, { count: number; windowStart: number }>();
const accountSecurityStore = new Map<string, AccountSecurityState>();
let totalRequestsInspected = 0;
let threatsBlockedCount = 0;
let selfRepairsCount = 0;
const serverStartTime = Date.now();

// Severity counter
const severityCounts: Record<SecuritySeverity, number> = {
  CRITICAL: 0,
  HIGH: 0,
  MEDIUM: 0,
  LOW: 0,
};

// Known threat signature regex patterns
const MALICIOUS_PATTERNS: Array<{
  regex: RegExp;
  threatType: string;
  severity: SecuritySeverity;
  remediation: string;
}> = [
  {
    regex: /(__proto__|constructor\.prototype|prototype\[)/i,
    threatType: 'PROTOTYPE_POLLUTION_ATTACK',
    severity: 'CRITICAL',
    remediation: 'Inspect client payload for object prototype tampering. Revoke JWT/session tokens for origin.',
  },
  {
    regex: /((\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\bunion\b).*\bfrom\b|'\s*or\s*'1'\s*=\s*'1|--\s*$)/i,
    threatType: 'SQL_INJECTION_SIGNATURE',
    severity: 'CRITICAL',
    remediation: 'Ensure all downstream queries use parameterized binding and strip raw quote strings.',
  },
  {
    regex: /(<\s*script\b|javascript\s*:|data\s*:\s*text\/html|onload\s*=|onerror\s*=)/i,
    threatType: 'CROSS_SITE_SCRIPTING_XSS',
    severity: 'HIGH',
    remediation: 'Sanitize HTML entities and enforce strict Content-Security-Policy (CSP) headers.',
  },
  {
    regex: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\/etc\/passwd|\/bin\/sh)/i,
    threatType: 'DIRECTORY_PATH_TRAVERSAL',
    severity: 'CRITICAL',
    remediation: 'Validate file path arguments using path.resolve with explicit root boundary confinement.',
  },
  {
    regex: /(\bexec\s*\(|\beval\s*\(|\bchild_process\b|\/bin\/bash|\bcmd\.exe\b|\$\(.*\))/i,
    threatType: 'REMOTE_COMMAND_INJECTION',
    severity: 'CRITICAL',
    remediation: 'Block dynamic code execution. Audit application environment for shell execution vulnerabilities.',
  },
];

function ensureLogsDir() {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create logs directory:', err);
  }
}

function persistSecurityLogs(incident: SecurityIncident) {
  try {
    ensureLogsDir();
    // 1. JSON Structured Log
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(sealPrivate(securityIncidents, 'security-local-log')), {encoding:'utf-8',mode:0o600});

    // Plaintext request bodies, IPs, and identity fields never go to disk logs.
  } catch (err) {
    console.warn('[Security] Encrypted local audit persistence unavailable.');
  }
}

function loadSecurityLogs() {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const raw = fs.readFileSync(AUDIT_FILE, 'utf-8');
      const loaded = openPrivate<SecurityIncident[]>(JSON.parse(raw), "security-local-log");
      // Logs are newest first. The latest block/unblock determines state.
      const resolved = new Set<string>();
      for (const item of loaded) {
        if (!resolved.has(item.threatOriginIp) && (item.actionTaken === 'BLOCKED_AND_QUARANTINED' || item.threatType === 'MANUAL_REMEDIATION_UNBLOCK')) {
          resolved.add(item.threatOriginIp);
          const until = item.quarantineUntil ?? Date.parse(item.timestamp) + QUARANTINE_MS;
          if (item.actionTaken === 'BLOCKED_AND_QUARANTINED' && until > Date.now()) quarantinedIps.set(item.threatOriginIp, until);
        }
        securityIncidents.push(item);
        severityCounts[item.severity] = (severityCounts[item.severity] || 0) + 1;
        if (item.actionTaken === 'BLOCKED_AND_QUARANTINED') {
          threatsBlockedCount++;
        }
        if (item.actionTaken === 'SELF_REPAIRED') {
          selfRepairsCount++;
        }
      }
    }
  } catch (err) {
    console.warn('[Security] Prior local audit log requires migration or a valid encryption key.');
  }
}

loadSecurityLogs();

/**
 * Log a structured security finding
 */
export function recordSecurityIncident(params: {
  threatOriginIp: string;
  userAgent?: string;
  endpoint: string;
  method: string;
  severity: SecuritySeverity;
  threatType: string;
  rawSignatureExcerpt: string;
  actionTaken: SecurityActionTaken;
  autoRepairApplied?: string;
  recommendedRemediation: string;
}): SecurityIncident {
  const incident: SecurityIncident = {
    id: `sec_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    threatOriginIp: params.threatOriginIp,
    userAgent: 'redacted',
    endpoint: params.endpoint.split('?')[0].slice(0,200),
    method: params.method,
    severity: params.severity,
    threatType: params.threatType,
    rawSignatureExcerpt: '[request content redacted]',
    actionTaken: params.actionTaken,
    autoRepairApplied: params.autoRepairApplied,
    ...(params.actionTaken === 'BLOCKED_AND_QUARANTINED' ? { quarantineUntil: Date.now() + QUARANTINE_MS } : {}),
    recommendedRemediation: params.recommendedRemediation,
  };

  securityIncidents.unshift(incident);
  // Keep max 500 incidents in memory
  if (securityIncidents.length > 500) {
    securityIncidents.pop();
  }

  severityCounts[params.severity] = (severityCounts[params.severity] || 0) + 1;

  if (params.actionTaken === 'BLOCKED_AND_QUARANTINED') {
    quarantinedIps.set(params.threatOriginIp, incident.quarantineUntil!);
    threatsBlockedCount++;
  } else if (params.actionTaken === 'SELF_REPAIRED') {
    selfRepairsCount++;
  }

  persistSecurityLogs(incident);
  return incident;
}

/**
 * Defensive Self-Repair: Sanitizes and repairs minor input schema glitches and malformed values
 */
export function autoRepairPayload(body: any, endpoint: string): { repaired: any; changesApplied: string[] } {
  if (!body || typeof body !== 'object') {
    return { repaired: body, changesApplied: [] };
  }

  const changes: string[] = [];
  const clone = { ...body };

  // 1. Repair string fields: strip zero-width spaces and control chars
  for (const key of Object.keys(clone)) {
    if (typeof clone[key] === 'string') {
      const orig = clone[key];
      // Strip control chars except newlines and tabs
      const sanitized = orig.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
      if (sanitized !== orig) {
        clone[key] = sanitized;
        changes.push(`Sanitized hidden control characters in "${key}"`);
      }
    }
  }

  // 2. Endpoint-specific auto-repair logic
  if (endpoint.includes('/api/generate-lyrics')) {
    if (!clone.genre || typeof clone.genre !== 'string') {
      clone.genre = 'Hip-Hop / Alternative';
      changes.push('Auto-repaired missing "genre" with default');
    }
    if (!clone.vibe || typeof clone.vibe !== 'string') {
      clone.vibe = 'Anthemic & Melodic';
      changes.push('Auto-repaired missing "vibe" with default');
    }
    if (typeof clone.explicit !== 'boolean') {
      clone.explicit = false;
      changes.push('Normalized "explicit" flag to boolean');
    }
  }

  if (endpoint.includes('/api/analyze')) {
    if (!clone.audioName || typeof clone.audioName !== 'string') {
      clone.audioName = 'Master_Demo_Mix.wav';
      changes.push('Auto-filled missing "audioName"');
    }
    if (!clone.artistName || typeof clone.artistName !== 'string') {
      clone.artistName = 'Independent Creator';
      changes.push('Auto-filled missing "artistName"');
    }
  }

  if (endpoint.includes('/api/stripe/create-checkout-session')) {
    if (!clone.returnUrl || typeof clone.returnUrl !== 'string') {
      clone.returnUrl = 'http://localhost:3000';
      changes.push('Injected default returnUrl for checkout session');
    }
  }

  return { repaired: clone, changesApplied: changes };
}

/**
 * Express Middleware: Code Sentinel & Threat Detection Observer
 */
export function codeSentinelMiddleware(req: Request, res: Response, next: NextFunction) {
  totalRequestsInspected++;
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const rateKey = res.locals.identity?.uid ? `uid:${res.locals.identity.uid}` : `ip:${clientIp}`;
  const userAgent = req.headers['user-agent'] || 'unknown';
  const endpoint = req.originalUrl || req.url;

  expireQuarantines();
  const normalizedPath = endpoint.split('?')[0].replace(/\/+$/, '').toLowerCase();
  // Authentication/admin checks precede Sentinel. Keep cancellation and admin
  // recovery reachable, with an independent bounded rate limit.
  if (req.method === 'POST' && res.locals.identity?.uid &&
      (normalizedPath === '/api/stripe/cancel' ||
       (normalizedPath === '/api/security/remediate' && res.locals.identity.admin === true && res.locals.identity.email_verified === true))) {
    for (const [key, value] of recoveryWindows) if (Date.now() - value.start >= 60000) recoveryWindows.delete(key);
    const window = recoveryWindows.get(rateKey) || { count: 0, start: Date.now() };
    window.count++; recoveryWindows.set(rateKey, window);
    if (window.count > 10) {
      res.setHeader('Retry-After', Math.max(1, Math.ceil((window.start + 60000 - Date.now()) / 1000)));
      return res.status(429).json({ error: 'Too many recovery requests. Retry after the indicated delay.' });
    }
    return next();
  }
  // 1. IP Quarantine Check
  if (quarantinedIps.has(rateKey)) {
    console.warn('[Security] Cooldown request blocked.');
    res.setHeader('Retry-After', Math.max(1, Math.ceil((quarantinedIps.get(rateKey)! - Date.now()) / 1000)));
    return res.status(403).json({
      error: 'Access Denied by indiebrotherhood Code Sentinel',
      status: 'QUARANTINED',
      reason: 'This account/request source is temporarily restricted after a threat signature.',
      retryAt: quarantinedIps.get(rateKey),
      incidentId: `sec_lock_${Date.now()}`,
      remediation: 'Retry after the indicated delay or contact support. Subscription cancellation remains available.',
    });
  }

  // 2. Rate-Limiting & Burst Protection (120 req / 60s per verified UID, or IP for public routes)
  const now = Date.now();
  for (const [key, value] of ipRequestWindows) if (now - value.windowStart >= 60000) ipRequestWindows.delete(key);
  const windowData = ipRequestWindows.get(rateKey) || { count: 0, windowStart: now };
  if (now - windowData.windowStart > 60000) {
    windowData.count = 1;
    windowData.windowStart = now;
  } else {
    windowData.count++;
  }
  ipRequestWindows.set(rateKey, windowData);

  if (windowData.count > 120) {
    if (windowData.count === 121) recordSecurityIncident({
      threatOriginIp: rateKey, userAgent, endpoint, method: req.method,
      severity: 'HIGH', threatType: 'RATE_LIMIT_BURST_FLOOD',
      rawSignatureExcerpt: 'Exceeded 120 requests per minute', actionTaken: 'WARNED',
      recommendedRemediation: 'Retry after the request window resets.',
    });
    const retryAfter = Math.max(1, Math.ceil((windowData.windowStart + 60000 - now) / 1000));
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({ error: 'Rate limit exceeded. Retry after the indicated delay.', retryAfter });
  }

  // 3. Payload & Parameter Threat Signature Scanning
  // Human creative text may legitimately mention code or quotations. Detect
  // dangerous object structure, not keywords in lyrics or private messages.
  if (structuralThreat(req.body) || structuralThreat(req.query)) {
    recordSecurityIncident({threatOriginIp:rateKey,endpoint,method:req.method,severity:'CRITICAL',threatType:'PROTOTYPE_POLLUTION_ATTACK',rawSignatureExcerpt:'redacted',actionTaken:'BLOCKED_AND_QUARANTINED',recommendedRemediation:'Review unsafe object structure.'});
    return res.status(403).json({error:'Unsafe request structure blocked.'});
  }

  // 4. Automated Defensive Self-Repair for Incoming Body
  if (req.body && typeof req.body === 'object' && req.method === 'POST') {
    const { repaired, changesApplied } = autoRepairPayload(req.body, endpoint);
    if (changesApplied.length > 0) {
      req.body = repaired;
      recordSecurityIncident({
        threatOriginIp: rateKey,
        userAgent,
        endpoint,
        method: req.method,
        severity: 'LOW',
        threatType: 'SCHEMA_MICRO_ANOMALY',
        rawSignatureExcerpt: changesApplied.join(', '),
        actionTaken: 'SELF_REPAIRED',
        autoRepairApplied: changesApplied.join('; '),
        recommendedRemediation: 'Client payload adjusted with standard defaults.',
      });
    }
  }

  next();
}

/**
 * Get Security & Health Statistics
 */
export function getSecurityStats(): SecurityStats {
  expireQuarantines();
  return {
    totalRequestsInspected,
    threatsBlocked: threatsBlockedCount,
    selfRepairsExecuted: selfRepairsCount,
    activeQuarantinedIps: quarantinedIps.size,
    quarantinedIps: Array.from(quarantinedIps.keys()),
    severityCounts,
    uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
    lastIncidentTimestamp: securityIncidents[0]?.timestamp,
  };
}

/**
 * Retrieve security incident logs
 */
export function getSecurityAuditLogs(limit = 100): SecurityIncident[] {
  return securityIncidents.slice(0, limit);
}

/**
 * Manual remediation: Unquarantine IP address
 */
export function remediateUnquarantineIp(ip: string): boolean {
  if (quarantinedIps.has(ip)) {
    quarantinedIps.delete(ip);
    ipRequestWindows.delete(ip);
    recordSecurityIncident({
      threatOriginIp: ip,
      endpoint: '/api/security/remediate',
      method: 'POST',
      severity: 'LOW',
      threatType: 'MANUAL_REMEDIATION_UNBLOCK',
      rawSignatureExcerpt: `IP ${ip} cleared by administrator`,
      actionTaken: 'OBSERVED',
      recommendedRemediation: 'IP unblocked. Monitor for repeat infractions.',
    });
    return true;
  }
  return false;
}

/**
 * Check and record account activity with Anti-Bot & Excessive Request Protection
 */
export function recordAccountRequest(params: {
  accountId?: string;
  userEmail?: string;
  clientIp: string;
  endpoint: string;
}): {
  allowed: boolean;
  status: 'ACTIVE' | 'PAUSED' | 'QUARANTINED';
  pausedUntil?: number;
  pauseReason?: string;
  remainingSeconds?: number;
  trustScore: number;
} {
  const accountKey = params.accountId || params.userEmail || params.clientIp;
  const now = Date.now();

  let state = accountSecurityStore.get(accountKey);
  if (!state) {
    state = {
      accountId: accountKey,
      userEmail: params.userEmail,
      status: 'ACTIVE',
      pausedUntil: 0,
      pauseReason: '',
      requestTimestamps: [],
      rapidClicksCount: 0,
      totalRequests: 0,
      trustScore: 100,
      lastRequestTime: 0,
    };
    accountSecurityStore.set(accountKey, state);
  }

  // 1. Check if currently paused
  if (state.status === 'PAUSED') {
    if (now < state.pausedUntil) {
      const remainingSeconds = Math.ceil((state.pausedUntil - now) / 1000);
      return {
        allowed: false,
        status: 'PAUSED',
        pausedUntil: state.pausedUntil,
        pauseReason: state.pauseReason,
        remainingSeconds,
        trustScore: state.trustScore,
      };
    } else {
      // Cooldown completed: auto-unpause
      state.status = 'ACTIVE';
      state.pausedUntil = 0;
      state.pauseReason = '';
      state.rapidClicksCount = 0;
      state.requestTimestamps = [];
      state.trustScore = Math.min(100, state.trustScore + 20);
    }
  }

  // 2. Rapid Click / Bot Hammering Detection (under 1800ms)
  const timeSinceLast = now - state.lastRequestTime;
  state.lastRequestTime = now;
  state.totalRequests++;

  if (timeSinceLast < 1800 && state.lastRequestTime > 0) {
    state.rapidClicksCount++;
    state.trustScore = Math.max(10, state.trustScore - 15);
  } else {
    state.rapidClicksCount = Math.max(0, state.rapidClicksCount - 1);
  }

  // Clean request timestamps older than 60s
  state.requestTimestamps = state.requestTimestamps.filter((t) => now - t < 60000);
  state.requestTimestamps.push(now);

  // 3. Excessive Request Rate & Bot Pattern Rule:
  // - 4+ rapid clicks under 1.8s OR
  // - > 15 lyric/ai requests in 60 seconds
  const isBotHammering = state.rapidClicksCount >= 4;
  const isRateFlooding = state.requestTimestamps.length > 15;

  if (isBotHammering || isRateFlooding) {
    const pauseDurationSeconds = isBotHammering ? 90 : 60;
    state.status = 'PAUSED';
    state.pausedUntil = now + pauseDurationSeconds * 1000;
    state.pauseReason = isBotHammering
      ? `Security AI Bot Defense: Automated sub-second repeated clicking detected (${state.rapidClicksCount} rapid triggers). Account paused for ${pauseDurationSeconds}s cooldown.`
      : `Security AI Rate Sentinel: Excessive generation requests (${state.requestTimestamps.length} reqs / 60s). Account paused for ${pauseDurationSeconds}s.`;
    state.trustScore = Math.max(5, state.trustScore - 30);

    recordSecurityIncident({
      threatOriginIp: params.clientIp,
      endpoint: params.endpoint.split('?')[0].slice(0,200),
      method: 'POST',
      severity: 'HIGH',
      threatType: isBotHammering ? 'BOT_RAPID_CLICK_DEFENSE' : 'EXCESSIVE_ACCOUNT_REQUESTS',
      rawSignatureExcerpt: `Account: ${accountKey} | Reason: ${state.pauseReason}`,
      actionTaken: 'USER_ACCOUNT_PAUSED',
      recommendedRemediation: `Enforce ${pauseDurationSeconds}s cooldown pause. Cooldown auto-restores upon timer completion.`,
    });

    return {
      allowed: false,
      status: 'PAUSED',
      pausedUntil: state.pausedUntil,
      pauseReason: state.pauseReason,
      remainingSeconds: pauseDurationSeconds,
      trustScore: state.trustScore,
    };
  }

  return {
    allowed: true,
    status: 'ACTIVE',
    trustScore: state.trustScore,
  };
}

/**
 * Get account security status
 */
export function getAccountSecurityStatus(accountKey: string): AccountSecurityState {
  const now = Date.now();
  let state = accountSecurityStore.get(accountKey);
  if (!state) {
    state = {
      accountId: accountKey,
      status: 'ACTIVE',
      pausedUntil: 0,
      pauseReason: '',
      requestTimestamps: [],
      rapidClicksCount: 0,
      totalRequests: 0,
      trustScore: 100,
      lastRequestTime: 0,
    };
    accountSecurityStore.set(accountKey, state);
  }

  if (state.status === 'PAUSED' && now >= state.pausedUntil) {
    state.status = 'ACTIVE';
    state.pausedUntil = 0;
    state.pauseReason = '';
  }

  return state;
}

/**
 * Manually pause an account (Security AI or Admin)
 */
export function pauseAccount(accountKey: string, durationSeconds: number, reason: string): AccountSecurityState {
  const now = Date.now();
  let state = getAccountSecurityStatus(accountKey);
  state.status = 'PAUSED';
  state.pausedUntil = now + durationSeconds * 1000;
  state.pauseReason = reason;
  state.trustScore = Math.max(0, state.trustScore - 25);
  accountSecurityStore.set(accountKey, state);

  recordSecurityIncident({
    threatOriginIp: accountKey,
    endpoint: '/api/security/pause-account',
    method: 'POST',
    severity: 'MEDIUM',
    threatType: 'ADMIN_OR_SECURITY_AI_ACCOUNT_PAUSE',
    rawSignatureExcerpt: `Account ${accountKey} paused for ${durationSeconds}s: ${reason}`,
    actionTaken: 'USER_ACCOUNT_PAUSED',
    recommendedRemediation: 'Account temporarily suspended from high-speed AI generation.',
  });

  return state;
}

/**
 * Unpause an account
 */
export function unpauseAccount(accountKey: string): AccountSecurityState {
  let state = getAccountSecurityStatus(accountKey);
  state.status = 'ACTIVE';
  state.pausedUntil = 0;
  state.pauseReason = '';
  state.rapidClicksCount = 0;
  state.trustScore = 100;
  accountSecurityStore.set(accountKey, state);

  recordSecurityIncident({
    threatOriginIp: accountKey,
    endpoint: '/api/security/unpause-account',
    method: 'POST',
    severity: 'LOW',
    threatType: 'ACCOUNT_SECURITY_RESTORED',
    rawSignatureExcerpt: `Account ${accountKey} restored to ACTIVE status`,
    actionTaken: 'OBSERVED',
    recommendedRemediation: 'Account restored. Normal limits apply.',
  });

  return state;
}

/**
 * Startup Security & Fair Usage Guidelines
 */
export function getStartupSecurityGuidelines() {
  return {
    version: '2026.3-PRO',
    lastUpdated: '2026-08-28',
    rules: [
      {
        id: 'rule_anti_bot',
        title: 'Zero Automated Bot or Script Scraping',
        description: 'Request limits and unsafe object-structure checks protect the service. Optional AI review receives aggregate counts only and cannot ban accounts.',
        penalty: 'Immediate automated account quarantine & cooldown pause.',
      },
      {
        id: 'rule_fair_cadence',
        title: 'Human Creation Pacing & Fair AI Cooldown',
        description: 'Allow time between generations. Rapid request bursts can trigger temporary account cooldowns to keep the service available.',
        penalty: 'Repeated rapid bursts trigger temporary 60-90 second Security AI cool-off periods.',
      },
      {
        id: 'rule_pure_lyrics',
        title: 'Strict Lyricist & Prosody Output Integrity',
        description: 'Lyric Pro only generates pure song lyrics with syllable counts, rhyme markers, energy levels, and earworm motifs. Conversational filler and system prompts are forbidden in output.',
        penalty: 'Invalid, incomplete, or overlapping outputs are rejected; failed requests restore their Coins.',
      },
      {
        id: 'rule_commercial_ownership',
        title: 'Originality & Commercial Ownership Rights',
        description: 'Original writing instructions and recent-history checks reduce repetition. They cannot guarantee worldwide uniqueness or copyright clearance. Review lyrics before release.',
        penalty: 'Do not submit lyrics you are not authorized to use.',
      },
    ],
  };
}
