import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { ArrowLeft, Users, Play } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDemoMode() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await axios.get(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  const handleTestAsUser = async (userEmail) => {
    const token = localStorage.getItem('admin_token');
    
    try {
      // Determine password based on email
      const passwordMap = {
        'demo@betz.com': 'demo123',
        'test@betz.com': 'test123',
        'speed@betz.com': 'speed123'
      };
      const password = passwordMap[userEmail] || 'demo123';
      
      const res = await axios.post(`${API}/auth/login`, {
        email: userEmail,
        password: password
      });
      
      // Save user token
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('demo_mode_active', 'true');
      localStorage.setItem('admin_return_token', token);
      
      toast.success(`Testing as ${res.data.user.name}`);
      
      // Redirect to user app
      window.location.href = '/';
    } catch (error) {
      toast.error('Failed to login as user');
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('This will reset all demo data including users, bets, and messages. Continue?')) {
      return;
    }
    
    const token = localStorage.getItem('admin_token');
    try {
      const res = await axios.post(`${API}/admin/demo/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(res.data.message);
      loadUsers(); // Reload users list
    } catch (error) {
      toast.error('Failed to reset demo data');
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-primary text-2xl font-heading">Processing...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-border/50 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')} className="rounded-full" data-testid="back-button">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4" data-testid="demo-mode-title">Demo Mode - Test as User</h1>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-white/10 p-6 rounded-2xl mb-6">
          <div className="flex items-center gap-5">
            <Users className="h-12 w-12 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Test Complete Betting Flow</h2>
              <p className="text-sm text-muted-foreground">Login as any user to experience the app from their perspective</p>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6 rounded-2xl mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">How to Test Complete Flow:</h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Login as <span className="text-primary font-semibold">Demo Racer</span> - Explore profile, place bets</li>
                <li>Login as <span className="text-accent font-semibold">Test Driver</span> - Accept bets, send messages</li>
                <li>Login as <span className="text-primary font-semibold">Speed Master</span> - View as DP, declare winners</li>
                <li>Return to admin panel to manage everything</li>
              </ol>
            </div>
            <Button
              variant="destructive"
              onClick={handleResetDemoData}
              className="ml-4 whitespace-nowrap"
              data-testid="reset-demo-button"
            >
              Reset Demo Data
            </Button>
          </div>
          <p className="text-xs text-accent mt-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <strong>Note:</strong> Click "Reset Demo Data" to restore sample users, bets, and interactions for testing
          </p>
        </Card>

        <div className="grid gap-5">
          <h3 className="text-lg font-bold">Select User to Test As:</h3>
          {users.map((user) => (
            <Card key={user.user_id} className="premium-card p-4 rounded-2xl hover:border-primary/50 transition-all" data-testid={`test-user-${user.user_id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <Avatar className="h-14 w-14 border-2 border-primary/50">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="btn-premium text-white text-lg font-bold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-lg">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-accent font-mono mt-1">{user.betz_id}</p>
                  </div>
                </div>
                <div className="text-right mr-4">
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-xl font-bold font-mono text-primary">${user.balance.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user.win_count}W / {user.loss_count}L
                  </p>
                </div>
                <Button
                  onClick={() => handleTestAsUser(user.email)}
                  className="btn-premium text-white rounded-full"
                  data-testid={`login-as-${user.user_id}`}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Test as User
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}