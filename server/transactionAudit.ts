import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Stripe from 'stripe';

export type AuditStage = 'BEFORE_INITIALIZATION' | 'DURING_STRIPE_EXECUTION' | 'AFTER_FULFILLMENT_SUCCEEDED' | 'TRANSACTION_FAILED';

export interface TransactionAuditRecord {
  transactionId: string;
  idempotencyKey: string;
  stage: AuditStage;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  tier: 'free' | 'pro';
  amountUsd: number;
  currency: string;
  clientIp?: string;
  stripeSessionId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'initialized' | 'pending' | 'completed' | 'duplicate_blocked' | 'failed';
  metadata?: Record<string, any>;
  error?: string;
}

const LOGS_DIR = path.join(process.cwd(), 'logs');
const AUDIT_FILE = path.join(LOGS_DIR, 'transaction-audit.json');

// In-memory cache for fast O(1) deduplication and active sessions
const transactionAuditStore = new Map<string, TransactionAuditRecord>();
const processedIdempotencyKeys = new Set<string>();
const processedStripeSessionIds = new Set<string>();

// Ensure logs directory exists
function ensureLogsDir() {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create logs directory:', err);
  }
}

// Persist audit store to disk safely
function persistAuditStore() {
  try {
    ensureLogsDir();
    const records = Array.from(transactionAuditStore.values());
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist transaction audit store:', err);
  }
}

// Load existing transactions from disk on startup
function loadAuditStore() {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const raw = fs.readFileSync(AUDIT_FILE, 'utf-8');
      const records = JSON.parse(raw) as TransactionAuditRecord[];
      for (const rec of records) {
        transactionAuditStore.set(rec.transactionId, rec);
        if (rec.idempotencyKey) processedIdempotencyKeys.add(rec.idempotencyKey);
        if (rec.stripeSessionId && rec.status === 'completed') {
          processedStripeSessionIds.add(rec.stripeSessionId);
        }
      }
    }
  } catch (err) {
    console.error('Failed to load transaction audit store:', err);
  }
}

loadAuditStore();

/**
 * Generate standard RFC 4122 v4 UUID using native crypto
 */
export function generateV4UUID(): string {
  return crypto.randomUUID();
}

/**
 * Stage 1 (BEFORE): Log checkout initialization and register idempotency token
 */
export function logBeforePaymentInitialization(params: {
  userId?: string;
  userEmail?: string;
  tier?: 'free' | 'pro';
  amountUsd: number;
  clientIp?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}): { transactionId: string; idempotencyKey: string; isDuplicate: boolean } {
  const idempotencyKey = params.idempotencyKey || generateV4UUID();
  const transactionId = `txn_${Date.now()}_${generateV4UUID().slice(0, 8)}`;

  // Check if idempotency key already exists
  if (processedIdempotencyKeys.has(idempotencyKey)) {
    console.warn(`[IDEMPOTENCY] Duplicate transaction detected with key ${idempotencyKey}`);
    return { transactionId, idempotencyKey, isDuplicate: true };
  }

  const record: TransactionAuditRecord = {
    transactionId,
    idempotencyKey,
    stage: 'BEFORE_INITIALIZATION',
    timestamp: new Date().toISOString(),
    userId: params.userId || 'anonymous_artist',
    userEmail: params.userEmail || 'unknown@artist.indiebrotherhood',
    tier: params.tier || 'pro',
    amountUsd: params.amountUsd,
    currency: 'USD',
    clientIp: params.clientIp || '127.0.0.1',
    status: 'initialized',
    metadata: {
      platform: 'indiebrotherhood',
      ...params.metadata,
    },
  };

  transactionAuditStore.set(transactionId, record);
  processedIdempotencyKeys.add(idempotencyKey);
  persistAuditStore();

  console.log(`[STAGE 1 - BEFORE] Initialized transaction ${transactionId} (Key: ${idempotencyKey})`);
  return { transactionId, idempotencyKey, isDuplicate: false };
}

/**
 * Stage 2 (DURING): Log Stripe checkout creation with idempotency link
 */
export function logDuringStripeExecution(
  transactionId: string,
  stripeSessionId: string,
  checkoutUrl?: string
) {
  const existing = transactionAuditStore.get(transactionId);
  if (existing) {
    existing.stage = 'DURING_STRIPE_EXECUTION';
    existing.stripeSessionId = stripeSessionId;
    existing.status = 'pending';
    if (checkoutUrl) {
      existing.metadata = { ...existing.metadata, checkoutUrl };
    }
    persistAuditStore();
    console.log(`[STAGE 2 - DURING] Stripe Session ${stripeSessionId} bound to ${transactionId}`);
  }
}

/**
 * Stage 3 (AFTER): Verified fulfillment from Webhook or Session verification
 * Returns true if processed for the first time, false if duplicate/already processed
 */
export function logAfterFulfillmentSucceeded(params: {
  stripeSessionId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  userEmail?: string;
  userId?: string;
  tier?: 'free' | 'pro';
  amountPaid?: number;
  metadata?: Record<string, any>;
}): { success: boolean; alreadyFulfilled: boolean; transactionRecord?: TransactionAuditRecord } {
  const { stripeSessionId } = params;

  // Duplicate fulfillment prevention
  if (processedStripeSessionIds.has(stripeSessionId)) {
    console.warn(`[IDEMPOTENCY DUPLICATE SHIELD] Session ${stripeSessionId} was already fulfilled. Skipping redundant activation.`);
    return { success: true, alreadyFulfilled: true };
  }

  // Look for matching transaction or create new record for external webhook
  let record: TransactionAuditRecord | undefined;
  for (const rec of transactionAuditStore.values()) {
    if (rec.stripeSessionId === stripeSessionId) {
      record = rec;
      break;
    }
  }

  if (!record) {
    const transactionId = `txn_webhook_${Date.now()}_${generateV4UUID().slice(0, 8)}`;
    record = {
      transactionId,
      idempotencyKey: generateV4UUID(),
      stage: 'AFTER_FULFILLMENT_SUCCEEDED',
      timestamp: new Date().toISOString(),
      userId: params.userId || 'artist_subscriber',
      userEmail: params.userEmail,
      tier: params.tier || 'pro',
      amountUsd: params.amountPaid || 14.99,
      currency: 'USD',
      stripeSessionId,
      stripeCustomerId: params.stripeCustomerId,
      stripeSubscriptionId: params.stripeSubscriptionId,
      status: 'completed',
      metadata: params.metadata,
    };
    transactionAuditStore.set(transactionId, record);
  } else {
    record.stage = 'AFTER_FULFILLMENT_SUCCEEDED';
    record.status = 'completed';
    record.stripeCustomerId = params.stripeCustomerId || record.stripeCustomerId;
    record.stripeSubscriptionId = params.stripeSubscriptionId || record.stripeSubscriptionId;
    if (params.metadata) {
      record.metadata = { ...record.metadata, ...params.metadata };
    }
  }

  processedStripeSessionIds.add(stripeSessionId);
  persistAuditStore();

  console.log(`[STAGE 3 - AFTER] Fulfilled & audited transaction ${record.transactionId} for session ${stripeSessionId}`);
  return { success: true, alreadyFulfilled: false, transactionRecord: record };
}

/**
 * Log transaction failure
 */
export function logTransactionFailure(transactionId: string, error: string) {
  const record = transactionAuditStore.get(transactionId);
  if (record) {
    record.stage = 'TRANSACTION_FAILED';
    record.status = 'failed';
    record.error = error;
    persistAuditStore();
    console.error(`[STAGE FAILED] Transaction ${transactionId} failed: ${error}`);
  }
}

/**
 * Retrieve all transaction records
 */
export function getTransactionAuditRecords(): TransactionAuditRecord[] {
  return Array.from(transactionAuditStore.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
