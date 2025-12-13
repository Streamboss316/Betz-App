import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Users, DollarSign, TrendingUp, Activity, Settings, LogOut, Shield, Eye, TestTube, Calendar, AlertTriangle, Trophy, UserCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Demo users for quick switching
const DEMO_USERS = [
  { email: 'demo@betz.com', password: 'demo123', name: 'Demo User' },
  { email: 'test@betz.com', password: 'test123', name: 'Test User' },
  { email: 'dp@betz.com', password: 'dp123', name: 'DP User' },
];

export default function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [switchingUser, setSwitchingUser] = useState(false);
  const [currentDemoUser, setCurrentDemoUser] = useState(null);

  useEffect(() => {
    loadStats();
    // Check if there's a current demo user logged in
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        const user = res.data;
        const demoUser = DEMO_USERS.find(u => u.email === user.email);
        if (demoUser) {
          setCurrentDemoUser(demoUser);
        }
      }).catch(() => {});
    }
  }, []);

  const loadStats = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const res = await axios.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load stats');
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
      setLoading(false);
    }
  };

  const handleSwitchUser = async (demoUser) => {
    setSwitchingUser(true);
    try {
      const res = await axios.post(`${API}/auth/login`, {
        email: demoUser.email,
        password: demoUser.password
      });
      
      localStorage.setItem('token', res.data.access_token);
      setCurrentDemoUser(demoUser);
      setShowUserSwitcher(false);
      toast.success(`Switched to ${demoUser.name}`);
    } catch (error) {
      toast.error('Failed to switch user');
    } finally {
      setSwitchingUser(false);
    }
  };

  const handleViewAsUser = () => {
    if (currentDemoUser) {
      window.open('/', '_blank');
    } else {
      toast.info('Select a demo user first');
      setShowUserSwitcher(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    onLogout();
    toast.success('Logged out');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p className="text-sm text-muted-foreground">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      {/* Admin Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-primary/20 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black font-heading tracking-tight uppercase text-primary" data-testid="admin-title">BETZ ADMIN</h1>
            <p className="text-xs text-muted-foreground -mt-1">Control Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Demo User Switcher */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUserSwitcher(!showUserSwitcher)}
              className="rounded-xl border-primary/30 text-primary hover:bg-primary/10"
              data-testid="user-switcher-button"
            >
              <UserCircle className="h-4 w-4 mr-2" />
              {currentDemoUser ? currentDemoUser.name : 'Switch User'}
              <ChevronDown className="h-3 w-3 ml-2" />
            </Button>

            {/* Dropdown */}
            {showUserSwitcher && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-background border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-2 border-b border-white/10">
                  <p className="text-xs text-muted-foreground px-2">Switch Demo Account</p>
                </div>
                {DEMO_USERS.map((demoUser) => (
                  <button
                    key={demoUser.email}
                    onClick={() => handleSwitchUser(demoUser)}
                    disabled={switchingUser}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left ${
                      currentDemoUser?.email === demoUser.email ? 'bg-primary/10' : ''
                    }`}
                  >
                    <UserCircle className={`h-5 w-5 ${currentDemoUser?.email === demoUser.email ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="text-sm font-medium">{demoUser.name}</p>
                      <p className="text-xs text-muted-foreground">{demoUser.email}</p>
                    </div>
                    {currentDemoUser?.email === demoUser.email && (
                      <span className="ml-auto text-xs text-primary">Active</span>
                    )}
                  </button>
                ))}
                <div className="p-2 border-t border-white/10">
                  <Button
                    onClick={handleViewAsUser}
                    size="sm"
                    className="w-full btn-premium text-white rounded-lg"
                    disabled={!currentDemoUser}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View as User
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
            data-testid="admin-logout-button"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Click outside to close dropdown */}
      {showUserSwitcher && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserSwitcher(false)} 
        />
      )}

      <div className="p-6 max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">Real-time platform statistics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="premium-card p-5 rounded-2xl" data-testid="total-users-card">
            <Users className="h-8 w-8 text-primary mb-3" />
            <span className="text-3xl font-black font-mono block">{stats?.total_users || 0}</span>
            <p className="text-xs text-muted-foreground mt-1">Total Users</p>
          </Card>

          <Card className="premium-card p-5 rounded-2xl" data-testid="total-bets-card">
            <Activity className="h-8 w-8 text-accent mb-3" />
            <span className="text-3xl font-black font-mono block">{stats?.total_bets || 0}</span>
            <p className="text-xs text-muted-foreground mt-1">Total Bets</p>
          </Card>

          <Card className="premium-card p-5 rounded-2xl" data-testid="active-bets-card">
            <TrendingUp className="h-8 w-8 text-green-500 mb-3" />
            <span className="text-3xl font-black font-mono block">{stats?.active_bets || 0}</span>
            <p className="text-xs text-muted-foreground mt-1">Active Bets</p>
          </Card>

          <Card className="premium-card p-5 rounded-2xl" data-testid="scheduled-bets-card">
            <Calendar className="h-8 w-8 text-purple-400 mb-3" />
            <span className="text-3xl font-black font-mono block">{stats?.scheduled_bets || 0}</span>
            <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
          </Card>

          <Card className="premium-card p-5 rounded-2xl" data-testid="punkout-bets-card">
            <AlertTriangle className="h-8 w-8 text-orange-400 mb-3" />
            <span className="text-3xl font-black font-mono block">{stats?.punk_out_bets || 0}</span>
            <p className="text-xs text-muted-foreground mt-1">Punk Outs</p>
          </Card>

          <Card className="premium-card p-5 rounded-2xl" data-testid="completed-bets-card">
            <Trophy className="h-8 w-8 text-yellow-500 mb-3" />
            <span className="text-3xl font-black font-mono block">{stats?.completed_bets || 0}</span>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </Card>
        </div>

        {/* Revenue Card */}
        <Card className="premium-card p-6 rounded-2xl mb-8 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" data-testid="revenue-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Platform Revenue (3% fees)</p>
              <p className="text-5xl font-black font-mono text-primary">
                ${stats?.total_revenue?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="p-4 bg-primary/20 rounded-2xl">
              <DollarSign className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-muted/20 rounded-xl">
              <p className="text-muted-foreground text-xs">Total Deposits</p>
              <p className="font-mono text-xl font-bold">${stats?.total_deposits?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="p-3 bg-muted/20 rounded-xl">
              <p className="text-muted-foreground text-xs">Completed Bets Value</p>
              <p className="font-mono text-xl font-bold">{stats?.completed_bets || 0}</p>
            </div>
          </div>
        </Card>

        {/* Section Title */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">Quick Actions</h2>
        </div>
        {/* Admin Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/admin/users">
            <Card className="premium-card p-5 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group" data-testid="manage-users-link">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-xl group-hover:bg-primary/30 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Manage Users</h3>
                  <p className="text-xs text-muted-foreground">View, edit, suspend users</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/bets">
            <Card className="premium-card p-5 rounded-2xl hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer group" data-testid="manage-bets-link">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/20 rounded-xl group-hover:bg-accent/30 transition-colors">
                  <Activity className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Manage Bets</h3>
                  <p className="text-xs text-muted-foreground">Monitor and control bets</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/revenue">
            <Card className="premium-card p-5 rounded-2xl hover:border-green-500/50 hover:bg-green-500/5 transition-all cursor-pointer group" data-testid="view-revenue-link">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Revenue & Fees</h3>
                  <p className="text-xs text-muted-foreground">Platform earnings</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/settings">
            <Card className="premium-card p-5 rounded-2xl hover:border-secondary/50 hover:bg-secondary/5 transition-all cursor-pointer group" data-testid="settings-link">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/20 rounded-xl group-hover:bg-secondary/30 transition-colors">
                  <Settings className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Settings</h3>
                  <p className="text-xs text-muted-foreground">Bank & payment setup</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/dp">
            <Card className="premium-card p-5 rounded-2xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer group" data-testid="dp-monitor-link">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                  <Eye className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">DP Monitor</h3>
                  <p className="text-xs text-muted-foreground">View DP decisions</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/demo">
            <Card className="premium-card p-5 rounded-2xl hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer group" data-testid="demo-mode-link">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/20 rounded-xl group-hover:bg-orange-500/30 transition-colors">
                  <TestTube className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Demo Mode</h3>
                  <p className="text-xs text-muted-foreground">Test as any user</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/legal">
            <Card className="premium-card p-5 rounded-2xl hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all cursor-pointer group" data-testid="legal-pages-link">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/20 rounded-xl group-hover:bg-cyan-500/30 transition-colors">
                  <Shield className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Legal & Policies</h3>
                  <p className="text-xs text-muted-foreground">Privacy, Terms, Contact</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
