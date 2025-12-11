import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { ArrowLeft, Save, Building, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await axios.get(`${API}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load settings');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('admin_token');

    try {
      await axios.put(`${API}/admin/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl font-heading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')} className="rounded-full" data-testid="back-button">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold font-heading ml-4" data-testid="settings-title">Platform Settings</h1>
      </header>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Platform Fees */}
        <Card className="premium-card p-6 rounded-2xl" data-testid="fees-card">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-primary" />
            Platform Fees & Limits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fee">Platform Fee (%)</Label>
              <Input
                id="fee"
                data-testid="platform-fee-input"
                type="number"
                step="0.1"
                value={settings?.platform_fee_percentage || 3}
                onChange={(e) => setSettings({...settings, platform_fee_percentage: parseFloat(e.target.value)})}
                className="bg-input/50 border-white/10 rounded-lg h-12"
              />
              <p className="text-xs text-muted-foreground mt-1">Deducted from completed bets</p>
            </div>
            <div>
              <Label htmlFor="punk">Punk Out Penalty (%)</Label>
              <Input
                id="punk"
                data-testid="punk-out-input"
                type="number"
                step="0.1"
                value={settings?.punk_out_percentage || 10}
                onChange={(e) => setSettings({...settings, punk_out_percentage: parseFloat(e.target.value)})}
                className="bg-input/50 border-white/10 rounded-lg h-12"
              />
              <p className="text-xs text-muted-foreground mt-1">Penalty for backing out of bet</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="min">Minimum Bet ($)</Label>
              <Input
                id="min"
                data-testid="min-bet-input"
                type="number"
                value={settings?.min_bet_amount || 10}
                onChange={(e) => setSettings({...settings, min_bet_amount: parseFloat(e.target.value)})}
                className="bg-input/50 border-white/10 rounded-lg h-12"
              />
            </div>
            <div>
              <Label htmlFor="max">Maximum Bet ($)</Label>
              <Input
                id="max"
                data-testid="max-bet-input"
                type="number"
                value={settings?.max_bet_amount || 100000}
                onChange={(e) => setSettings({...settings, max_bet_amount: parseFloat(e.target.value)})}
                className="bg-input/50 border-white/10 rounded-lg h-12"
              />
            </div>
          </div>
        </Card>

        {/* Bank Account */}
        <Card className="premium-card p-6 rounded-2xl" data-testid="bank-card">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2 text-primary" />
            Bank Account Information
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="holder">Account Holder Name</Label>
              <Input
                id="holder"
                data-testid="account-holder-input"
                value={settings?.bank_account_holder || ''}
                onChange={(e) => setSettings({...settings, bank_account_holder: e.target.value})}
                placeholder="BETZ Inc."
                className="bg-input/50 border-white/10 rounded-lg h-12"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account">Account Number</Label>
                <Input
                  id="account"
                  data-testid="account-number-input"
                  value={settings?.bank_account_number || ''}
                  onChange={(e) => setSettings({...settings, bank_account_number: e.target.value})}
                  placeholder="123456789"
                  className="bg-input/50 border-white/10 rounded-lg h-12"
                />
              </div>
              <div>
                <Label htmlFor="routing">Routing Number</Label>
                <Input
                  id="routing"
                  data-testid="routing-number-input"
                  value={settings?.bank_routing_number || ''}
                  onChange={(e) => setSettings({...settings, bank_routing_number: e.target.value})}
                  placeholder="021000021"
                  className="bg-input/50 border-white/10 rounded-lg h-12"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Stripe Settings */}
        <Card className="premium-card p-6 rounded-2xl" data-testid="stripe-card">
          <h3 className="text-lg font-bold mb-4">Stripe Payment Settings</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pub-key">Publishable Key</Label>
              <Input
                id="pub-key"
                data-testid="stripe-pub-key-input"
                value={settings?.stripe_publishable_key || ''}
                onChange={(e) => setSettings({...settings, stripe_publishable_key: e.target.value})}
                placeholder="pk_live_..."
                className="bg-input/50 border-white/10 rounded-lg h-12"
              />
            </div>
            <div>
              <Label htmlFor="secret-key">Secret Key</Label>
              <Input
                id="secret-key"
                data-testid="stripe-secret-key-input"
                type="password"
                value={settings?.stripe_secret_key || ''}
                onChange={(e) => setSettings({...settings, stripe_secret_key: e.target.value})}
                placeholder="sk_live_..."
                className="bg-input/50 border-white/10 rounded-lg h-12"
              />
            </div>
            <div className="p-3 bg-accent/10 rounded-lg text-sm border border-accent/20">
              <p className="text-accent font-semibold mb-1">Current: Test Mode</p>
              <p className="text-muted-foreground">Using test key: sk_test_emergent</p>
              <p className="text-muted-foreground mt-2">Update to production keys for live transactions</p>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          data-testid="save-settings-button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-14 text-lg font-bold uppercase btn-premium"
        >
          {saving ? 'Saving...' : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
