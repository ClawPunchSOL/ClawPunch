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

function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  }
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
  try {
    const conn = getConnection();
    const pk = new PublicKey(walletState.publicKey);
    const bal = await conn.getBalance(pk);
    walletState = { ...walletState, balance: bal / LAMPORTS_PER_SOL };
    notify();
  } catch {
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
