import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Search, DollarSign, Ban, Check } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [balanceAdjustment, setBalanceAdjustment] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.betz_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await axios.get(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
      setFilteredUsers(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  const handleAdjustBalance = async (userId) => {
    if (!balanceAdjustment) return;
    
    const token = localStorage.getItem('admin_token');
    const user = users.find(u => u.user_id === userId);
    const newBalance = parseFloat(user.balance) + parseFloat(balanceAdjustment);
    
    try {
      await axios.put(`${API}/admin/users/${userId}`, 
        { balance: newBalance },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Balance updated');
      setBalanceAdjustment('');
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      toast.error('Failed to update balance');
    }
  };

  const handleSuspendUser = async (userId) => {
    const token = localStorage.getItem('admin_token');
    try {
      await axios.put(`${API}/admin/users/${userId}`,
        { suspended: true },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('User suspended');
      loadUsers();
    } catch (error) {
      toast.error('Failed to suspend user');
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
        <h1 className="text-xl font-bold ml-4" data-testid="users-title">Manage Users</h1>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <Card className="premium-card p-4 rounded-2xl mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              data-testid="search-users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or Betz ID"
              className="pl-10 bg-input/50 border-white/10 rounded-lg h-12"
            />
          </div>
        </Card>

        <div className="grid gap-5">
          {filteredUsers.map((user) => (
            <Card key={user.user_id} className="premium-card p-6 rounded-2xl" data-testid={`user-${user.user_id}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-5">
                  <Avatar className="h-16 w-16 border-2 border-primary/50">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="btn-premium text-white text-lg font-bold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-bold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-accent font-mono mt-1">{user.betz_id}</p>
                  </div>
                </div>
                {user.suspended && (
                  <Badge className="bg-destructive/20 text-destructive">Suspended</Badge>
                )}
              </div>

              <div className="grid grid-cols-4 gap-5 mb-4 p-4 bg-muted/20 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Balance</p>
                  <p className="text-xl font-bold font-mono text-primary">${user.balance.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Wins</p>
                  <p className="text-xl font-bold font-mono text-primary">{user.win_count}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Losses</p>
                  <p className="text-xl font-bold font-mono text-destructive">{user.loss_count}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <p className="text-sm font-mono">{user.phone}</p>
                </div>
              </div>

              {selectedUser === user.user_id ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="+/- Amount"
                    value={balanceAdjustment}
                    onChange={(e) => setBalanceAdjustment(e.target.value)}
                    className="bg-input/50 border-white/10 rounded-lg"
                    data-testid={`balance-input-${user.user_id}`}
                  />
                  <Button
                    onClick={() => handleAdjustBalance(user.user_id)}
                    className="btn-premium text-white rounded-full"
                    data-testid={`save-balance-${user.user_id}`}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedUser(user.user_id)}
                    variant="outline"
                    className="rounded-full"
                    data-testid={`adjust-balance-${user.user_id}`}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Adjust Balance
                  </Button>
                  {!user.suspended && (
                    <Button
                      onClick={() => handleSuspendUser(user.user_id)}
                      variant="outline"
                      className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-white"
                      data-testid={`suspend-${user.user_id}`}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}