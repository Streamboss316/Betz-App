import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Shield, Lock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DPDashboard({ user }) {
  const navigate = useNavigate();
  const [dpBets, setDpBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDPBets();
  }, []);

  const loadDPBets = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/bets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter bets where current user is DP
      const myDPBets = res.data.filter(bet => bet.dp_id === user.user_id);
      setDpBets(myDPBets);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load DP bets');
      setLoading(false);
    }
  };

  const handleLockBet = async (betId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/bets/${betId}/lock`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Bet locked and ready to race!');
      loadDPBets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to lock bet');
    }
  };

  const handleDeclareWinner = async (betId, winnerId, winnerName) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/bets/${betId}/winner`, null, {
        params: { winner_id: winnerId },
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${winnerName} declared winner!`);
      loadDPBets();
    } catch (error) {
      toast.error('Failed to declare winner');
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const getBetStatus = (status) => {
    if (status === 'pending') return { text: 'Pending', color: 'bg-yellow-500/20 text-yellow-500', icon: Shield };
    if (status === 'accepted') return { text: 'Ready to Lock', color: 'bg-accent/20 text-accent', icon: Lock };
    if (status === 'active') return { text: 'Active - Awaiting Result', color: 'bg-primary/20 text-primary', icon: Shield };
    if (status === 'disputed') return { text: 'DISPUTED - Your Decision Needed', color: 'bg-destructive/20 text-destructive', icon: Shield };
    if (status === 'completed') return { text: 'Completed', color: 'bg-blue-500/20 text-blue-500', icon: CheckCircle };
    return { text: status, color: 'bg-muted text-muted-foreground', icon: Shield };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl font-heading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-border/50 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full" data-testid="back-button">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4" data-testid="dp-dashboard-title">DP Dashboard</h1>
      </header>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Card className="bg-gradient-to-br from-accent/20 to-primary/20 border-white/10 p-6 rounded-2xl text-center">
          <Shield className="h-12 w-12 text-accent mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-2">Designated Person</h2>
          <p className="text-muted-foreground">You are trusted to mediate {dpBets.length} bet{dpBets.length !== 1 ? 's' : ''}</p>
        </Card>

        {dpBets.length === 0 ? (
          <Card className="premium-card p-8 rounded-2xl text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No DP assignments yet</p>
          </Card>
        ) : (
          <div className="space-y-4" data-testid="dp-bets-list">
            {dpBets.map((bet) => {
              const status = getBetStatus(bet.status);
              const StatusIcon = status.icon;
              
              return (
                <Card key={bet.bet_id} className="premium-card p-6 rounded-2xl" data-testid={`dp-bet-${bet.bet_id}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <StatusIcon className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="text-2xl font-bold font-mono text-primary">${bet.amount.toFixed(2)}</h3>
                        <p className="text-xs text-muted-foreground">Total Pool: ${(bet.amount * 2).toFixed(2)}</p>
                      </div>
                    </div>
                    <Badge className={status.color}>{status.text}</Badge>
                  </div>

                  {/* Participants */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
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
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
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

                  {/* Stipulation */}
                  {bet.stipulation && (
                    <div className="mb-4 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                      <p className="text-xs text-accent font-semibold mb-2">RACE STIPULATION:</p>
                      <p className="text-sm">{bet.stipulation}</p>
                    </div>
                  )}

                  {/* Punk Out */}
                  {bet.punk_out_amount > 0 && (
                    <div className="mb-4 p-3 bg-muted/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">Punk Out Amount:</p>
                      <p className="font-mono font-bold text-primary">${bet.punk_out_amount.toFixed(2)}</p>
                    </div>
                  )}

                  {/* DP Actions */}
                  {bet.status === 'accepted' && (
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-sm text-muted-foreground mb-3">Review the stipulation and participants. Lock the bet when ready.</p>
                      <Button
                        data-testid={`lock-bet-${bet.bet_id}`}
                        onClick={() => handleLockBet(bet.bet_id)}
                        className="w-full btn-premium text-white rounded-2xl h-12 font-semibold btn-premium"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Lock Bet - Ready to Race
                      </Button>
                    </div>
                  )}

                  {(bet.status === 'active' || bet.status === 'disputed') && (
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-sm text-destructive font-semibold mb-3">
                        {bet.status === 'disputed' ? '⚠️ DISPUTE - Your decision is final' : 'Race complete? Declare the winner:'}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          data-testid={`declare-creator-winner-${bet.bet_id}`}
                          onClick={() => handleDeclareWinner(bet.bet_id, bet.creator_id, bet.creator?.name)}
                          className="btn-premium text-white rounded-2xl h-12"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {bet.creator?.name} Wins
                        </Button>
                        <Button
                          data-testid={`declare-opponent-winner-${bet.bet_id}`}
                          onClick={() => handleDeclareWinner(bet.bet_id, bet.opponent_id, bet.opponent?.name)}
                          className="bg-secondary text-secondary-foreground rounded-2xl h-12"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {bet.opponent?.name} Wins
                        </Button>
                      </div>
                    </div>
                  )}

                  {bet.status === 'completed' && bet.winner_id && (
                    <div className="border-t border-white/10 pt-4 text-center">
                      <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="font-semibold text-primary">
                        Winner: {bet.winner_id === bet.creator_id ? bet.creator?.name : bet.opponent?.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Your mediation complete</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}