import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, Trophy, XCircle, Wallet, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TransactionHistoryPage({ user }) {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const [txnRes, summaryRes] = await Promise.all([
        axios.get(`${API}/transactions`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/transactions/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setTransactions(txnRes.data.transactions || []);
      setSummary(summaryRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load transactions');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTransactionIcon = (type) => {
    if (type.includes('deposit')) return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
    if (type.includes('withdrawal')) return <ArrowUpRight className="h-5 w-5 text-red-500" />;
    if (type.includes('win') || type.includes('won')) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (type.includes('bet')) return <Wallet className="h-5 w-5 text-primary" />;
    return <RefreshCw className="h-5 w-5 text-muted-foreground" />;
  };

  const getAmountColor = (amount) => {
    if (amount > 0) return 'text-green-500';
    if (amount < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const formatAmount = (amount) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type) => {
    const labels = {
      'deposit': 'Deposit',
      'withdrawal': 'Withdrawal',
      'bet_win': 'Bet Won',
      'bet_loss': 'Bet Lost',
      'quick_bet_placed': 'Quick Bet',
      'quick_bet_accepted': 'Quick Bet Accepted',
      'quick_bet_won': 'Quick Bet Won',
      'quick_bet_won_admin': 'Quick Bet Won',
      'punk_out_received': 'Punk Out Received',
      'punk_out_paid': 'Punk Out Paid'
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p className="text-sm text-muted-foreground">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Summary Card */}
        {summary && (
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-white/10 p-4 rounded-xl" data-testid="summary-card">
            <div className="text-center mb-4">
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-bold text-primary font-mono">${summary.current_balance.toFixed(2)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <p className="text-xs text-muted-foreground">Total Winnings</p>
                </div>
                <p className="text-lg font-bold text-green-500 font-mono">${summary.total_winnings.toFixed(2)}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <p className="text-xs text-muted-foreground">Total Bet</p>
                </div>
                <p className="text-lg font-bold font-mono">${summary.total_bet_amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="flex items-center justify-center gap-2 bg-green-500/10 p-2 rounded-lg">
                <Trophy className="h-4 w-4 text-green-500" />
                <span className="text-sm font-semibold text-green-500">{summary.win_count} Wins</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-red-500/10 p-2 rounded-lg">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-semibold text-red-500">{summary.loss_count} Losses</span>
              </div>
            </div>
          </Card>
        )}

        {/* Transaction List */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground px-1">Recent Activity</h2>
          
          {transactions.length === 0 ? (
            <Card className="premium-card p-8 rounded-xl text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Wallet className="h-7 w-7 text-blue-500/60" />
              </div>
              <p className="text-muted-foreground font-medium">No transactions yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Deposits, bets, and winnings will appear here</p>
            </Card>
          ) : (
            <Card className="premium-card rounded-xl overflow-hidden divide-y divide-white/5">
              {transactions.map((txn, idx) => (
                <div 
                  key={txn.transaction_id || idx} 
                  className="flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors"
                  data-testid={`transaction-${idx}`}
                >
                  <div className="p-2 rounded-full bg-muted/30">
                    {getTransactionIcon(txn.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{txn.description || getTypeLabel(txn.type)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(txn.created_at)}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-bold font-mono text-sm ${getAmountColor(txn.amount)}`}>
                      {formatAmount(txn.amount)}
                    </p>
                    {txn.status && txn.status !== 'completed' && (
                      <Badge className="text-[10px] bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                        {txn.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
