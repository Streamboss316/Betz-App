import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDPPage() {
  const navigate = useNavigate();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBets();
  }, []);

  const loadBets = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await axios.get(`${API}/admin/bets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter bets that have a DP assigned
      const dpBets = res.data.filter(bet => bet.dp_id);
      setBets(dpBets);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load DP bets');
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const getBetStatus = (status) => {
    if (status === 'accepted') return { text: 'Awaiting DP Lock', color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' };
    if (status === 'active') return { text: 'Active', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' };
    if (status === 'disputed') return { text: 'DISPUTED', color: 'bg-destructive/20 text-destructive' };
    if (status === 'completed') return { text: 'Resolved', color: 'bg-green-600/20 text-green-500 border border-green-600/30' };
    return { text: status, color: 'bg-muted text-muted-foreground' };
  };

  const filterBets = (filter) => {
    if (filter === 'all') return bets;
    if (filter === 'active') return bets.filter(b => b.status === 'active' || b.status === 'accepted');
    if (filter === 'disputed') return bets.filter(b => b.status === 'disputed');
    if (filter === 'completed') return bets.filter(b => b.status === 'completed');
    return bets;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p className="text-sm text-muted-foreground">Loading DP bets...</p>
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
          <h1 className="text-lg font-bold" data-testid="dp-page-title">DP Requests & Decisions</h1>
          <p className="text-xs text-muted-foreground -mt-0.5">Monitor designated person activity</p>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <Card className="bg-gradient-to-br from-accent/20 to-primary/20 border-white/10 p-6 rounded-2xl mb-6">
          <div className="flex items-center gap-5">
            <Shield className="h-12 w-12 text-accent" />
            <div>
              <h2 className="text-2xl font-bold">Designated Person Monitor</h2>
              <p className="text-sm text-muted-foreground">View all bets with assigned DPs and their decisions</p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/30 rounded-full p-1">
            <TabsTrigger value="all" className="rounded-full">All DP Bets ({bets.length})</TabsTrigger>
            <TabsTrigger value="active" className="rounded-full">Active</TabsTrigger>
            <TabsTrigger value="disputed" className="rounded-full">Disputed</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-full">Completed</TabsTrigger>
          </TabsList>

          {['all', 'active', 'disputed', 'completed'].map(tab => (
            <TabsContent key={tab} value={tab}>
              <div className="grid gap-5">
                {filterBets(tab).map((bet) => {
                  const status = getBetStatus(bet.status);
                  return (
                    <Card key={bet.bet_id} className="premium-card p-6 rounded-2xl" data-testid={`dp-bet-${bet.bet_id}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold font-mono text-primary">${bet.amount.toFixed(2)}</h3>
                            <Badge className={status.color}>{status.text}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Bet ID: {bet.bet_id.substring(0, 12)}...</p>
                        </div>
                      </div>

                      {/* Participants */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3 bg-muted/20 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Creator</p>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={bet.creator?.avatar} />
                              <AvatarFallback className="btn-premium text-white text-xs">
                                {getInitials(bet.creator?.name)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-semibold">{bet.creator?.name}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-muted/20 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Opponent</p>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={bet.opponent?.avatar} />
                              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                                {getInitials(bet.opponent?.name)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-semibold">{bet.opponent?.name}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-accent/20 rounded-lg border border-accent/30">
                          <p className="text-xs text-accent font-semibold mb-2">DESIGNATED PERSON</p>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={bet.dp?.avatar} />
                              <AvatarFallback className="btn-gold text-xs">
                                {getInitials(bet.dp?.name)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-semibold">{bet.dp?.name}</p>
                          </div>
                        </div>
                      </div>

                      {/* Stipulation Display */}
                      {bet.stipulation && (
                        <div className="mb-4 p-4 bg-primary/10 rounded-lg border border-border">
                          <p className="text-xs text-primary font-semibold mb-2">DP Received This Stipulation:</p>
                          <p className="text-sm font-mono">{bet.stipulation}</p>
                        </div>
                      )}

                      {/* DP Decision/Status */}
                      {bet.status === 'accepted' && (
                        <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                          <AlertCircle className="h-5 w-5 text-yellow-500 mb-2" />
                          <p className="text-sm text-yellow-500 font-semibold">Awaiting DP to lock bet</p>
                        </div>
                      )}

                      {bet.status === 'active' && (
                        <div className="p-4 bg-primary/10 rounded-lg border border-border">
                          <p className="text-sm text-primary font-semibold">DP locked bet - Race in progress</p>
                        </div>
                      )}

                      {bet.status === 'disputed' && (
                        <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                          <AlertCircle className="h-5 w-5 text-destructive mb-2" />
                          <p className="text-sm text-destructive font-semibold">DISPUTE - DP must decide winner</p>
                        </div>
                      )}

                      {bet.status === 'completed' && bet.winner_id && (
                        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <p className="text-sm font-semibold">
                            <span className="text-primary">DP Decision:</span> {bet.winner_id === bet.creator_id ? bet.creator?.name : bet.opponent?.name} declared winner
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Payout: ${bet.winner_payout?.toFixed(2) || (bet.amount * 2 * 0.97).toFixed(2)} (after 3% platform fee)
                          </p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}