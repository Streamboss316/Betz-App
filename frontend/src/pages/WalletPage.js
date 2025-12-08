import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function WalletPage({ user, setUser }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    loadTransactions();
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, []);

  const loadTransactions = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/wallet/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data);
    } catch (error) {
      console.error('Failed to load transactions');
    }
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    if (attempts >= 5) {
      toast.error('Payment verification timeout');
      return;
    }

    setPolling(true);
    const token = localStorage.getItem('token');

    try {
      const res = await axios.get(`${API}/payments/checkout/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.payment_status === 'paid') {
        toast.success('Payment successful!');
        
        const userRes = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userRes.data);
        loadTransactions();
        setPolling(false);
        
        window.history.replaceState({}, '', '/wallet');
      } else if (res.data.status === 'expired') {
        toast.error('Payment session expired');
        setPolling(false);
      } else {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
      }
    } catch (error) {
      toast.error('Payment verification failed');
      setPolling(false);
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await axios.post(`${API}/payments/checkout/session`, {
        amount: parseFloat(amount),
        origin_url: window.location.origin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      window.location.href = res.data.url;
    } catch (error) {
      toast.error('Failed to initiate deposit');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full" data-testid="back-button">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold font-heading ml-4" data-testid="wallet-title">Wallet</h1>
      </header>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-white/10 shadow-2xl p-8 rounded-2xl" data-testid="balance-card">
          <p className="text-xs uppercase tracking-widest text-muted-foreground/70 mb-2">Available Balance</p>
          <h2 className="text-5xl font-black font-mono tracking-tight text-foreground mb-6" data-testid="wallet-balance">
            ${user.balance?.toFixed(2) || '0.00'}
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Deposit Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  data-testid="deposit-amount-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100.00"
                  className="pl-10 bg-input/50 border-white/10 rounded-lg h-12 font-mono text-lg"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <Button
              data-testid="deposit-button"
              onClick={handleDeposit}
              disabled={loading || polling}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-14 text-lg font-bold uppercase btn-glow"
            >
              {loading ? 'Processing...' : polling ? 'Verifying Payment...' : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Deposit Funds
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Transactions */}
        <div>
          <h3 className="text-lg font-bold mb-4" data-testid="transactions-title">Transaction History</h3>
          {transactions.length === 0 ? (
            <Card className="bg-card border-white/10 p-8 rounded-2xl text-center">
              <p className="text-muted-foreground">No transactions yet</p>
            </Card>
          ) : (
            <div className="space-y-3" data-testid="transactions-list">
              {transactions.map((tx) => (
                <Card key={tx.session_id} className="bg-card border-white/10 p-4 rounded-xl" data-testid={`transaction-${tx.session_id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        tx.payment_status === 'paid' ? 'bg-primary/20' : 'bg-yellow-500/20'
                      }`}>
                        {tx.payment_status === 'paid' ? (
                          <TrendingUp className="h-5 w-5 text-primary" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">Deposit</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold font-mono text-primary">
                        +${tx.amount.toFixed(2)}
                      </p>
                      <p className={`text-xs ${
                        tx.payment_status === 'paid' ? 'text-primary' : 'text-yellow-500'
                      }`}>
                        {tx.payment_status}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}