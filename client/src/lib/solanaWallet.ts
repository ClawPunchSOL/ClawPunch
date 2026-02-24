import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js";

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  balance: number | null;
  connecting: boolean;
}

const INITIAL_STATE: WalletState = {
  connected: false,
  publicKey: null,
  balance: null,
  connecting: false,
};

let walletState: WalletState = { ...INITIAL_STATE };
let listeners: Set<(state: WalletState) => void> = new Set();
let connection: Connection | null = null;
let balanceInterval: ReturnType<typeof setInterval> | null = null;

const RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-mainnet.g.alchemy.com/v2/demo",
  "https://rpc.ankr.com/solana",
];

function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(RPC_ENDPOINTS[0], "confirmed");
  }
  return connection;
}

function rotateRpc(): Connection {
  const current = connection?.rpcEndpoint || RPC_ENDPOINTS[0];
  const idx = RPC_ENDPOINTS.indexOf(current);
  const next = RPC_ENDPOINTS[(idx + 1) % RPC_ENDPOINTS.length];
  connection = new Connection(next, "confirmed");
  return connection;
}

function notify() {
  listeners.forEach(fn => fn({ ...walletState }));
}

function getPhantom(): any {
  if (typeof window !== "undefined" && (window as any).solana?.isPhantom) {
    return (window as any).solana;
  }
  return null;
}

async function fetchBalance() {
  if (!walletState.publicKey) return;
  const pk = new PublicKey(walletState.publicKey);
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    try {
      const c = i === 0 ? getConnection() : rotateRpc();
      const bal = await c.getBalance(pk);
      walletState = { ...walletState, balance: bal / LAMPORTS_PER_SOL };
      notify();
      return;
    } catch {}
  }
}

export async function connectWallet(): Promise<void> {
  const phantom = getPhantom();
  if (!phantom) {
    window.open("https://phantom.app/", "_blank");
    return;
  }

  walletState = { ...walletState, connecting: true };
  notify();

  try {
    const resp = await phantom.connect();
    walletState = {
      connected: true,
      publicKey: resp.publicKey.toString(),
      balance: null,
      connecting: false,
    };
    notify();
    fetchBalance();
    if (balanceInterval) clearInterval(balanceInterval);
    balanceInterval = setInterval(fetchBalance, 30000);

    phantom.on("disconnect", () => {
      disconnectWallet();
    });
  } catch {
    walletState = { ...INITIAL_STATE };
    notify();
  }
}

export function disconnectWallet(): void {
  const phantom = getPhantom();
  if (phantom) {
    try { phantom.disconnect(); } catch {}
  }
  if (balanceInterval) clearInterval(balanceInterval);
  walletState = { ...INITIAL_STATE };
  notify();
}

export function refreshBalance(): void {
  fetchBalance();
}

export function getWalletState(): WalletState {
  return { ...walletState };
}

export function subscribeWallet(fn: (state: WalletState) => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function shortAddress(addr: string | null): string {
  if (!addr) return "";
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function isPhantomInstalled(): boolean {
  return !!getPhantom();
}

export async function sendSolTransfer(recipientAddress: string, amountSol: number): Promise<string> {
  const phantom = getPhantom();
  if (!phantom || !walletState.connected || !walletState.publicKey) {
    throw new Error("Wallet not connected");
  }

  const conn = getConnection();
  const fromPubkey = new PublicKey(walletState.publicKey);
  const toPubkey = new PublicKey(recipientAddress);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: Math.round(amountSol * LAMPORTS_PER_SOL),
    })
  );

  transaction.feePayer = fromPubkey;
  const { blockhash } = await conn.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  const { signature } = await phantom.signAndSendTransaction(transaction);
  setTimeout(fetchBalance, 3000);
  return signature;
}

export async function sendUsdcTransfer(recipientAddress: string, amountUsdc: number): Promise<string> {
  const phantom = getPhantom();
  if (!phantom) {
    throw new Error("Phantom wallet not found. Please install Phantom browser extension.");
  }
  if (!walletState.connected || !walletState.publicKey) {
    throw new Error("Wallet not connected. Please connect your wallet first.");
  }

  const conn = getConnection();
  const fromPubkey = new PublicKey(walletState.publicKey);
  const toPubkey = new PublicKey(recipientAddress);

  const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  const USDC_DECIMALS = 6;
  const amount = Math.round(amountUsdc * Math.pow(10, USDC_DECIMALS));

  let splToken;
  try {
    splToken = await import("@solana/spl-token");
  } catch {
    throw new Error("Failed to load SPL token library. Please refresh and try again.");
  }

  const { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction, getAccount, TOKEN_PROGRAM_ID } = splToken;

  const fromAta = await getAssociatedTokenAddress(USDC_MINT, fromPubkey);
  const toAta = await getAssociatedTokenAddress(USDC_MINT, toPubkey);

  async function rpcCall<T>(fn: (c: Connection) => Promise<T>): Promise<T> {
    let lastErr: any;
    for (let attempt = 0; attempt < RPC_ENDPOINTS.length; attempt++) {
      try {
        return await fn(attempt === 0 ? conn : rotateRpc());
      } catch (e: any) {
        lastErr = e;
        if (e.message?.includes("Insufficient USDC") || e.message?.includes("No USDC")) throw e;
      }
    }
    throw lastErr;
  }

  let senderHasUsdc = false;
  try {
    const fromAccount = await rpcCall(c => getAccount(c, fromAta));
    if (fromAccount.amount < BigInt(amount)) {
      const has = Number(fromAccount.amount) / Math.pow(10, USDC_DECIMALS);
      throw new Error(`Insufficient USDC balance. You have ${has.toFixed(2)} USDC but need ${amountUsdc} USDC.`);
    }
    senderHasUsdc = true;
  } catch (e: any) {
    if (e.message?.includes("Insufficient USDC")) throw e;
    throw new Error("No USDC token account found for your wallet. You need USDC (SPL) on Solana to make this payment.");
  }

  const transaction = new Transaction();

  try {
    await rpcCall(c => getAccount(c, toAta));
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(fromPubkey, toAta, toPubkey, USDC_MINT)
    );
  }

  transaction.add(
    createTransferInstruction(fromAta, toAta, fromPubkey, amount)
  );

  transaction.feePayer = fromPubkey;

  const { blockhash } = await rpcCall(c => c.getLatestBlockhash("confirmed"));
  transaction.recentBlockhash = blockhash;

  try {
    const { signature } = await phantom.signAndSendTransaction(transaction);
    setTimeout(fetchBalance, 3000);
    return signature;
  } catch (e: any) {
    if (e.message?.includes("User rejected")) {
      throw new Error("Transaction cancelled by user.");
    }
    throw new Error(e.message || "Transaction failed. Please try again.");
  }
}

export async function signAndSendSerializedTransaction(serializedBase64: string): Promise<string> {
  const phantom = getPhantom();
  if (!phantom || !walletState.connected || !walletState.publicKey) {
    throw new Error("Wallet not connected");
  }

  const buffer = Buffer.from(serializedBase64, "base64");
  const transaction = Transaction.from(buffer);

  const { signature } = await phantom.signAndSendTransaction(transaction);
  setTimeout(fetchBalance, 3000);
  return signature;
}

if (typeof window !== "undefined") {
  const phantom = getPhantom();
  if (phantom?.isConnected && phantom?.publicKey) {
    walletState = {
      connected: true,
      publicKey: phantom.publicKey.toString(),
      balance: null,
      connecting: false,
    };
    fetchBalance();
    balanceInterval = setInterval(fetchBalance, 30000);
  }
}
