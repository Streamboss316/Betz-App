import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Trophy, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function BetDetailsPage({ user }) {
  const { betId } = useParams();
  const navigate = useNavigate();
  const [bet, setBet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stipulation, setStipulation] = useState('');
  const [punkOutAmount, setPunkOutAmount] = useState('');
  const [dpSearchQuery, setDpSearchQuery] = useState('');
  const [dpSearchResults, setDpSearchResults] = useState([]);

  useEffect(() => {
    loadBet();
  }, [betId]);

  useEffect(() => {
    if (dpSearchQuery.length >= 2) {
      searchUsers();
    } else {
      setDpSearchResults([]);
    }
  }, [dpSearchQuery]);

  const loadBet = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/bets/${betId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBet(res.data);
      setStipulation(res.data.stipulation || '');
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load bet');
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/users/search`, {
        params: { query: dpSearchQuery },
        headers: { Authorization: `Bearer ${token}` }
      });
      setDpSearchResults(res.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleAccept = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/bets/${betId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Bet accepted!');
      loadBet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept bet');
    }
  };

  const handleReject = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/bets/${betId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Bet rejected');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reject bet');
    }
  };

  const handleUpdateStipulation = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/bets/${betId}/stipulation`, null, {
        params: { stipulation },
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Stipulation updated');
      loadBet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update');
    }
  };

  const handleSetPunkOut = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/bets/${betId}/punk-out`, null, {
        params: { punk_out_amount: parseFloat(punkOutAmount) },
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Punk out amount set');
      loadBet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to set punk out');
    }
  };

  const handleSetDP = async (dpId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/bets/${betId}/dp`, null, {
        params: { dp_id: dpId },
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('DP assigned');
      loadBet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign DP');
    }
  };

  const handleLockBet = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/bets/${betId}/lock`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Bet locked!');
      loadBet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to lock bet');
    }
  };

  const handleDeclareWinner = async (winnerId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put(`${API}/bets/${betId}/winner`, null, {
        params: { winner_id: winnerId },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === 'disputed') {
        toast.info('DP will mediate the dispute');
      } else {
        toast.success('Winner declared!');
      }
      loadBet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to declare winner');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl font-heading">Loading...</div>
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-destructive text-2xl font-heading">Bet not found</div>
      </div>
    );
  }

  const isCreator = bet.creator_id === user.user_id;
  const isOpponent = bet.opponent_id === user.user_id;
  const isDP = bet.dp_id === user.user_id;
  const status = getBetStatus(bet.status);

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full" data-testid="back-button">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold font-heading ml-4" data-testid="bet-details-title">Bet Details</h1>
      </header>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Bet Amount & Status */}
        <Card className="bg-card border-white/10 p-6 rounded-2xl" data-testid="bet-summary-card">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground mb-2">Bet Amount</p>
            <h2 className="text-5xl font-black font-mono text-primary" data-testid="bet-amount">${bet.amount.toFixed(2)}</h2>
            <Badge className={`${status.color} mt-3`} data-testid="bet-status">{status.text}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-4 bg-muted/30 rounded-xl">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarImage src={bet.creator?.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(bet.creator?.name)}</AvatarFallback>
              </Avatar>
              <p className="font-bold" data-testid="creator-name">{bet.creator?.name}</p>
              <p className="text-xs text-muted-foreground">Creator</p>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-xl">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarImage src={bet.opponent?.avatar} />
                <AvatarFallback className="bg-secondary text-secondary-foreground">{getInitials(bet.opponent?.name)}</AvatarFallback>
              </Avatar>
              <p className="font-bold" data-testid="opponent-name">{bet.opponent?.name}</p>
              <p className="text-xs text-muted-foreground">Opponent</p>
            </div>
          </div>
        </Card>

        {/* Pending Bet Actions */}
        {bet.status === 'pending' && isOpponent && (
          <Card className="bg-card border-white/10 p-6 rounded-2xl">
            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
            <p className="text-center text-muted-foreground mb-4">You have a pending bet request</p>
            <div className="flex gap-4">
              <Button
                data-testid="reject-bet-button"
                onClick={handleReject}
                variant="outline"
                className="flex-1 rounded-full"
              >
                Reject
              </Button>
              <Button
                data-testid="accept-bet-button"
                onClick={handleAccept}
                className="flex-1 bg-primary text-primary-foreground rounded-full btn-glow"
              >
                Accept
              </Button>
            </div>
          </Card>
        )}

        {/* Stipulation */}
        {bet.status === 'accepted' && (
          <Card className="bg-card border-white/10 p-6 rounded-2xl" data-testid="stipulation-card">
            <h3 className="text-lg font-bold mb-3 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary" />
              Race Stipulation
            </h3>
            {isCreator ? (
              <div>
                <Textarea
                  data-testid="stipulation-textarea"
                  value={stipulation}
                  onChange={(e) => setStipulation(e.target.value)}
                  placeholder="8th mile race, green light win, cross double lines lose, red light lose"
                  className="bg-input/50 border-white/10 rounded-lg mb-3 min-h-[100px]"
                />
                <Button
                  data-testid="update-stipulation-button"
                  onClick={handleUpdateStipulation}
                  className="w-full bg-primary text-primary-foreground rounded-full"
                >
                  Update Stipulation
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground bg-muted/30 p-4 rounded-lg" data-testid="stipulation-text">
                {bet.stipulation || 'No stipulation set yet'}
              </p>
            )}
          </Card>
        )}

        {/* Punk Out */}
        {bet.status === 'accepted' && isCreator && (
          <Card className="bg-card border-white/10 p-6 rounded-2xl" data-testid="punk-out-card">
            <h3 className="text-lg font-bold mb-3">Punk Out Amount</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Set escrow amount (e.g., 10% = ${(bet.amount * 0.1).toFixed(2)})
            </p>
            {bet.punk_out_amount > 0 ? (
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-2xl font-bold font-mono text-primary" data-testid="punk-out-amount">
                  ${bet.punk_out_amount.toFixed(2)}
                </p>
              </div>
            ) : (
              <div className="flex gap-3">
                <Input
                  data-testid="punk-out-input"
                  type="number"
                  value={punkOutAmount}
                  onChange={(e) => setPunkOutAmount(e.target.value)}
                  placeholder="100.00"
                  className="bg-input/50 border-white/10 rounded-lg"
                />
                <Button
                  data-testid="set-punk-out-button"
                  onClick={handleSetPunkOut}
                  className="bg-primary text-primary-foreground rounded-full px-6"
                >
                  Set
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* DP Selection */}
        {bet.status === 'accepted' && !bet.dp_id && (isCreator || isOpponent) && (
          <Card className="bg-card border-white/10 p-6 rounded-2xl" data-testid="dp-selection-card">
            <h3 className="text-lg font-bold mb-3">Select Designated Person (DP)</h3>
            <Input
              data-testid="dp-search-input"
              value={dpSearchQuery}
              onChange={(e) => setDpSearchQuery(e.target.value)}
              placeholder="Search by name or Betz ID"
              className="bg-input/50 border-white/10 rounded-lg mb-3"
            />
            <div className="space-y-2" data-testid="dp-search-results">
              {dpSearchResults.map((result) => (
                <div
                  key={result.user_id}
                  onClick={() => handleSetDP(result.user_id)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-muted/50 transition-all"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={result.avatar} />
                    <AvatarFallback className="bg-muted">{getInitials(result.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{result.name}</p>
                    <p className="text-sm text-muted-foreground">{result.betz_id}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* DP Info */}
        {bet.dp && (
          <Card className="bg-card border-white/10 p-6 rounded-2xl" data-testid="dp-info-card">
            <h3 className="text-lg font-bold mb-3">Designated Person</h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={bet.dp?.avatar} />
                <AvatarFallback className="bg-accent text-accent-foreground">{getInitials(bet.dp?.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold" data-testid="dp-name">{bet.dp?.name}</p>
                <p className="text-sm text-muted-foreground">{bet.dp?.betz_id}</p>
              </div>
            </div>
            {isDP && bet.status === 'accepted' && (
              <Button
                data-testid="lock-bet-button"
                onClick={handleLockBet}
                className="w-full mt-4 bg-primary text-primary-foreground rounded-full btn-glow"
              >
                Lock Bet
              </Button>
            )}
          </Card>
        )}

        {/* Winner Declaration */}
        {bet.status === 'active' && !bet.winner_id && (isCreator || isOpponent || isDP) && (
          <Card className="bg-card border-white/10 p-6 rounded-2xl" data-testid="winner-declaration-card">
            <h3 className="text-lg font-bold mb-3 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-accent" />
              Declare Winner
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Button
                data-testid="declare-creator-winner-button"
                onClick={() => handleDeclareWinner(bet.creator_id)}
                className="bg-primary text-primary-foreground rounded-full"
              >
                {bet.creator?.name}
              </Button>
              <Button
                data-testid="declare-opponent-winner-button"
                onClick={() => handleDeclareWinner(bet.opponent_id)}
                className="bg-secondary text-secondary-foreground rounded-full"
              >
                {bet.opponent?.name}
              </Button>
            </div>
          </Card>
        )}

        {/* Winner Display */}
        {bet.status === 'completed' && bet.winner_id && (
          <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-white/10 p-6 rounded-2xl text-center" data-testid="winner-card">
            <Trophy className="h-16 w-16 text-accent mx-auto mb-3" />
            <h3 className="text-2xl font-black font-heading mb-2">WINNER</h3>
            <p className="text-3xl font-bold" data-testid="winner-name">
              {bet.winner_id === bet.creator_id ? bet.creator?.name : bet.opponent?.name}
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Pool:</span>
                <span className="font-mono">${(bet.amount * 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Platform Fee (3%):</span>
                <span className="font-mono text-destructive">-${bet.platform_fee ? bet.platform_fee.toFixed(2) : ((bet.amount * 2) * 0.03).toFixed(2)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Winner Payout:</span>
                  <span className="text-2xl font-mono text-primary font-bold">
                    ${bet.winner_payout ? bet.winner_payout.toFixed(2) : ((bet.amount * 2) * 0.97).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}