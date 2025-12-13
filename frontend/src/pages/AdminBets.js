import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, X, Trophy } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminBets() {
  const navigate = useNavigate();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadBets();
  }, []);

  const loadBets = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await axios.get(`${API}/admin/bets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBets(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load bets');
      setLoading(false);
    }
  };

  const handleCancelBet = async (betId) => {
    const token = localStorage.getItem('admin_token');
    try {
      await axios.delete(`${API}/admin/bets/${betId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Bet cancelled');
      loadBets();
    } catch (error) {
      toast.error('Failed to cancel bet');
    }
  };

  const handleForceComplete = async (betId, winnerId) => {
    const token = localStorage.getItem('admin_token');
    try {
      await axios.put(`${API}/admin/bets/${betId}`,
        { status: 'completed', winner_id: winnerId },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Bet marked as completed');
      loadBets();
    } catch (error) {
      toast.error('Failed to update bet');
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const getBetStatus = (status) => {
    if (status === 'pending') return { text: 'Pending', color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' };
    if (status === 'active') return { text: 'Active', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' };
    if (status === 'scheduled') return { text: 'Scheduled', color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' };
    if (status === 'accepted') return { text: 'Accepted', color: 'bg-green-500/20 text-green-400 border border-green-500/30' };
    if (status === 'awaiting_confirmation') return { text: 'Awaiting Confirm', color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' };
    if (status === 'completed') return { text: 'Settled', color: 'bg-green-600/20 text-green-500 border border-green-600/30' };
    if (status === 'completed_punk_out') return { text: 'Punk Out', color: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' };
    if (status === 'disputed') return { text: 'Disputed', color: 'bg-red-500/20 text-red-400 border border-red-500/30' };
    if (status === 'cancelled') return { text: 'Cancelled', color: 'bg-red-600/20 text-red-500 border border-red-600/30' };
    return { text: status?.replace(/_/g, ' '), color: 'bg-muted text-muted-foreground' };
  };

  const filterBets = (status) => {
    if (status === 'all') return bets;
    return bets.filter(bet => bet.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p className="text-sm text-muted-foreground">Loading bets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-primary/20 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')} className="rounded-full hover:bg-white/10" data-testid="back-button">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="ml-4">
          <h1 className="text-lg font-bold" data-testid="bets-title">Manage Bets</h1>
          <p className="text-xs text-muted-foreground -mt-0.5">Monitor and control all bets</p>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-6 bg-muted/30 rounded-full p-1">
            <TabsTrigger value="all" className="rounded-full text-xs">All ({bets.length})</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-full text-xs">Pending</TabsTrigger>
            <TabsTrigger value="scheduled" className="rounded-full text-xs">Scheduled</TabsTrigger>
            <TabsTrigger value="active" className="rounded-full text-xs">Active</TabsTrigger>
            <TabsTrigger value="disputed" className="rounded-full text-xs">Disputed</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-full text-xs">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="grid gap-5">
              {filterBets(activeTab).map((bet) => {
                const status = getBetStatus(bet.status);
                return (
                  <Card key={bet.bet_id} className="premium-card p-6 rounded-2xl" data-testid={`bet-${bet.bet_id}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold font-mono text-primary">${bet.amount.toFixed(2)}</h3>
                          <Badge className={status.color}>{status.text}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Bet ID: {bet.bet_id.substring(0, 8)}...</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5 mb-4">
                      <div className="p-4 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={bet.creator?.avatar} />
                            <AvatarFallback className="btn-premium text-white">
                              {getInitials(bet.creator?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold">{bet.creator?.name}</p>
                            <p className="text-xs text-muted-foreground">Creator</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={bet.opponent?.avatar} />
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                              {getInitials(bet.opponent?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold">{bet.opponent?.name}</p>
                            <p className="text-xs text-muted-foreground">Opponent</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {bet.stipulation && (
                      <div className="mb-4 p-3 bg-muted/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Stipulation:</p>
                        <p className="text-sm">{bet.stipulation}</p>
                      </div>
                    )}

                    {/* Scheduled Date Display */}
                    {bet.scheduled_date && (
                      <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Scheduled Race Date:</p>
                        <p className="text-sm font-semibold text-purple-400">
                          {new Date(bet.scheduled_date).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Punk Out Status Display */}
                    {bet.punk_out_claim_status && (
                      <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Punk Out Status:</p>
                        <p className="text-sm font-semibold text-orange-400 capitalize">
                          {bet.punk_out_claim_status}
                          {bet.punk_out_amount && ` - $${bet.punk_out_amount.toFixed(2)}`}
                        </p>
                      </div>
                    )}

                    {bet.dp && (
                      <div className="mb-4 p-3 bg-accent/10 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">DP:</p>
                        <p className="text-sm font-semibold">{bet.dp.name}</p>
                      </div>
                    )}

                    {bet.status !== 'completed' && bet.status !== 'completed_punk_out' && (
                      <div className="flex gap-2 flex-wrap">
                        {(bet.status === 'active' || bet.status === 'disputed' || bet.status === 'scheduled') && (
                          <>
                            <Button
                              onClick={() => handleForceComplete(bet.bet_id, bet.creator_id)}
                              size="sm"
                              className="btn-premium text-white rounded-full"
                              data-testid={`complete-creator-${bet.bet_id}`}
                            >
                              <Trophy className="h-4 w-4 mr-2" />
                              Award to {bet.creator?.name}
                            </Button>
                            <Button
                              onClick={() => handleForceComplete(bet.bet_id, bet.opponent_id)}
                              size="sm"
                              className="bg-secondary text-secondary-foreground rounded-full"
                              data-testid={`complete-opponent-${bet.bet_id}`}
                            >
                              <Trophy className="h-4 w-4 mr-2" />
                              Award to {bet.opponent?.name}
                            </Button>
                          </>
                        )}
                        <Button
                          onClick={() => handleCancelBet(bet.bet_id)}
                          size="sm"
                          variant="outline"
                          className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-white"
                          data-testid={`cancel-${bet.bet_id}`}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel Bet
                        </Button>
                      </div>
                    )}

                    {bet.status === 'completed' && bet.winner_id && (
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm font-semibold text-primary">
                          Winner: {bet.winner_id === bet.creator_id ? bet.creator?.name : bet.opponent?.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Payout: ${bet.winner_payout?.toFixed(2) || (bet.amount * 2 * 0.97).toFixed(2)} (after 3% fee)
                        </p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}