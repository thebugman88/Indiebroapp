import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export type SecuritySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type SecurityActionTaken = 'BLOCKED_AND_QUARANTINED' | 'SELF_REPAIRED' | 'WARNED' | 'OBSERVED';

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
