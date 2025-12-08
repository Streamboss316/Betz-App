import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { ArrowLeft, Search, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PlaceBetPage({ user }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/users/search`, {
        params: { query: searchQuery },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleCreateBet = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (parseFloat(amount) > user.balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (!selectedOpponent) {
      toast.error('Select an opponent');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await axios.post(`${API}/bets/create`, {
        opponent_id: selectedOpponent.user_id,
        amount: parseFloat(amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Bet request sent!');
      navigate(`/bets/${res.data.bet_id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create bet');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full" data-testid="back-button">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold font-heading ml-4" data-testid="place-bet-title">Place Bet</h1>
      </header>

      <div className="p-6 max-w-2xl mx-auto">
        {step === 1 && (
          <div>
            <Card className="bg-card border-white/10 p-8 rounded-2xl mb-6">
              <label className="text-sm text-muted-foreground block mb-4">Enter Bet Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-12 w-12 text-muted-foreground" />
                <Input
                  type="number"
                  data-testid="amount-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="amount-input font-mono bg-transparent border-none text-center focus:ring-0 pl-16"
                  step="0.01"
                  min="0"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Available: <span className="text-primary font-mono">${user.balance.toFixed(2)}</span>
              </p>
              {amount && parseFloat(amount) > 0 && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Total Pool:</span>
                    <span className="font-mono">${(parseFloat(amount) * 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Platform Fee (3%):</span>
                    <span className="font-mono text-destructive">-${(parseFloat(amount) * 2 * 0.03).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-white/10 pt-2 mt-2">
                    <span>Winner Receives:</span>
                    <span className="font-mono text-primary">${(parseFloat(amount) * 2 * 0.97).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </Card>

            <Button
              data-testid="continue-button"
              onClick={() => {
                if (!amount || parseFloat(amount) <= 0) {
                  toast.error('Enter a valid amount');
                  return;
                }
                if (parseFloat(amount) > user.balance) {
                  toast.error('Insufficient balance');
                  return;
                }
                setStep(2);
              }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-14 text-lg font-bold uppercase tracking-wide btn-glow"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div>
            <Card className="bg-card border-white/10 p-6 rounded-2xl mb-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  data-testid="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, phone, or Betz ID"
                  className="pl-10 bg-input/50 border-transparent focus:border-primary rounded-lg h-12"
                />
              </div>

              {selectedOpponent && (
                <div className="mb-4 p-4 bg-primary/10 border border-primary rounded-xl">
                  <p className="text-xs text-muted-foreground mb-2">Selected Opponent</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedOpponent.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(selectedOpponent.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">{selectedOpponent.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedOpponent.betz_id}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2" data-testid="search-results">
                {searchResults.map((result) => (
                  <div
                    key={result.user_id}
                    data-testid={`user-result-${result.user_id}`}
                    onClick={() => setSelectedOpponent(result)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      selectedOpponent?.user_id === result.user_id
                        ? 'bg-primary/20 border border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={result.avatar} />
                      <AvatarFallback className="bg-muted">{getInitials(result.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{result.name}</p>
                      <p className="text-sm text-muted-foreground">{result.betz_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">W/L</p>
                      <p className="text-sm font-mono">
                        <span className="text-primary">{result.win_count}</span>/
                        <span className="text-destructive">{result.loss_count}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex gap-4">
              <Button
                data-testid="back-to-amount-button"
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 rounded-full h-14"
              >
                Back
              </Button>
              <Button
                data-testid="send-bet-button"
                onClick={handleCreateBet}
                disabled={loading || !selectedOpponent}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-14 font-bold uppercase btn-glow"
              >
                {loading ? 'Sending...' : 'Send Bet'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}