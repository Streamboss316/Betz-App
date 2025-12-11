import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { DollarSign, Trophy, Home, Users, Wallet, Bell, MessageSquare, LogOut, TrendingUp, Shield } from 'lucide-react';
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
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* Balance Card */}
        <Card className="premium-card p-8 rounded-2xl mb-6" data-testid="balance-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground mb-3">Available balance</p>
              <h2 className="text-5xl balance-display text-white" data-testid="balance-amount" style={{ fontWeight: 600, letterSpacing: '-0.025em' }}>
                ${user.balance?.toFixed(2) || '0.00'}
              </h2>
            </div>
            <div 
              className="h-14 w-14 rounded-full bg-primary/20 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/30 transition-all"
              onClick={() => navigate('/wallet')}
              data-testid="deposit-withdrawal-button"
            >
              <Wallet className="h-6 w-6 text-primary" />
              <span className="text-[8px] font-semibold text-primary mt-0.5">Deposit</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-5 pt-6 border-t border-border">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Wins</p>
              <p className="text-2xl font-mono text-primary" data-testid="win-count">{user.win_count || 0}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Losses</p>
              <p className="text-2xl font-mono text-destructive" data-testid="loss-count">{user.loss_count || 0}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Betz ID</p>
              <p className="text-sm font-mono text-accent" data-testid="betz-id">{user.betz_id}</p>
            </div>
          </div>
        </Card>

        {/* Place Bet Button */}
        <Button
          data-testid="place-bet-button"
          onClick={() => navigate('/place-bet')}
          className="w-full btn-premium text-white rounded-xl h-14 text-base font-semibold mb-6"
        >
          <DollarSign className="mr-2 h-5 w-5" />
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
            <Card className="premium-card p-8 rounded-2xl text-center">
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
                    <Card className="premium-card p-4 rounded-xl cursor-pointer transition-smooth" data-testid={`bet-card-${bet.bet_id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar 
                            className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (opponent?.user_id) navigate(`/user/${opponent.user_id}`);
                            }}
                            data-testid={`opponent-avatar-${opponent?.user_id}`}
                          >
                            <AvatarImage src={opponent?.avatar} />
                            <AvatarFallback className="bg-muted">{opponent?.name ? getInitials(opponent.name) : '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p 
                              className="font-semibold cursor-pointer hover:text-primary transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (opponent?.user_id) navigate(`/user/${opponent.user_id}`);
                              }}
                              data-testid={`opponent-name-${opponent?.user_id}`}
                            >
                              {opponent?.name || 'Loading...'}
                            </p>
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
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-16 rounded-xl bg-primary/20" data-testid="nav-home">
          <Home className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium text-primary">Home</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-16 rounded-xl" onClick={() => navigate('/friends')} data-testid="nav-friends">
          <Users className="h-5 w-5" />
          <span className="text-xs font-medium">Friends</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-16 rounded-xl" onClick={() => navigate('/messages')} data-testid="nav-messages">
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs font-medium">Messages</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-16 rounded-xl" onClick={() => navigate('/wallet')} data-testid="nav-wallet">
          <Wallet className="h-5 w-5" />
          <span className="text-xs font-medium">Wallet</span>
        </Button>
      </nav>
    </div>
  );
}