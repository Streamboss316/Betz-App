import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Search, DollarSign, Users, Trophy, Clock, CheckCircle, XCircle, AlertCircle, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function QuickBetPage({ user }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [myQuickBets, setMyQuickBets] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const loadMyQuickBets = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/bets?status=`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const quickBets = res.data.filter(b => b.bet_type === 'quick');
      setMyQuickBets(quickBets);
    } catch (error) {
      console.error('Failed to load quick bets');
    }
  }, []);

  useEffect(() => {
    loadMyQuickBets();
  }, [loadMyQuickBets]);

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/users/search`, {
        params: { query },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data.filter(u => u.user_id !== user.user_id));
    } catch (error) {
      console.error('Search failed');
    }
  };

  const handleCreateQuickBet = async () => {
    if (!selectedOpponent || !amount || parseFloat(amount) < 1) {
      toast.error('Please select opponent and enter amount ($1 minimum)');
      return;
    }

    if (parseFloat(amount) > user.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      await axios.post(`${API}/quick-bets/create`, {
        opponent_id: selectedOpponent.user_id,
        amount: parseFloat(amount),
        description: description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Quick bet created!');
      setShowConfirm(false);
      setSelectedOpponent(null);
      setAmount('');
      setDescription('');
      setSearchQuery('');
      loadMyQuickBets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create quick bet');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBet = async (betId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/quick-bets/${betId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Quick bet accepted!');
      loadMyQuickBets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept');
    }
  };

  const handleSettleBet = async (betId, winnerId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put(`${API}/quick-bets/${betId}/settle`, null, {
        params: { winner_id: winnerId },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === 'completed') {
        toast.success('Bet settled!');
      } else if (res.data.status === 'disputed') {
        toast.info('Disagreement! Admin will settle.');
      } else {
        toast.info('Waiting for opponent to confirm');
      }
      loadMyQuickBets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to settle');
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      'active': 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      'awaiting_confirmation': 'bg-purple-500/20 text-purple-500 border-purple-500/30',
      'disputed': 'bg-red-500/20 text-red-500 border-red-500/30',
      'completed': 'bg-green-500/20 text-green-500 border-green-500/30'
    };
    return styles[status] || 'bg-muted text-muted-foreground';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pending',
      'active': 'Active',
      'awaiting_confirmation': 'Confirming',
      'disputed': 'Disputed',
      'completed': 'Completed'
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Create Quick Bet */}
        <Card className="premium-card p-4 rounded-xl" data-testid="create-quick-bet">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-yellow-500" />
            <h2 className="font-semibold">Create Quick Bet</h2>
          </div>

          {/* Search Opponent */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search opponent by name or Betz ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="pl-10 bg-muted/30 border-white/10"
                data-testid="opponent-search"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedOpponent && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {searchResults.map((u) => (
                  <div
                    key={u.user_id}
                    onClick={() => {
                      setSelectedOpponent(u);
                      setSearchQuery(u.name);
                      setSearchResults([]);
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback className="bg-primary text-white text-xs">{getInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.betz_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Opponent */}
            {selectedOpponent && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/30">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-primary/50">
                    <AvatarImage src={selectedOpponent.avatar} />
                    <AvatarFallback className="bg-primary text-white">{getInitials(selectedOpponent.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedOpponent.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedOpponent.betz_id}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedOpponent(null);
                    setSearchQuery('');
                  }}
                  className="text-xs"
                >
                  Change
                </Button>
              </div>
            )}

            {/* Amount */}
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Bet amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 bg-muted/30 border-white/10"
                data-testid="bet-amount"
              />
            </div>

            {/* Description */}
            <Input
              placeholder="What's the bet about? (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-muted/30 border-white/10"
              data-testid="bet-description"
            />

            {/* Create Button */}
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!selectedOpponent || !amount || parseFloat(amount) < 1}
              className="w-full btn-premium text-white rounded-xl h-12"
              data-testid="create-bet-button"
            >
              <Zap className="h-4 w-4 mr-2" />
              Create Quick Bet
            </Button>
          </div>
        </Card>

        {/* My Quick Bets */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground px-1">My Quick Bets</h2>
          
          {myQuickBets.length === 0 ? (
            <Card className="premium-card p-6 rounded-xl text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-yellow-500/60" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">No quick bets yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create one above to get started</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {myQuickBets.map((bet) => {
                const isCreator = bet.creator_id === user.user_id;
                const opponent = isCreator ? bet.opponent : bet.creator;
                const needsAction = (bet.status === 'pending' && !isCreator) || 
                                   (bet.status === 'active') ||
                                   (bet.status === 'awaiting_confirmation' && !bet[`winner_declaration_${user.user_id}`]);

                return (
                  <Card key={bet.bet_id} className="premium-card p-4 rounded-xl" data-testid={`quick-bet-${bet.bet_id}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={opponent?.avatar} />
                          <AvatarFallback className="bg-muted">{getInitials(opponent?.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{opponent?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {isCreator ? 'You challenged' : 'Challenged you'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary font-mono">${bet.amount.toFixed(2)}</p>
                        <Badge className={`text-[10px] ${getStatusBadge(bet.status)}`}>
                          {getStatusLabel(bet.status)}
                        </Badge>
                      </div>
                    </div>

                    {bet.description && (
                      <p className="text-xs text-muted-foreground mb-3 bg-muted/20 p-2 rounded">{bet.description}</p>
                    )}

                    {/* Actions */}
                    {bet.status === 'pending' && !isCreator && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAcceptBet(bet.bet_id)}
                          className="flex-1 btn-premium text-white rounded-lg h-9 text-sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 rounded-lg h-9 text-sm"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}

                    {bet.status === 'active' && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground text-center">Who won?</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => handleSettleBet(bet.bet_id, bet.creator_id)}
                            variant="outline"
                            className="rounded-lg h-9 text-sm"
                          >
                            <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
                            {bet.creator?.name?.split(' ')[0]}
                          </Button>
                          <Button
                            onClick={() => handleSettleBet(bet.bet_id, bet.opponent_id)}
                            variant="outline"
                            className="rounded-lg h-9 text-sm"
                          >
                            <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
                            {bet.opponent?.name?.split(' ')[0]}
                          </Button>
                        </div>
                      </div>
                    )}

                    {bet.status === 'awaiting_confirmation' && (
                      <div className="text-center py-2">
                        <Clock className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Waiting for confirmation...</p>
                      </div>
                    )}

                    {bet.status === 'disputed' && (
                      <div className="text-center py-2 bg-red-500/10 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                        <p className="text-xs text-red-400">Admin will settle this dispute</p>
                      </div>
                    )}

                    {bet.status === 'completed' && bet.winner_id && (
                      <div className="text-center py-2 bg-green-500/10 rounded-lg">
                        <Trophy className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                        <p className="text-xs text-green-400">
                          {bet.winner_id === user.user_id ? 'You won!' : `${bet.winner_id === bet.creator_id ? bet.creator?.name : bet.opponent?.name} won`}
                        </p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Confirm Quick Bet
            </DialogTitle>
            <DialogDescription>
              You&apos;re about to create a quick bet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedOpponent && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Opponent</span>
                <span className="font-medium">{selectedOpponent.name}</span>
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-xl font-bold text-primary font-mono">${parseFloat(amount || 0).toFixed(2)}</span>
            </div>
            {description && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Description</span>
                <p className="mt-1">{description}</p>
              </div>
            )}
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-500">
                <strong>Quick Bet Rules:</strong> Both parties must agree on the winner. 
                If there&apos;s a disagreement, admin will settle the bet.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateQuickBet}
              disabled={loading}
              className="flex-1 btn-premium text-white rounded-xl"
            >
              {loading ? 'Creating...' : 'Confirm Bet'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
