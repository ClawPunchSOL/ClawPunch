import { useState, useEffect } from "react";
import { CircleDollarSign, Send, Loader2, ArrowUpRight } from "lucide-react";

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

export default function BananaBotPanel({ onSendChat }: { onSendChat: (msg: string) => void }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("USDC");
  const [sending, setSending] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions").then(r => r.json()).then(setTransactions).finally(() => setLoading(false));
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !amount.trim()) return;
    setSending(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: recipient.trim(), amount, token }),
      });
      if (res.ok) {
        const tx = await res.json();
        setTransactions(prev => [tx, ...prev]);
        onSendChat(`Send ${amount} ${token} to ${recipient} via x402 protocol`);
        setRecipient("");
        setAmount("");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CircleDollarSign className="w-4 h-4 text-green-400" />
        <span className="font-display text-[11px] text-white">X402 QUICK SEND</span>
        <span className="text-[10px] text-green-400 font-display">{transactions.length} TXS</span>
      </div>

      <form onSubmit={handleSend} className="p-3 border-2 border-green-500/30 bg-green-500/5 space-y-2">
        <input
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          placeholder="Recipient (@user or wallet address)"
          data-testid="input-recipient"
          className="w-full bg-black/50 border-2 border-border text-white px-3 py-2 text-sm focus:outline-none focus:border-green-500 placeholder:text-muted-foreground/50"
        />
        <div className="flex gap-2">
          <input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Amount"
            type="number"
            step="0.01"
            data-testid="input-amount"
            className="flex-1 bg-black/50 border-2 border-border text-white px-3 py-2 text-sm focus:outline-none focus:border-green-500 placeholder:text-muted-foreground/50"
          />
          <select
            value={token}
            onChange={e => setToken(e.target.value)}
            data-testid="select-token"
            className="bg-black/50 border-2 border-border text-white px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          >
            <option value="USDC">USDC</option>
            <option value="SOL">SOL</option>
            <option value="PUNCH">$PUNCH</option>
          </select>
        </div>
        <button type="submit" disabled={sending || !recipient.trim() || !amount.trim()} data-testid="button-send-payment" className="w-full retro-button retro-button-primary text-[10px] py-2 disabled:opacity-50 flex items-center justify-center gap-2">
          {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3" /> SEND VIA X402</>}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-green-400" /></div>
      ) : transactions.length > 0 && (
        <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
          <div className="font-display text-[9px] text-muted-foreground mb-1">TRANSACTION HISTORY</div>
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center gap-2 p-2 border border-border bg-black/20" data-testid={`tx-row-${tx.id}`}>
              <ArrowUpRight className="w-3 h-3 text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-white font-display">{tx.amount} {tx.token}</span>
                  <span className="text-muted-foreground">to</span>
                  <span className="text-green-400 truncate">{tx.recipient}</span>
                </div>
                <span className="text-[9px] text-muted-foreground font-mono">tx:{tx.txHash}</span>
              </div>
              <span className="text-[9px] text-green-400 font-display shrink-0">{tx.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
