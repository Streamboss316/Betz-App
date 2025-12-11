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
import { ArrowLeft, Trophy, Shield, AlertCircle, Star, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
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
  const [showStipulationAgreement, setShowStipulationAgreement] = useState(false);
  const [agreedToStipulation, setAgreedToStipulation] = useState(false);

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

  const handleShowAgreement = () => {
    setShowStipulationAgreement(true);
    setAgreedToStipulation(false);
  };

  const handleAccept = async () => {
    if (!agreedToStipulation) {
      toast.error('You must agree to the stipulation and rules first');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/bets/${betId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Bet accepted!');
      setShowStipulationAgreement(false);
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

  const handleClaimPunkOut = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/bets/${betId}/claim-punk-out`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Punk out claim sent to opponent');
      loadBet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to claim punk out');
    }
  };

  const handleAcceptPunkOut = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/bets/${betId}/accept-punk-out`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Punk out accepted. Funds returned to both parties.');
      loadBet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept punk out');
    }
  };

  const handleRejectPunkOut = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/bets/${betId}/reject-punk-out`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Punk out rejected. DP will decide.');
      loadBet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reject punk out');
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
        <Card className="premium-card p-6 rounded-2xl" data-testid="bet-summary-card">
          <div className="text-center mb-4">
            <p className="text-5xl font-semibold tracking-tight text-foreground mb-3">Bet Amount</p>
            <h2 className="text-5xl font-mono text-primary" data-testid="bet-amount">${bet.amount.toFixed(2)}</h2>
            <Badge className={`${status.color} mt-3`} data-testid="bet-status">{status.text}</Badge>
          </div>

          {/* Punk Out Display */}
          {bet.punk_out_amount > 0 && (
            <div className="mt-4 p-4 bg-muted/20 border border-border rounded-xl text-center">
              <p className="text-xl font-semibold tracking-tight text-foreground mb-2">Punk Out</p>
              <p className="text-xl font-mono text-red-600" data-testid="punk-out-amount">
                ${bet.punk_out_amount.toFixed(2)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-5 mt-6">
            <div className="text-center p-4 bg-muted/30 rounded-xl">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarImage src={bet.creator?.avatar} />
                <AvatarFallback className="btn-premium text-white">{getInitials(bet.creator?.name)}</AvatarFallback>
              </Avatar>
              <div className="flex items-center justify-center gap-1.5">
                <p className="font-bold" data-testid="creator-name">{bet.creator?.name}</p>
                {bet.creator?.trust_score > 0 && (
                  <Badge className="h-4 px-1.5 text-[10px] bg-accent/20 text-accent border border-accent/50 flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 fill-accent" />
                    {bet.creator?.trust_score}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Creator</p>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-xl">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarImage src={bet.opponent?.avatar} />
                <AvatarFallback className="bg-secondary text-secondary-foreground">{getInitials(bet.opponent?.name)}</AvatarFallback>
              </Avatar>
              <div className="flex items-center justify-center gap-1.5">
                <p className="font-bold" data-testid="opponent-name">{bet.opponent?.name}</p>
                {bet.opponent?.trust_score > 0 && (
                  <Badge className="h-4 px-1.5 text-[10px] bg-accent/20 text-accent border border-accent/50 flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 fill-accent" />
                    {bet.opponent?.trust_score}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Opponent</p>
            </div>
          </div>
        </Card>

        {/* Stipulation Rules */}
        {bet.stipulation && (
          <Card className="premium-card p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">Stipulation Rules</h3>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed" data-testid="bet-stipulation">
              {bet.stipulation}
            </p>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
                <span>
                  If there is a dispute, a <strong>Designated Person (DP)</strong> will mediate. 
                  The DP's word is final with no debate.
                </span>
              </p>
            </div>
          </Card>
        )}

        {/* Pending Bet Actions */}
        {bet.status === 'pending' && isOpponent && (
          <Card className="premium-card p-6 rounded-2xl">
            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
            <p className="text-center text-muted-foreground mb-4">You have a pending bet request</p>
            <div className="flex gap-5">
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
                onClick={handleShowAgreement}
                className="flex-1 btn-premium text-white rounded-full btn-premium"
              >
                Review & Accept
              </Button>
            </div>
          </Card>
        )}

        {/* Stipulation */}
        {bet.status === 'accepted' && (
          <Card className="premium-card p-6 rounded-2xl" data-testid="stipulation-card">
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
                  className="w-full btn-premium text-white rounded-full"
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
          <Card className="premium-card p-6 rounded-2xl" data-testid="punk-out-card">
            <h3 className="text-lg font-semibold mb-3">Punk Out Amount</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Set penalty amount (e.g., 10% = ${(bet.amount * 0.1).toFixed(2)})
            </p>
            {bet.punk_out_amount > 0 ? (
              <div className="bg-muted/20 p-5 rounded-xl text-center border border-border">
                <p className="text-2xl font-semibold tracking-tight text-foreground mb-2">Punk Out</p>
                <p className="text-2xl font-mono text-red-600" data-testid="punk-out-amount">
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
                  className="btn-premium text-white rounded-full px-6"
                >
                  Set
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* DP Selection */}
        {bet.status === 'accepted' && !bet.dp_id && (isCreator || isOpponent) && (
          <Card className="premium-card p-6 rounded-2xl" data-testid="dp-selection-card">
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
          <Card className="premium-card p-6 rounded-2xl" data-testid="dp-info-card">
            <h3 className="text-lg font-bold mb-3">Designated Person</h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={bet.dp?.avatar} />
                <AvatarFallback className="btn-gold">{getInitials(bet.dp?.name)}</AvatarFallback>
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
                className="w-full mt-4 btn-premium text-white rounded-full btn-premium"
              >
                Lock Bet
              </Button>
            )}
          </Card>
        )}

        {/* Winner Declaration */}
        {/* Claim Punk Out */}
        {bet.status === 'active' && (isCreator || isOpponent) && !bet.punk_out_claim_status && (
          <Card className="premium-card p-6 rounded-2xl" data-testid="claim-punk-out-card">
            <h3 className="text-lg font-bold mb-3">Claim Punk Out</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The other party can accept or reject. If accepted, you get ${bet.punk_out_amount?.toFixed(2)} from the pool. 
              The remaining ${((bet.amount * 2) - bet.punk_out_amount).toFixed(2)} is split equally (${(((bet.amount * 2) - bet.punk_out_amount) / 2).toFixed(2)} each).
            </p>
            <div className="bg-muted/30 rounded-lg p-3 mb-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>You receive:</span>
                <span className="font-mono font-bold text-primary">${(bet.punk_out_amount + (((bet.amount * 2) - bet.punk_out_amount) / 2)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span className="ml-2">Punk out:</span>
                <span className="font-mono">${bet.punk_out_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span className="ml-2">Split refund:</span>
                <span className="font-mono">${(((bet.amount * 2) - bet.punk_out_amount) / 2).toFixed(2)}</span>
              </div>
              <div className="border-t border-white/10 mt-2 pt-2 flex justify-between text-muted-foreground">
                <span>They receive:</span>
                <span className="font-mono">${(((bet.amount * 2) - bet.punk_out_amount) / 2).toFixed(2)}</span>
              </div>
            </div>
            <Button
              data-testid="claim-punk-out-button"
              onClick={handleClaimPunkOut}
              className="w-full bg-destructive text-white rounded-full"
            >
              Claim Punk Out
            </Button>
          </Card>
        )}

        {/* Punk Out Claim Pending */}
        {bet.punk_out_claim_status === 'pending' && (
          <Card className="premium-card p-6 rounded-2xl" data-testid="punk-out-pending-card">
            <h3 className="text-lg font-bold mb-3 text-accent">Punk Out Claim Pending</h3>
            {bet.punk_out_claimer_id === user.user_id ? (
              <p className="text-sm text-muted-foreground mb-4">
                Waiting for {bet.punk_out_claimer_id === bet.creator_id ? bet.opponent?.name : bet.creator?.name} to accept or reject your punk out claim.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  <strong>{bet.punk_out_claimer_id === bet.creator_id ? bet.creator?.name : bet.opponent?.name}</strong> claims punk out.
                </p>
                <div className="bg-muted/30 rounded-lg p-3 mb-4 space-y-2 text-xs">
                  <p className="font-semibold">If you accept:</p>
                  <div className="space-y-1 ml-2">
                    <div className="flex justify-between">
                      <span>They get:</span>
                      <span className="font-mono text-primary">${(bet.punk_out_amount + (((bet.amount * 2) - bet.punk_out_amount) / 2)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span className="ml-2">Punk out:</span>
                      <span className="font-mono">${bet.punk_out_amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span className="ml-2">Split:</span>
                      <span className="font-mono">${(((bet.amount * 2) - bet.punk_out_amount) / 2).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/10 mt-2 pt-2 flex justify-between">
                      <span>You get:</span>
                      <span className="font-mono text-accent">${(((bet.amount * 2) - bet.punk_out_amount) / 2).toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-2">You lose ${(bet.amount - (((bet.amount * 2) - bet.punk_out_amount) / 2)).toFixed(2)}, they gain ${((bet.punk_out_amount + (((bet.amount * 2) - bet.punk_out_amount) / 2)) - bet.amount).toFixed(2)}.</p>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  If you <strong>reject</strong>: DP will decide.
                </p>
              </>
            )}
            {bet.punk_out_claimer_id !== user.user_id && (
              <div className="flex gap-5">
                <Button
                  data-testid="reject-punk-out-button"
                  onClick={handleRejectPunkOut}
                  variant="outline"
                  className="flex-1 rounded-full"
                >
                  Reject
                </Button>
                <Button
                  data-testid="accept-punk-out-button"
                  onClick={handleAcceptPunkOut}
                  className="flex-1 btn-premium text-white rounded-full"
                >
                  Accept
                </Button>
              </div>
            )}
          </Card>
        )}

        {bet.status === 'active' && !bet.winner_id && (isCreator || isOpponent || isDP) && (
          <Card className="premium-card p-6 rounded-2xl" data-testid="winner-declaration-card">
            <h3 className="text-lg font-bold mb-3 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-accent" />
              Declare Winner
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <Button
                data-testid="declare-creator-winner-button"
                onClick={() => handleDeclareWinner(bet.creator_id)}
                className="btn-premium text-white rounded-full"
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
          <>
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

            {/* Rate Opponent Button */}
            <Card className="premium-card p-6 rounded-2xl" data-testid="rate-opponent-card">
              <div className="text-center">
                <Star className="h-12 w-12 text-accent mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2">Rate Your Opponent</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Help build trust in the community by rating {bet.creator_id === user.user_id ? bet.opponent?.name : bet.creator?.name}
                </p>
                <Button
                  onClick={() => navigate(`/review/${bet.bet_id}`)}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  data-testid="rate-opponent-button"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Rate Opponent
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Stipulation Agreement Dialog */}
      <Dialog open={showStipulationAgreement} onOpenChange={setShowStipulationAgreement}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Review Bet Stipulation & Rules
            </DialogTitle>
            <DialogDescription>
              Please carefully review the bet details and agree to the terms before accepting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Bet Amount */}
            <Card className="bg-muted/30 p-4 rounded-xl">
              <h4 className="font-bold text-lg mb-2">Bet Amount</h4>
              <p className="text-3xl font-black font-mono text-primary">${bet?.amount.toFixed(2)}</p>
            </Card>

            {/* Stipulation */}
            <Card className="bg-muted/30 p-4 rounded-xl">
              <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Bet Stipulation
              </h4>
              {bet?.stipulation ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{bet.stipulation}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No specific stipulation set</p>
              )}
            </Card>

            {/* Rules & Terms */}
            <Card className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Bet Rules & Terms
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Both parties must agree to the stipulation before the bet becomes active</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>The bet amount will be held until the outcome is determined</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>A designated person (DP) may be assigned to verify the outcome</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Winner receives the full bet amount upon verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Disputes will be reviewed by platform administrators</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-destructive font-semibold">All bets are final once accepted and cannot be cancelled</span>
                </li>
              </ul>
            </Card>

            {/* Agreement Checkbox */}
            <Card className="bg-card border-border p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agree-terms"
                  checked={agreedToStipulation}
                  onCheckedChange={setAgreedToStipulation}
                  className="mt-1"
                  data-testid="agree-checkbox"
                />
                <label htmlFor="agree-terms" className="text-sm cursor-pointer leading-relaxed">
                  <span className="font-bold">I agree to the stipulation and the rules of this bet.</span>
                  <br />
                  <span className="text-muted-foreground">
                    I understand that this bet is binding and that I am committing ${bet?.amount.toFixed(2)} to this wager.
                  </span>
                </label>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={() => {
                setShowStipulationAgreement(false);
                setAgreedToStipulation(false);
              }}
              className="flex-1 rounded-full"
              data-testid="cancel-agreement-button"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!agreedToStipulation}
              className="flex-1 btn-premium text-white rounded-full btn-premium"
              data-testid="confirm-accept-button"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Yes, Accept Bet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}