import { useState, useEffect } from "react";
import { useWalletState } from "@/components/WalletButton";
import { sendSolTransfer } from "@/lib/solanaWallet";
import { CircleDollarSign, Send, Loader2, ArrowUpRight, Wallet, ExternalLink, AlertTriangle } from "lucide-react";

interface Transaction {
  id: number;
  recipient: string;
  amount: number;
  token: string;
  status: string;
  txHash: string;
  protocol: string;
  createdAt: string;
}

function isValidSolanaAddress(addr: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

export default function BananaBotPanel({ onSendChat }: { onSendChat: (msg: string) => void }) {
  const wallet = useWalletState();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("SOL");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions").then(r => r.json()).then(setTransactions).finally(() => setLoading(false));
  }, []);

  const totalSent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const isRealTx = wallet.connected && wallet.publicKey && isValidSolanaAddress(recipient.trim()) && token === "SOL";

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !amount.trim()) return;
    setError(null);
    setSending(true);

    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Invalid amount");
        return;
      }

      if (isRealTx) {
        const signature = await sendSolTransfer(recipient.trim(), parsedAmount);

        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: recipient.trim(),
            amount: parsedAmount,
            token: "SOL",
            txHash: signature,
            fromWallet: wallet.publicKey,
          }),
        });
        if (res.ok) {
          const tx = await res.json();
          setTransactions(prev => [tx, ...prev]);
          onSendChat(`Sent ${parsedAmount} SOL to ${recipient.trim()} on-chain. Tx: ${signature}`);
          setRecipient("");
          setAmount("");
        }
      } else {
        setError(
          !wallet.connected
            ? "Connect your Phantom wallet to send real transactions"
            : !isValidSolanaAddress(recipient.trim())
            ? "Enter a valid Solana wallet address"
            : "Only SOL transfers supported for on-chain transactions"
        );
      }
    } catch (err: any) {
      const msg = err?.message || "Transaction failed";
      if (msg.includes("User rejected")) {
        setError("Transaction cancelled by user");
      } else {
        setError(msg);
      }
    } finally {
      setSending(false);
    }
  };

  const solscanUrl = (hash: string) => `https://solscan.io/tx/${hash}`;
  const isRealHash = (hash: string) => hash.length > 20 && !hash.includes("...");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-2 border-4 border-green-500/40 bg-black/60 backdrop-blur-sm shadow-[4px_4px_0px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🍌</span>
          <CircleDollarSign className="w-4 h-4 text-green-400" />
          <span className="font-display text-[11px] text-green-400 drop-shadow-[2px_2px_0px_#000]">SOL TRANSFER</span>
          <span className="text-[10px] text-green-400 font-display border-2 border-green-500/30 px-1.5 bg-green-500/10">{transactions.length} TXS</span>
        </div>
        {totalSent > 0 && (
          <span className="text-[9px] text-muted-foreground font-display">{totalSent.toFixed(4)} TOTAL SENT</span>
        )}
      </div>

      {wallet.connected && wallet.publicKey ? (
        <div className="flex items-center gap-2 p-2 border-4 border-green-500/30 bg-green-500/10 shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
          <span className="text-sm">🐒</span>
          <Wallet className="w-3 h-3 text-green-400" />
          <span className="text-[9px] text-green-400 font-display">FROM:</span>
          <span className="text-[9px] text-white font-mono">{wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-4)}</span>
          {wallet.balance !== null && (
            <span className="text-[9px] text-yellow-400 font-display ml-auto drop-shadow-[1px_1px_0px_#000]">{wallet.balance.toFixed(4)} SOL</span>
          )}
          <div className="w-2 h-2 bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2 border-4 border-yellow-500/30 bg-yellow-500/10 shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
          <span className="text-sm">⚠️</span>
          <AlertTriangle className="w-3 h-3 text-yellow-400" />
          <span className="text-[9px] text-yellow-400 font-display drop-shadow-[1px_1px_0px_#000]">CONNECT PHANTOM WALLET TO SEND REAL TRANSACTIONS</span>
        </div>
      )}

      <form onSubmit={handleSend} className="p-3 border-4 border-green-500/30 bg-black/60 backdrop-blur-sm space-y-2 shadow-[4px_4px_0px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs">🍌</span>
          <span className="font-display text-[9px] text-green-400 drop-shadow-[1px_1px_0px_#000]">SEND BANANAS (SOL)</span>
        </div>
        <input
          value={recipient}
          onChange={e => { setRecipient(e.target.value); setError(null); }}
          placeholder="Recipient Solana wallet address"
          data-testid="input-recipient"
          className="w-full bg-black/60 border-4 border-foreground/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-green-500 placeholder:text-muted-foreground/50 font-mono shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
        />
        <div className="flex gap-2">
          <input
            value={amount}
            onChange={e => { setAmount(e.target.value); setError(null); }}
            placeholder="Amount in SOL"
            type="number"
            step="0.0001"
            min="0"
            data-testid="input-amount"
            className="flex-1 bg-black/60 border-4 border-foreground/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-green-500 placeholder:text-muted-foreground/50 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
          />
          <div className="bg-black/60 border-4 border-green-500/50 text-green-400 px-3 py-2 text-sm font-display flex items-center shadow-[2px_2px_0px_rgba(0,0,0,0.4)]">
            SOL
          </div>
        </div>
        {recipient.trim() && !isValidSolanaAddress(recipient.trim()) && (
          <div className="text-[9px] text-yellow-400 font-display flex items-center gap-1 border-2 border-yellow-500/30 px-2 py-1 bg-yellow-500/10">
            <AlertTriangle className="w-3 h-3" /> INVALID SOLANA ADDRESS FORMAT
          </div>
        )}
        {error && (
          <div className="text-[9px] text-red-400 font-display flex items-center gap-1 border-2 border-red-500/30 px-2 py-1 bg-red-500/10">
            <AlertTriangle className="w-3 h-3" /> {error}
          </div>
        )}
        <button
          type="submit"
          disabled={sending || !recipient.trim() || !amount.trim() || !wallet.connected}
          data-testid="button-send-payment"
          className="w-full py-2.5 text-[10px] font-display disabled:opacity-50 flex items-center justify-center gap-2 border-4 border-green-500/60 bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,0.6)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
        >
          {sending ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> SIGNING WITH PHANTOM...</>
          ) : (
            <><Send className="w-3 h-3" /> SEND SOL ON-CHAIN 🍌</>
          )}
        </button>
      </form>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-4 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-green-400" />
          <span className="text-[9px] text-muted-foreground font-display">LOADING TXS...</span>
        </div>
      ) : transactions.length > 0 && (
        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
          <div className="font-display text-[9px] text-muted-foreground flex items-center gap-1">🧾 TRANSACTION HISTORY</div>
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center gap-2 p-2.5 border-4 border-foreground/15 bg-black/60 backdrop-blur-sm shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:border-green-500/30 transition-colors" data-testid={`tx-row-${tx.id}`}>
              <ArrowUpRight className="w-3 h-3 text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-white font-display drop-shadow-[1px_1px_0px_#000]">{tx.amount} {tx.token}</span>
                  <span className="text-muted-foreground">to</span>
                  <span className="text-green-400 truncate font-mono text-[9px]">{tx.recipient.slice(0, 8)}...{tx.recipient.slice(-4)}</span>
                </div>
                {isRealHash(tx.txHash) ? (
                  <a
                    href={solscanUrl(tx.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1"
                    data-testid={`tx-link-${tx.id}`}
                  >
                    {tx.txHash.slice(0, 16)}...{tx.txHash.slice(-8)}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <span className="text-[9px] text-muted-foreground font-mono">tx:{tx.txHash}</span>
                )}
              </div>
              <span className={`text-[9px] font-display shrink-0 border-2 px-1.5 py-0.5 ${tx.status === "confirmed" ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-yellow-500/30 text-yellow-400 bg-yellow-500/10"}`}>
                {tx.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
