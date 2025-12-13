import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, DollarSign, ArrowDownToLine, ArrowUpFromLine, CreditCard, Building, Wallet, ShieldCheck, Lock, History } from 'lucide-react';
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
  const [showDepositMethods, setShowDepositMethods] = useState(false);
  const [showWithdrawalMethods, setShowWithdrawalMethods] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank');
  const [withdrawalDetails, setWithdrawalDetails] = useState({
    accountNumber: '',
    routingNumber: '',
    accountName: '',
    email: '',
    phone: ''
  });

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

  const handleWithdrawal = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Enter a valid withdrawal amount');
      return;
    }

    if (parseFloat(withdrawAmount) > user.balance) {
      toast.error('Insufficient balance');
      return;
    }

    // Validate withdrawal details based on method
    if (withdrawMethod === 'bank' && (!withdrawalDetails.accountNumber || !withdrawalDetails.routingNumber)) {
      toast.error('Please enter bank account details');
      return;
    }

    if ((withdrawMethod === 'paypal' || withdrawMethod === 'cashapp' || withdrawMethod === 'zelle') && !withdrawalDetails.email) {
      toast.error('Please enter email address');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      await axios.post(`${API}/wallet/withdraw`, {
        amount: parseFloat(withdrawAmount),
        method: withdrawMethod,
        details: withdrawalDetails
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Withdrawal request submitted! Processing may take 2-5 business days.');
      
      // Refresh user balance
      const userRes = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data);
      
      setWithdrawAmount('');
      setShowWithdrawalMethods(false);
      loadTransactions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6">
        <h1 className="text-xl font-bold font-heading" data-testid="wallet-title">Wallet</h1>
      </header>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-white/10 shadow-2xl p-8 rounded-2xl" data-testid="balance-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm tracking-widest text-muted-foreground/80 uppercase">Available Balance</p>
            <div className="flex items-center gap-1.5 bg-green-500/20 px-3 py-1 rounded-full">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-500 font-semibold">Secured</span>
            </div>
          </div>
          <h2 className="text-6xl font-black font-mono tracking-tight text-foreground mb-4" data-testid="wallet-balance">
            ${user.balance?.toFixed(2) || '0.00'}
          </h2>
          
          {/* Security Info */}
          <div className="flex items-center gap-2 mb-8 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Your funds are protected and guaranteed for payouts</span>
          </div>

          {/* Deposit & Withdrawal Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Button
              onClick={() => {
                setShowDepositMethods(!showDepositMethods);
                setShowWithdrawalMethods(false);
              }}
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10 rounded-xl h-12 text-sm font-semibold"
              data-testid="show-deposit-button"
            >
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Deposit
            </Button>
            <Button
              onClick={() => {
                setShowWithdrawalMethods(!showWithdrawalMethods);
                setShowDepositMethods(false);
              }}
              variant="outline"
              className="border-accent/50 text-accent hover:bg-accent/10 rounded-xl h-12 text-sm font-semibold"
              data-testid="show-withdrawal-button"
            >
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          </div>

          {/* Transaction History Link */}
          <Button
            onClick={() => navigate('/transactions')}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground rounded-xl h-10"
            data-testid="view-transactions-button"
          >
            <History className="mr-2 h-4 w-4" />
            View Full Transaction History
          </Button>
        </Card>

        {/* Deposit Section */}
        {showDepositMethods && (
          <Card className="premium-card p-6 rounded-2xl" data-testid="deposit-section">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-primary" />
              Deposit Funds
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Amount</label>
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
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Payment Methods Accepted:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Credit Card</Badge>
                  <Badge variant="secondary">Debit Card</Badge>
                  <Badge variant="secondary">Bank Transfer</Badge>
                </div>
              </div>
              <Button
                data-testid="deposit-button"
                onClick={handleDeposit}
                disabled={loading || polling}
                className="w-full btn-premium text-white hover:bg-primary/90 rounded-full h-12 font-bold"
              >
                {loading ? 'Processing...' : polling ? 'Verifying Payment...' : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Continue to Payment
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Withdrawal Section */}
        {showWithdrawalMethods && (
          <Card className="premium-card p-6 rounded-2xl" data-testid="withdrawal-section">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-accent" />
              Withdraw Funds
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="number"
                    data-testid="withdraw-amount-input"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="50.00"
                    className="pl-10 bg-input/50 border-white/10 rounded-lg h-12 font-mono text-lg"
                    step="0.01"
                    min="0"
                    max={user.balance}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-2">Withdrawal Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={withdrawMethod === 'bank' ? 'default' : 'outline'}
                    onClick={() => setWithdrawMethod('bank')}
                    className="h-12"
                    data-testid="method-bank"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Bank
                  </Button>
                  <Button
                    variant={withdrawMethod === 'paypal' ? 'default' : 'outline'}
                    onClick={() => setWithdrawMethod('paypal')}
                    className="h-12"
                    data-testid="method-paypal"
                  >
                    PayPal
                  </Button>
                  <Button
                    variant={withdrawMethod === 'cashapp' ? 'default' : 'outline'}
                    onClick={() => setWithdrawMethod('cashapp')}
                    className="h-12"
                    data-testid="method-cashapp"
                  >
                    Cash App
                  </Button>
                  <Button
                    variant={withdrawMethod === 'zelle' ? 'default' : 'outline'}
                    onClick={() => setWithdrawMethod('zelle')}
                    className="h-12"
                    data-testid="method-zelle"
                  >
                    Zelle
                  </Button>
                </div>
              </div>

              {/* Bank Details */}
              {withdrawMethod === 'bank' && (
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                  <Input
                    placeholder="Account Holder Name"
                    value={withdrawalDetails.accountName}
                    onChange={(e) => setWithdrawalDetails({...withdrawalDetails, accountName: e.target.value})}
                    className="bg-input/50 border-white/10"
                    data-testid="account-name"
                  />
                  <Input
                    placeholder="Account Number"
                    value={withdrawalDetails.accountNumber}
                    onChange={(e) => setWithdrawalDetails({...withdrawalDetails, accountNumber: e.target.value})}
                    className="bg-input/50 border-white/10"
                    data-testid="account-number"
                  />
                  <Input
                    placeholder="Routing Number"
                    value={withdrawalDetails.routingNumber}
                    onChange={(e) => setWithdrawalDetails({...withdrawalDetails, routingNumber: e.target.value})}
                    className="bg-input/50 border-white/10"
                    data-testid="routing-number"
                  />
                </div>
              )}

              {/* PayPal/Cash App/Zelle Details */}
              {(withdrawMethod === 'paypal' || withdrawMethod === 'cashapp' || withdrawMethod === 'zelle') && (
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                  <Input
                    placeholder="Email Address"
                    type="email"
                    value={withdrawalDetails.email}
                    onChange={(e) => setWithdrawalDetails({...withdrawalDetails, email: e.target.value})}
                    className="bg-input/50 border-white/10"
                    data-testid="withdrawal-email"
                  />
                  {withdrawMethod === 'cashapp' && (
                    <Input
                      placeholder="Phone Number (optional)"
                      value={withdrawalDetails.phone}
                      onChange={(e) => setWithdrawalDetails({...withdrawalDetails, phone: e.target.value})}
                      className="bg-input/50 border-white/10"
                      data-testid="withdrawal-phone"
                    />
                  )}
                </div>
              )}

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-500">
                  ⚠️ Withdrawals typically take 2-5 business days to process
                </p>
              </div>

              <Button
                data-testid="withdraw-button"
                onClick={handleWithdrawal}
                disabled={loading}
                className="w-full btn-gold hover:bg-accent/90 rounded-full h-12 font-bold"
              >
                {loading ? 'Processing...' : (
                  <>
                    <ArrowUpFromLine className="mr-2 h-5 w-5" />
                    Request Withdrawal
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Transactions */}
        <div>
          <h3 className="text-lg font-bold mb-4" data-testid="transactions-title">Transaction History</h3>
          {transactions.length === 0 ? (
            <Card className="premium-card p-8 rounded-2xl text-center">
              <p className="text-muted-foreground">No transactions yet</p>
            </Card>
          ) : (
            <div className="space-y-3" data-testid="transactions-list">
              {transactions.map((tx) => (
                <Card key={tx.session_id} className="premium-card p-4 rounded-xl" data-testid={`transaction-${tx.session_id}`}>
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