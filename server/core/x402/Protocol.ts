import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';

const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const COMPUTE_BUDGET_PROGRAM = new PublicKey('ComputeBudget111111111111111111111111111111');

export interface X402TransferParams {
  fromWallet: PublicKey;
  toWallet: PublicKey;
  amount: number;
  token: 'SOL' | 'USDC';
  priorityFee?: number;
}

export interface X402TransferResult {
  serializedTransaction: string;
  estimatedFee: number;
  blockhash: string;
  lastValidBlockHeight: number;
}

export interface SettlementRecord {
  signature: string;
  fromWallet: string;
  toWallet: string;
  amount: number;
  token: string;
  settledAt: number;
  settlementMs: number;
  slot: number;
  blockTime: number | null;
}

function computePriorityFeeIx(microLamports: number) {
  const data = Buffer.alloc(9);
  data.writeUInt8(3, 0);
  data.writeBigUInt64LE(BigInt(microLamports), 1);
  return {
    programId: COMPUTE_BUDGET_PROGRAM,
    keys: [],
    data,
  };
}

function computeUnitLimitIx(units: number) {
  const data = Buffer.alloc(5);
  data.writeUInt8(2, 0);
  data.writeUInt32LE(units, 1);
  return {
    programId: COMPUTE_BUDGET_PROGRAM,
    keys: [],
    data,
  };
}

export async function buildX402Transfer(
  connection: Connection,
  params: X402TransferParams
): Promise<X402TransferResult> {
  const { fromWallet, toWallet, amount, token, priorityFee = 50000 } = params;

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = fromWallet;

  tx.add(computeUnitLimitIx(200_000));
  tx.add(computePriorityFeeIx(priorityFee));

  if (token === 'SOL') {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: fromWallet,
        toPubkey: toWallet,
        lamports: Math.round(amount * LAMPORTS_PER_SOL),
      })
    );
  } else if (token === 'USDC') {
    const fromAta = await getAssociatedTokenAddress(USDC_MINT, fromWallet);
    const toAta = await getAssociatedTokenAddress(USDC_MINT, toWallet);

    tx.add(
      createTransferInstruction(
        fromAta,
        toAta,
        fromWallet,
        Math.round(amount * 1_000_000),
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }

  const serialized = tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });

  const baseFee = 5000;
  const priorityTotal = Math.ceil((priorityFee * 200_000) / 1_000_000);
  const estimatedFee = (baseFee + priorityTotal) / LAMPORTS_PER_SOL;

  return {
    serializedTransaction: serialized.toString('base64'),
    estimatedFee,
    blockhash,
    lastValidBlockHeight,
  };
}

export async function confirmSettlement(
  connection: Connection,
  signature: string,
  params: X402TransferParams,
  startTime: number
): Promise<SettlementRecord> {
  const confirmation = await connection.confirmTransaction(
    { signature, blockhash: '', lastValidBlockHeight: 0 },
    'confirmed'
  );

  if (confirmation.value.err) {
    throw new Error(`Settlement failed: ${JSON.stringify(confirmation.value.err)}`);
  }

  const txInfo = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });

  const settlementMs = Date.now() - startTime;

  return {
    signature,
    fromWallet: params.fromWallet.toBase58(),
    toWallet: params.toWallet.toBase58(),
    amount: params.amount,
    token: params.token,
    settledAt: Date.now(),
    settlementMs,
    slot: txInfo?.slot ?? 0,
    blockTime: txInfo?.blockTime ?? null,
  };
}

export function estimateSettlementTime(tps: number): number {
  const baseMs = 400;
  const tpsFactor = Math.max(0, (tps - 2000) / 5000);
  const congestionMs = tpsFactor * 200;
  return baseMs + congestionMs + Math.random() * 100;
}

export function validateTransferParams(params: X402TransferParams): string | null {
  if (params.amount <= 0) return 'Amount must be positive';
  if (params.amount > 1_000_000) return 'Amount exceeds maximum';
  if (params.fromWallet.equals(params.toWallet)) return 'Cannot send to self';
  if (params.token !== 'SOL' && params.token !== 'USDC') return 'Unsupported token';
  if (params.token === 'SOL' && params.amount < 0.000001) return 'Below dust threshold';
  if (params.token === 'USDC' && params.amount < 0.01) return 'Below minimum USDC transfer';
  return null;
}
