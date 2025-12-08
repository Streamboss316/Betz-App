import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { DollarSign, Trophy, Home, Users, Wallet, Bell, MessageSquare, LogOut, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HomePage({ user, onLogout }) {
  const navigate = useNavigate();
  const [bets, setBets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [betsRes, notifsRes, userRes] = await Promise.all([
        axios.get(`${API}/bets`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` }})
      ]);
      
      setBets(betsRes.data.slice(0, 5));
      setNotifications(notifsRes.data.filter(n => !n.read).slice(0, 3));
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load data');
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getBetStatus = (bet) => {
    if (bet.status === 'pending') return { text: 'Pending', color: 'bg-yellow-500/20 text-yellow-500' };
    if (bet.status === 'active') return { text: 'Active', color: 'bg-primary/20 text-primary' };
    if (bet.status === 'completed') return { text: 'Completed', color: 'bg-blue-500/20 text-blue-500' };
    if (bet.status === 'disputed') return { text: 'Disputed', color: 'bg-destructive/20 text-destructive' };
    return { text: bet.status, color: 'bg-muted text-muted-foreground' };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-between px-6">
        <h1 className="text-2xl font-black font-heading tracking-tighter uppercase text-primary" data-testid="home-title">BETZ</h1>
        <div className="flex items-center gap-4">
          <Link to="/notifications">
            <Button variant="ghost" size="icon" className="rounded-full relative" data-testid="notifications-icon">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 bg-destructive h-2 w-2 rounded-full"></span>
              )}
            </Button>
          </Link>
          <Link to="/profile">
            <Avatar className="h-10 w-10 cursor-pointer border-2 border-primary/50" data-testid="profile-avatar">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 pb-24 max-w-7xl mx-auto">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-white/10 shadow-2xl p-8 rounded-2xl mb-6" data-testid="balance-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground/70 mb-1">Available Balance</p>
              <h2 className="text-5xl font-black font-mono tracking-tight text-foreground" data-testid="balance-amount">
                ${user.balance?.toFixed(2) || '0.00'}
              </h2>
            </div>
            <Wallet className="h-12 w-12 text-primary" />
          </div>
          
          <div className="flex gap-4 mt-6">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Wins</p>
              <p className="text-2xl font-bold text-primary font-mono" data-testid="win-count">{user.win_count || 0}</p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Losses</p>
              <p className="text-2xl font-bold text-destructive font-mono" data-testid="loss-count">{user.loss_count || 0}</p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Betz ID</p>
              <p className="text-sm font-mono text-accent font-bold" data-testid="betz-id">{user.betz_id}</p>
            </div>
          </div>
        </Card>

        {/* Place Bet Button */}
        <Button
          data-testid="place-bet-button"
          onClick={() => navigate('/place-bet')}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-16 text-xl font-bold uppercase tracking-wide btn-glow mb-6"
        >
          <DollarSign className="mr-2 h-6 w-6" />
          Place Bet
        </Button>

        {/* Recent Bets */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold font-heading" data-testid="recent-bets-title">Recent Bets</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/bets')} className="text-primary">View All</Button>
          </div>
          
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : bets.length === 0 ? (
            <Card className="bg-card border-white/10 p-8 rounded-2xl text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No bets yet. Start racing!</p>
            </Card>
          ) : (
            <div className="space-y-3" data-testid="bets-list">
              {bets.map((bet) => {
                const status = getBetStatus(bet);
                const isCreator = bet.creator_id === user.user_id;
                const opponent = isCreator ? bet.opponent : bet.creator;
                
                return (
                  <Link key={bet.bet_id} to={`/bets/${bet.bet_id}`}>
                    <Card className="bg-card border-white/10 hover:border-primary/50 p-4 rounded-xl bet-card cursor-pointer" data-testid={`bet-card-${bet.bet_id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={opponent?.avatar} />
                            <AvatarFallback className="bg-muted">{opponent?.name ? getInitials(opponent.name) : '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{opponent?.name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{isCreator ? 'Challenger' : 'Challenged you'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold font-mono text-primary">${bet.amount.toFixed(2)}</p>
                          <Badge className={`${status.color} text-xs`}>{status.text}</Badge>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10 h-20 flex items-center justify-around z-50">
        <Button variant="ghost" size="icon" className="rounded-full bg-primary/20" data-testid="nav-home">
          <Home className="h-6 w-6 text-primary" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/friends')} data-testid="nav-friends">
          <Users className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/wallet')} data-testid="nav-wallet">
          <Wallet className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/messages')} data-testid="nav-messages">
          <MessageSquare className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onLogout} data-testid="nav-logout">
          <LogOut className="h-6 w-6" />
        </Button>
      </nav>
    </div>
  );
}