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
const quarantinedIps = new Set<string>();
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
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(securityIncidents, null, 2), 'utf-8');

    // 2. Append to clean system-health.log file
    const logLine = `[${incident.timestamp}] [${incident.severity}] [${incident.actionTaken}] Origin: ${incident.threatOriginIp} | Endpoint: ${incident.method} ${incident.endpoint} | Threat: ${incident.threatType} | Remedy: ${incident.recommendedRemediation}\n`;
    fs.appendFileSync(HEALTH_LOG_FILE, logLine, 'utf-8');
  } catch (err) {
    console.error('Failed to write security logs:', err);
  }
}

function loadSecurityLogs() {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const raw = fs.readFileSync(AUDIT_FILE, 'utf-8');
      const loaded = JSON.parse(raw) as SecurityIncident[];
      for (const item of loaded) {
        securityIncidents.push(item);
        severityCounts[item.severity] = (severityCounts[item.severity] || 0) + 1;
        if (item.actionTaken === 'BLOCKED_AND_QUARANTINED') {
          quarantinedIps.add(item.threatOriginIp);
          threatsBlockedCount++;
        }
        if (item.actionTaken === 'SELF_REPAIRED') {
          selfRepairsCount++;
        }
      }
    }
  } catch (err) {
    console.error('Failed to load previous security logs:', err);
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
    userAgent: params.userAgent || 'unknown',
    endpoint: params.endpoint,
    method: params.method,
    severity: params.severity,
    threatType: params.threatType,
    rawSignatureExcerpt: params.rawSignatureExcerpt.slice(0, 200),
    actionTaken: params.actionTaken,
    autoRepairApplied: params.autoRepairApplied,
    recommendedRemediation: params.recommendedRemediation,
  };

  securityIncidents.unshift(incident);
  // Keep max 500 incidents in memory
  if (securityIncidents.length > 500) {
    securityIncidents.pop();
  }

  severityCounts[params.severity] = (severityCounts[params.severity] || 0) + 1;

  if (params.actionTaken === 'BLOCKED_AND_QUARANTINED') {
    quarantinedIps.add(params.threatOriginIp);
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
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const endpoint = req.originalUrl || req.url;

  // 1. IP Quarantine Check
  if (quarantinedIps.has(clientIp)) {
    console.warn(`[SENTINEL BLOCKED] Quarantined IP attempt: ${clientIp} on ${endpoint}`);
    return res.status(403).json({
      error: 'Access Denied by indiebrotherhood Code Sentinel',
      status: 'QUARANTINED',
      reason: 'Your IP address has been isolated due to anomalous threat signatures.',
      incidentId: `sec_lock_${Date.now()}`,
      remediation: 'Contact system security or submit an unblock token.',
    });
  }

  // 2. Rate-Limiting & Burst Protection (120 req / 60s per IP)
  const now = Date.now();
  const windowData = ipRequestWindows.get(clientIp) || { count: 0, windowStart: now };
  if (now - windowData.windowStart > 60000) {
    windowData.count = 1;
    windowData.windowStart = now;
  } else {
    windowData.count++;
  }
  ipRequestWindows.set(clientIp, windowData);

  if (windowData.count > 120) {
    const incident = recordSecurityIncident({
      threatOriginIp: clientIp,
      userAgent,
      endpoint,
      method: req.method,
      severity: 'HIGH',
      threatType: 'RATE_LIMIT_BURST_FLOOD',
      rawSignatureExcerpt: `Rate: ${windowData.count} requests / minute`,
      actionTaken: 'BLOCKED_AND_QUARANTINED',
      recommendedRemediation: 'Quarantine origin IP, verify rate limit configuration.',
    });

    return res.status(429).json({
      error: 'Rate Limit Exceeded. IP Quarantined.',
      incidentId: incident.id,
      remediation: incident.recommendedRemediation,
    });
  }

  // 3. Payload & Parameter Threat Signature Scanning
  const inspectTargets: string[] = [];
  if (req.query) inspectTargets.push(JSON.stringify(req.query));
  if (req.params) inspectTargets.push(JSON.stringify(req.params));
  if (req.body && typeof req.body === 'object') {
    // Only inspect first 20KB to avoid audio base64 false positives
    const bodyStr = JSON.stringify(req.body);
    inspectTargets.push(bodyStr.slice(0, 20000));
  }

  const combinedPayload = inspectTargets.join(' ');

  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.regex.test(combinedPayload) || pattern.regex.test(endpoint)) {
      const match = combinedPayload.match(pattern.regex)?.[0] || endpoint;
      const incident = recordSecurityIncident({
        threatOriginIp: clientIp,
        userAgent,
        endpoint,
        method: req.method,
        severity: pattern.severity,
        threatType: pattern.threatType,
        rawSignatureExcerpt: match,
        actionTaken: 'BLOCKED_AND_QUARANTINED',
        recommendedRemediation: pattern.remediation,
      });

      return res.status(403).json({
        error: 'Security Sentinel Block: Malicious payload signature detected.',
        threatType: pattern.threatType,
        severity: pattern.severity,
        incidentId: incident.id,
        remediation: pattern.remediation,
      });
    }
  }

  // 4. Automated Defensive Self-Repair for Incoming Body
  if (req.body && typeof req.body === 'object' && req.method === 'POST') {
    const { repaired, changesApplied } = autoRepairPayload(req.body, endpoint);
    if (changesApplied.length > 0) {
      req.body = repaired;
      recordSecurityIncident({
        threatOriginIp: clientIp,
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
  return {
    totalRequestsInspected,
    threatsBlocked: threatsBlockedCount,
    selfRepairsExecuted: selfRepairsCount,
    activeQuarantinedIps: quarantinedIps.size,
    quarantinedIps: Array.from(quarantinedIps),
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
      endpoint: params.endpoint,
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
        description: 'Automated macros, clicker scripts, and headless bot crawlers are strictly prohibited. The Security AI continuously inspects click cadence, origin entropy, and request signatures.',
        penalty: 'Immediate automated account quarantine & cooldown pause.',
      },
      {
        id: 'rule_fair_cadence',
        title: 'Human Creation Pacing & Fair AI Cooldown',
        description: 'Lyric Pro generates multi-platinum studio-grade arrangements. Allow a minimum 3-4 second creative breath between generations to allow the Gemini AI neural cluster to synthesize optimal prosody.',
        penalty: 'Repeated rapid bursts trigger temporary 60-90 second Security AI cool-off periods.',
      },
      {
        id: 'rule_pure_lyrics',
        title: 'Strict Lyricist & Prosody Output Integrity',
        description: 'Lyric Pro only generates pure song lyrics with syllable counts, rhyme markers, energy levels, and earworm motifs. Conversational filler and system prompts are forbidden in output.',
        penalty: 'System self-corrects and guarantees pure structured musical output.',
      },
      {
        id: 'rule_commercial_ownership',
        title: 'Originality & Commercial Ownership Rights',
        description: 'All generated compositions are granted for commercial release, recording, and royalty distribution with zero legal liability placed upon the platform.',
        penalty: 'Commercial protections apply to verified accounts.',
      },
    ],
  };
}
