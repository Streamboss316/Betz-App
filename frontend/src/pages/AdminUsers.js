import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Search, Ban, ShieldCheck, Mail, Phone, Trophy, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  const handleUnsuspendUser = async (userId) => {
    const token = localStorage.getItem('admin_token');
    try {
      await axios.put(`${API}/admin/users/${userId}`,
        { suspended: false },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('User unsuspended');
      loadUsers();
    } catch (error) {
      toast.error('Failed to unsuspend user');
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-primary/20 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')} className="rounded-full hover:bg-white/10" data-testid="back-button">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="ml-4">
          <h1 className="text-lg font-bold" data-testid="users-title">Manage Users</h1>
          <p className="text-xs text-muted-foreground -mt-0.5">View, edit, and manage user accounts</p>
        </div>
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
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{user.name}</h3>
                      {user.trust_score > 80 && (
                        <ShieldCheck className="h-4 w-4 text-green-500" title="Trusted User" />
                      )}
                    </div>
                    <p className="text-xs text-accent font-mono">{user.betz_id}</p>
                  </div>
                </div>
                {user.suspended ? (
                  <Badge className="bg-destructive/20 text-destructive border border-destructive/30">Suspended</Badge>
                ) : (
                  <Badge className="bg-green-500/20 text-green-500 border border-green-500/30">Active</Badge>
                )}
              </div>

              {/* User Stats - No Balance shown for privacy */}
              <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-muted/20 rounded-xl">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Trophy className="h-4 w-4 text-green-500" />
                    <p className="text-xs text-muted-foreground">Wins</p>
                  </div>
                  <p className="text-lg font-bold font-mono text-green-500">{user.win_count || 0}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <p className="text-xs text-muted-foreground">Losses</p>
                  </div>
                  <p className="text-lg font-bold font-mono text-red-500">{user.loss_count || 0}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <p className="text-xs text-muted-foreground">Trust</p>
                  </div>
                  <p className="text-lg font-bold font-mono text-primary">{user.trust_score || 0}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Reviews</p>
                  <p className="text-lg font-bold font-mono">{user.review_count || 0}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{user.phone}</span>
                </div>
              </div>

              {/* Actions - No balance adjustment */}
              <div className="flex gap-2">
                {user.suspended ? (
                  <Button
                    onClick={() => handleUnsuspendUser(user.user_id)}
                    variant="outline"
                    className="rounded-full border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                    data-testid={`unsuspend-${user.user_id}`}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Unsuspend User
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSuspendUser(user.user_id)}
                    variant="outline"
                    className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-white"
                    data-testid={`suspend-${user.user_id}`}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend User
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}