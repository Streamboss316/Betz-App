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
    if (status === 'pending') return { text: 'Pending', color: 'bg-yellow-500/20 text-yellow-500' };
    if (status === 'active') return { text: 'Active', color: 'bg-primary/20 text-primary' };
    if (status === 'completed') return { text: 'Completed', color: 'bg-blue-500/20 text-blue-500' };
    if (status === 'disputed') return { text: 'Disputed', color: 'bg-destructive/20 text-destructive' };
    return { text: status, color: 'bg-muted text-muted-foreground' };
  };

  const filterBets = (status) => {
    if (status === 'all') return bets;
    return bets.filter(bet => bet.status === status);
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-primary text-2xl font-heading">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-border/50 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')} className="rounded-full" data-testid="back-button">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4" data-testid="bets-title">Manage Bets</h1>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-muted/30 rounded-full p-1">
            <TabsTrigger value="all" className="rounded-full">All ({bets.length})</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-full">Pending</TabsTrigger>
            <TabsTrigger value="active" className="rounded-full">Active</TabsTrigger>
            <TabsTrigger value="disputed" className="rounded-full">Disputed</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-full">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="grid gap-4">
              {filterBets(activeTab).map((bet) => {
                const status = getBetStatus(bet.status);
                return (
                  <Card key={bet.bet_id} className="bg-card border-white/10 p-6 rounded-2xl" data-testid={`bet-${bet.bet_id}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold font-mono text-primary">${bet.amount.toFixed(2)}</h3>
                          <Badge className={status.color}>{status.text}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Bet ID: {bet.bet_id.substring(0, 8)}...</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-4 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={bet.creator?.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
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

                    {bet.dp && (
                      <div className="mb-4 p-3 bg-accent/10 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">DP:</p>
                        <p className="text-sm font-semibold">{bet.dp.name}</p>
                      </div>
                    )}

                    {bet.status !== 'completed' && (
                      <div className="flex gap-2">
                        {(bet.status === 'active' || bet.status === 'disputed') && (
                          <>
                            <Button
                              onClick={() => handleForceComplete(bet.bet_id, bet.creator_id)}
                              size="sm"
                              className="bg-primary text-primary-foreground rounded-full"
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