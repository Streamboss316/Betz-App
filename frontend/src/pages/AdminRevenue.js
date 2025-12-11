import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { ArrowLeft, DollarSign, TrendingUp, Download, Building } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminRevenue() {
  const navigate = useNavigate();
  const [revenue, setRevenue] = useState(null);
  const [settings, setSettings] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const [revenueRes, settingsRes] = await Promise.all([
        axios.get(`${API}/admin/revenue`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setRevenue(revenueRes.data);
      setSettings(settingsRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load revenue data');
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (parseFloat(withdrawAmount) > revenue.total_revenue) {
      toast.error('Insufficient platform revenue');
      return;
    }

    if (!settings?.bank_account_number || !settings?.bank_routing_number) {
      toast.error('Please configure bank account in Settings first');
      navigate('/admin/settings');
      return;
    }

    setWithdrawing(true);

    // Simulate withdrawal process
    setTimeout(() => {
      toast.success(`$${parseFloat(withdrawAmount).toFixed(2)} withdrawal initiated to ${settings.bank_account_holder || 'Company Account'}`);
      toast.info('Funds typically arrive in 1-3 business days');
      setWithdrawAmount('');
      setWithdrawing(false);
      // In production, this would actually process the withdrawal
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl font-heading">Processing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-border/50 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')} className="rounded-full" data-testid="back-button">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4" data-testid="revenue-title">Revenue & Withdrawals</h1>
      </header>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Total Revenue Card */}
        <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-white/10 shadow-lg p-8 rounded-2xl" data-testid="total-revenue-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground mb-2">Total Platform Revenue (3% Fees)</p>
              <h2 className="text-5xl font-bold font-mono tracking-tight text-white" data-testid="total-revenue">
                ${revenue?.total_revenue?.toFixed(2) || '0.00'}
              </h2>
            </div>
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Earned from {revenue?.fees?.length || 0} completed bets
          </p>
        </Card>

        {/* Withdrawal Card */}
        <Card className="premium-card p-6 rounded-2xl" data-testid="withdrawal-card">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Download className="h-5 w-5 mr-2 text-primary" />
            Withdraw to Bank Account
          </h3>

          {settings?.bank_account_number ? (
            <>
              <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-accent" />
                  <p className="text-sm font-semibold">{settings.bank_account_holder || 'Company Account'}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Account: ****{settings.bank_account_number.slice(-4)} | Routing: {settings.bank_routing_number}
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="withdraw-amount">Withdrawal Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="withdraw-amount"
                      data-testid="withdraw-amount-input"
                      type="number"
                      step="0.01"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-10 bg-input/50 border-white/10 rounded-lg h-12 font-mono text-lg"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Available: ${revenue?.total_revenue?.toFixed(2) || '0.00'}
                  </p>
                </div>

                <Button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount}
                  className="w-full btn-premium text-white hover:bg-primary/90 rounded-2xl h-14 text-base font-semibold btn-premium"
                  data-testid="withdraw-button"
                >
                  {withdrawing ? (
                    'Processing Withdrawal...'
                  ) : (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Withdraw to Bank Account
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Funds typically arrive in 1-3 business days
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground mb-4">No bank account configured</p>
              <Button
                onClick={() => navigate('/admin/settings')}
                className="btn-premium text-white rounded-full"
              >
                Configure Bank Account
              </Button>
            </div>
          )}
        </Card>

        {/* Revenue Breakdown */}
        <Card className="premium-card p-6 rounded-2xl" data-testid="revenue-breakdown-card">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Revenue Breakdown
          </h3>

          <div className="space-y-3">
            {revenue?.fees?.slice(0, 10).map((fee) => (
              <div key={fee.fee_id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div>
                  <p className="text-sm font-semibold">${fee.amount.toFixed(2)} fee</p>
                  <p className="text-xs text-muted-foreground">
                    Total Pool: ${fee.total_pool.toFixed(2)} | Bet ID: {fee.bet_id.substring(0, 8)}...
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(fee.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {revenue?.fees?.length > 10 && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Showing latest 10 of {revenue.fees.length} transactions
            </p>
          )}
        </Card>

        {/* Daily Revenue Chart */}
        {revenue?.daily_revenue && Object.keys(revenue.daily_revenue).length > 0 && (
          <Card className="premium-card p-6 rounded-2xl" data-testid="daily-revenue-card">
            <h3 className="text-lg font-bold mb-4">Daily Revenue</h3>
            <div className="space-y-2">
              {Object.entries(revenue.daily_revenue).slice(-7).map(([date, amount]) => (
                <div key={date} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <p className="text-sm">{new Date(date).toLocaleDateString()}</p>
                  <p className="text-lg font-bold font-mono text-primary">${amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
