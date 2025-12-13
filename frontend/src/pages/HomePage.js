import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { DollarSign, Trophy, Users, Wallet, TrendingUp, TrendingDown, Lock, ShieldCheck, ArrowUpRight, ArrowDownLeft, Zap } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HomePage({ user, onLogout }) {
  const navigate = useNavigate();
  const [bets, setBets] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [betsRes, transactionsRes] = await Promise.all([
        axios.get(`${API}/bets`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API}/wallet/transactions`, { headers: { Authorization: `Bearer ${token}` }}).catch(() => ({ data: [] }))
      ]);
      
      setBets(betsRes.data.slice(0, 5));
      
      // Build activity feed from bets and transactions
      const activities = [];
      
      // Add bet activities
      betsRes.data.slice(0, 10).forEach(bet => {
        const isCreator = bet.creator_id === user.user_id;
        const opponent = isCreator ? bet.opponent : bet.creator;
        
        if (bet.status === 'completed') {
          const isWinner = bet.winner_id === user.user_id;
          activities.push({
            id: bet.bet_id,
            type: isWinner ? 'bet_won' : 'bet_lost',
            amount: bet.amount,
            name: opponent?.name || 'Unknown',
            timestamp: bet.completed_at || bet.created_at,
            avatar: opponent?.avatar
          });
        } else if (bet.status === 'active' || bet.status === 'scheduled') {
          activities.push({
            id: bet.bet_id,
            type: 'bet_active',
            amount: bet.amount,
            name: opponent?.name || 'Unknown',
            timestamp: bet.created_at,
            avatar: opponent?.avatar
          });
        }
      });
      
      // Add transaction activities
      transactionsRes.data.slice(0, 5).forEach(tx => {
        if (tx.payment_status === 'paid') {
          activities.push({
            id: tx.session_id,
            type: 'deposit',
            amount: tx.amount,
            name: 'Wallet Deposit',
            timestamp: tx.created_at
          });
        }
      });
      
      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRecentActivity(activities.slice(0, 6));
      
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load data');
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };
  
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getBetStatus = (bet) => {
    if (bet.status === 'pending') return { text: 'Pending', color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' };
    if (bet.status === 'active') return { text: 'Live', color: 'bg-green-500/20 text-green-400 border border-green-500/30' };
    if (bet.status === 'scheduled') return { text: 'Scheduled', color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' };
    if (bet.status === 'awaiting_confirmation') return { text: 'Confirming', color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' };
    if (bet.status === 'completed') return { text: 'Settled', color: 'bg-green-600/20 text-green-500 border border-green-600/30' };
    if (bet.status === 'completed_punk_out') return { text: 'Punk Out', color: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' };
    if (bet.status === 'disputed') return { text: 'Disputed', color: 'bg-red-500/20 text-red-400 border border-red-500/30' };
    return { text: bet.status?.replace(/_/g, ' '), color: 'bg-muted text-muted-foreground' };
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-4xl mx-auto p-4">
        {/* Balance Card - Business Focused */}
        <Card className="bg-gradient-to-br from-primary/20 via-background to-accent/10 border-primary/20 p-6 rounded-2xl mb-5" data-testid="balance-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs tracking-widest text-muted-foreground/80 uppercase">Available Balance</p>
                <div className="flex items-center gap-1 bg-green-500/20 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3 text-green-500" />
                  <span className="text-[10px] text-green-500 font-semibold">Secured</span>
                </div>
              </div>
              <h2 className="text-4xl font-black font-mono tracking-tight text-foreground" data-testid="balance-amount">
                ${user.balance?.toFixed(2) || '0.00'}
              </h2>
            </div>
            <div 
              className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-all"
              onClick={() => navigate('/wallet')}
              data-testid="deposit-withdrawal-button"
            >
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500" data-testid="win-count">{user.win_count || 0}</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500" data-testid="loss-count">{user.loss_count || 0}</p>
              <p className="text-xs text-muted-foreground">Losses</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-mono text-accent truncate" data-testid="betz-id">{user.betz_id}</p>
              <p className="text-xs text-muted-foreground">Betz ID</p>
            </div>
          </div>
        </Card>

        {/* Action Buttons - Clean & Professional */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Button
            data-testid="place-bet-button"
            onClick={() => navigate('/place-bet')}
            className="btn-premium text-white rounded-xl h-14 text-sm font-bold"
          >
            <DollarSign className="mr-2 h-5 w-5" />
            New Bet
          </Button>
          <Button
            data-testid="find-users-button"
            onClick={() => navigate('/friends')}
            variant="outline"
            className="border-white/20 text-foreground hover:bg-white/5 rounded-xl h-14 text-sm font-bold"
          >
            <Users className="mr-2 h-5 w-5" />
            Contacts
          </Button>
        </div>

        {/* Active Bets */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold" data-testid="recent-bets-title">Active Bets</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/bets')} className="text-primary text-xs">View All</Button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
          ) : bets.length === 0 ? (
            <Card className="premium-card p-8 rounded-2xl text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-primary/60" />
              </div>
              <p className="text-muted-foreground font-medium">No active bets</p>
              <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Start a bet with someone you trust</p>
              <Button 
                onClick={() => navigate('/place-bet')}
                size="sm"
                className="btn-premium text-white rounded-full"
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Create Your First Bet
              </Button>
            </Card>
          ) : (
            <div className="space-y-3" data-testid="bets-list">
              {bets.map((bet) => {
                const status = getBetStatus(bet);
                const isCreator = bet.creator_id === user.user_id;
                const opponent = isCreator ? bet.opponent : bet.creator;
                const isFundsLocked = ['active', 'scheduled', 'awaiting_confirmation', 'disputed'].includes(bet.status);
                
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
                              {opponent?.name || 'Processing...'}
                            </p>
                            <p className="text-sm text-muted-foreground">{isCreator ? 'Challenger' : 'Challenged you'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold font-mono text-primary">${bet.amount.toFixed(2)}</p>
                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            {isFundsLocked && (
                              <div className="flex items-center gap-1 bg-blue-500/20 px-1.5 py-0.5 rounded">
                                <Lock className="h-2.5 w-2.5 text-blue-400" />
                                <span className="text-[9px] text-blue-400 font-medium">Locked</span>
                              </div>
                            )}
                            <Badge className={`${status.color} text-xs`}>{status.text}</Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Feed - CashApp Style */}
        {recentActivity.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Recent Activity</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')} className="text-primary text-xs">View All</Button>
            </div>
            
            <Card className="premium-card rounded-2xl overflow-hidden divide-y divide-white/5" data-testid="activity-feed">
              {recentActivity.map((activity) => {
                const isPositive = activity.type === 'bet_won' || activity.type === 'deposit';
                const isNegative = activity.type === 'bet_lost';
                
                return (
                  <div 
                    key={activity.id} 
                    className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => activity.type !== 'deposit' && navigate(`/bets/${activity.id}`)}
                    data-testid={`activity-${activity.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Activity Icon */}
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isPositive ? 'bg-green-500/20' : 
                        isNegative ? 'bg-red-500/20' : 
                        'bg-primary/20'
                      }`}>
                        {activity.type === 'bet_won' && <TrendingUp className="h-5 w-5 text-green-500" />}
                        {activity.type === 'bet_lost' && <TrendingDown className="h-5 w-5 text-red-500" />}
                        {activity.type === 'bet_active' && <Zap className="h-5 w-5 text-primary" />}
                        {activity.type === 'deposit' && <ArrowDownLeft className="h-5 w-5 text-green-500" />}
                      </div>
                      
                      {/* Activity Details */}
                      <div>
                        <p className="font-semibold text-sm">
                          {activity.type === 'bet_won' && `Won vs ${activity.name}`}
                          {activity.type === 'bet_lost' && `Lost vs ${activity.name}`}
                          {activity.type === 'bet_active' && `Bet with ${activity.name}`}
                          {activity.type === 'deposit' && 'Added to Wallet'}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                    
                    {/* Amount */}
                    <div className="text-right">
                      <p className={`font-bold font-mono ${
                        isPositive ? 'text-green-500' : 
                        isNegative ? 'text-red-500' : 
                        'text-foreground'
                      }`}>
                        {isPositive && '+'}
                        {isNegative && '-'}
                        ${activity.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.type === 'bet_active' && 'Active'}
                        {activity.type === 'deposit' && 'Completed'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}