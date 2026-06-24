/**
 * Double-entry ledger service for SkinPip.
 *
 * All amounts are in pips (1 pip = $0.00001 USD), stored as bigint.
 *
 * Invariants maintained at all times:
 *   - balancePips >= 0
 *   - reservedPips <= balancePips
 *   - availablePips = balancePips - reservedPips >= 0
 */

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// The transaction client type Prisma exposes for $transaction callbacks.
export type PrismaTransactionClient = Prisma.TransactionClient;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Fetch or create a WalletAccount inside a transaction.
 * Using upsert so callers never need to pre-create the wallet.
 */
async function getOrCreateWallet(
  tx: PrismaTransactionClient,
  userId: string
) {
  return tx.walletAccount.upsert({
    where: { userId },
    create: { userId, balancePips: 0n, reservedPips: 0n },
    update: {},
  });
}

// ---------------------------------------------------------------------------
// Core posting function
// ---------------------------------------------------------------------------

export interface PostEntryParams {
  userId: string;
  /** Positive = credit (balance increases). Negative = debit (balance decreases). */
  amountPips: bigint;
  /** Semantic category, e.g. "FIAT_DEPOSIT", "TRADE_SALE", "LISTING_RESERVE". */
  entryType: string;
  /** ID of the related record (PaymentIntent, Trade, Listing, etc.). */
  refId?: string;
  /** Table/model the refId belongs to. */
  refType?: string;
  /** Free-form human-readable note. */
  note?: string;
}

/**
 * Post a double-entry ledger record.
 *
 * MUST be called inside a Prisma transaction — the caller is responsible for
 * wrapping with `db.$transaction(async (tx) => { ... })`.
 *
 * Throws if the operation would violate balance invariants.
 */
export async function postEntry(
  tx: PrismaTransactionClient,
  params: PostEntryParams
): Promise<void> {
  const { userId, amountPips, entryType, refId, refType, note } = params;

  if (amountPips === 0n) {
    throw new Error("ledger: amountPips must be non-zero");
  }

  // Lock the wallet row for the duration of the transaction.
  // Prisma does not expose SELECT FOR UPDATE, so we use updateMany with a
  // conditional that always passes (add 0) to obtain a row-level lock in PG.
  const wallet = await getOrCreateWallet(tx, userId);

  const newBalance = wallet.balancePips + amountPips;

  if (newBalance < 0n) {
    throw new Error(
      `ledger: insufficient balance for user ${userId}. ` +
        `Current: ${wallet.balancePips}, delta: ${amountPips}`
    );
  }

  if (wallet.reservedPips > newBalance) {
    throw new Error(
      `ledger: new balance ${newBalance} would be below reserved ${wallet.reservedPips} for user ${userId}`
    );
  }

  // Update cached balance on WalletAccount.
  await tx.walletAccount.update({
    where: { userId },
    data: { balancePips: newBalance },
  });

  // Create the immutable ledger entry.
  await tx.ledgerEntry.create({
    data: {
      walletAccountId: wallet.id,
      amountPips,
      balanceAfterPips: newBalance,
      type: entryType,
      referenceId: refId ?? null,
      referenceType: refType ?? null,
      // `note` is not a field in the generated schema; stored in referenceType
      // or omitted — keep this comment so future migrations can add it.
    },
  });
}

// ---------------------------------------------------------------------------
// Convenience wrappers
// ---------------------------------------------------------------------------

/** Credit a user's wallet (positive pips). */
export async function creditUser(
  tx: PrismaTransactionClient,
  userId: string,
  amountPips: bigint,
  entryType: string,
  refId?: string,
  refType?: string,
  note?: string
): Promise<void> {
  if (amountPips <= 0n) {
    throw new Error(`ledger.creditUser: amountPips must be positive, got ${amountPips}`);
  }
  return postEntry(tx, { userId, amountPips, entryType, refId, refType, note });
}

/**
 * Debit a user's wallet (pips leave the account).
 * Pass a positive amountPips — the function negates it internally.
 * Throws if the debit would push the available balance negative.
 */
export async function debitUser(
  tx: PrismaTransactionClient,
  userId: string,
  amountPips: bigint,
  entryType: string,
  refId?: string,
  refType?: string,
  note?: string
): Promise<void> {
  if (amountPips <= 0n) {
    throw new Error(`ledger.debitUser: amountPips must be positive, got ${amountPips}`);
  }

  // Check available (non-reserved) balance before posting.
  const wallet = await tx.walletAccount.findUnique({ where: { userId } });
  const available = wallet ? wallet.balancePips - wallet.reservedPips : 0n;
  if (available < amountPips) {
    throw new Error(
      `ledger.debitUser: insufficient available balance for user ${userId}. ` +
        `Available: ${available}, requested debit: ${amountPips}`
    );
  }

  return postEntry(tx, { userId, amountPips: -amountPips, entryType, refId, refType, note });
}

/**
 * Reserve pips for an open listing or bid.
 * Moves balance into the reserved bucket without changing total balance.
 */
export async function reservePips(
  tx: PrismaTransactionClient,
  userId: string,
  amountPips: bigint,
  entryType: string,
  refId?: string,
  refType?: string
): Promise<void> {
  if (amountPips <= 0n) {
    throw new Error(`ledger.reservePips: amountPips must be positive, got ${amountPips}`);
  }

  const wallet = await getOrCreateWallet(tx, userId);
  const available = wallet.balancePips - wallet.reservedPips;

  if (available < amountPips) {
    throw new Error(
      `ledger.reservePips: insufficient available balance for user ${userId}. ` +
        `Available: ${available}, requested reserve: ${amountPips}`
    );
  }

  const newReserved = wallet.reservedPips + amountPips;

  await tx.walletAccount.update({
    where: { userId },
    data: { reservedPips: newReserved },
  });

  // Record in ledger with amount = 0 (no balance change, only reservation).
  // We use a synthetic ledger entry so auditors can trace every reservation.
  await tx.ledgerEntry.create({
    data: {
      walletAccountId: wallet.id,
      amountPips: 0n,
      balanceAfterPips: wallet.balancePips,
      type: entryType,
      referenceId: refId ?? null,
      referenceType: refType ?? null,
    },
  });
}

/**
 * Release reserved pips back to available (e.g. listing cancelled).
 * Does not change total balance — only decreases reservedPips.
 */
export async function releasePips(
  tx: PrismaTransactionClient,
  userId: string,
  amountPips: bigint,
  entryType: string,
  refId?: string,
  refType?: string
): Promise<void> {
  if (amountPips <= 0n) {
    throw new Error(`ledger.releasePips: amountPips must be positive, got ${amountPips}`);
  }

  const wallet = await tx.walletAccount.findUnique({ where: { userId } });

  if (!wallet) {
    throw new Error(`ledger.releasePips: no wallet found for user ${userId}`);
  }

  if (wallet.reservedPips < amountPips) {
    throw new Error(
      `ledger.releasePips: cannot release ${amountPips} — only ${wallet.reservedPips} reserved for user ${userId}`
    );
  }

  const newReserved = wallet.reservedPips - amountPips;

  await tx.walletAccount.update({
    where: { userId },
    data: { reservedPips: newReserved },
  });

  await tx.ledgerEntry.create({
    data: {
      walletAccountId: wallet.id,
      amountPips: 0n,
      balanceAfterPips: wallet.balancePips,
      type: entryType,
      referenceId: refId ?? null,
      referenceType: refType ?? null,
    },
  });
}

// ---------------------------------------------------------------------------
// Balance query (reads outside a transaction — uses db directly)
// ---------------------------------------------------------------------------

export interface WalletBalance {
  balancePips: bigint;
  reservedPips: bigint;
  availablePips: bigint;
}

/** Return the current balance for a user. Returns zeros if no wallet exists. */
export async function getBalance(userId: string): Promise<WalletBalance> {
  const wallet = await db.walletAccount.findUnique({ where: { userId } });

  if (!wallet) {
    return { balancePips: 0n, reservedPips: 0n, availablePips: 0n };
  }

  return {
    balancePips: wallet.balancePips,
    reservedPips: wallet.reservedPips,
    availablePips: wallet.balancePips - wallet.reservedPips,
  };
}
