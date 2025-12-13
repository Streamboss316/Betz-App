import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Search, DollarSign, AlertCircle, Shield, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PlaceBetPage({ user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [stipulation, setStipulation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInviteMode, setShowInviteMode] = useState(false);
  const [inviteContact, setInviteContact] = useState('');
  const [inviteType, setInviteType] = useState('phone'); // 'phone' or 'email'
  
  // Structured stipulation fields
  const [stipulationForm, setStipulationForm] = useState({
    raceType: '',
    rules: '',
    outcome: '',
    details: ''
  });
  const [stipulationComplete, setStipulationComplete] = useState(false);
  
  // DP requirement for high-value bets
  const [selectedDP, setSelectedDP] = useState(null);
  const [dpSearchQuery, setDpSearchQuery] = useState('');
  const [dpSearchResults, setDpSearchResults] = useState([]);
  const requiresDP = parseFloat(amount) > 999.99;

  // Check if opponent is pre-selected from URL
  useEffect(() => {
    const opponentId = searchParams.get('opponent');
    if (opponentId) {
      loadOpponentProfile(opponentId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (dpSearchQuery.length >= 2) {
      searchDPs();
    } else {
      setDpSearchResults([]);
    }
  }, [dpSearchQuery]);

  const loadOpponentProfile = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/users/${userId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedOpponent(res.data);
      // Stay on step 1 to enter amount/stipulation, then user goes to step 2 to review opponent
      toast.success(`${res.data.name} pre-selected as opponent`);
    } catch (error) {
      toast.error('Failed to load opponent profile');
    }
  };

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

  const searchDPs = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/users/search`, {
        params: { query: dpSearchQuery },
        headers: { Authorization: `Bearer ${token}` }
      });
      setDpSearchResults(res.data);
    } catch (error) {
      console.error('DP search failed:', error);
    }
  };

  const checkContactIsMember = async () => {
    if (!inviteContact) return;
    
    const token = localStorage.getItem('token');
    try {
      const contactData = inviteType === 'phone' 
        ? { phone: inviteContact } 
        : { email: inviteContact };
      
      const res = await axios.post(`${API}/users/check-contact`, contactData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.exists) {
        // User is already a member!
        setSelectedOpponent(res.data.user);
        setInviteContact('');
        setShowInviteMode(false);
        toast.success(`${res.data.user.name} is a member! Selected as opponent.`);
      } else {
        // Not a member - send invite
        await sendMembershipInvite();
      }
    } catch (error) {
      toast.error('Failed to check contact');
    }
  };

  const sendMembershipInvite = async () => {
    const token = localStorage.getItem('token');
    try {
      const inviteData = inviteType === 'phone' 
        ? { phone: inviteContact } 
        : { email: inviteContact };
      
      const res = await axios.post(`${API}/invites/send`, inviteData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        toast.success(res.data.message);
        // If they're already a member, select them
        if (res.data.user) {
          setSelectedOpponent(res.data.user);
          setInviteContact('');
          setShowInviteMode(false);
        }
      }
    } catch (error) {
      toast.error('Failed to send invite');
    }
  };

  const handleCreateBet = async () => {
    if (!amount || parseFloat(amount) < 1) {
      toast.error('Minimum bet amount is $1');
      return;
    }

    if (parseFloat(amount) > user.balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (!selectedOpponent) {
      toast.error('Please select an opponent. If they are not a member, send them an invite first.');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const betData = {
        opponent_id: selectedOpponent.user_id,
        amount: parseFloat(amount),
        stipulation: stipulation || ""
      };

      // Add DP if required for high-value bets
      if (selectedDP) {
        betData.dp_id = selectedDP.user_id;
      }

      const res = await axios.post(`${API}/bets/create`, betData, {
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
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="p-6 max-w-2xl mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-5 mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'btn-premium text-white' : 'bg-muted text-muted-foreground'}`}>
              1
            </div>
            <span className={`text-sm font-medium ${step === 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
              Amount & Rules
            </span>
          </div>
          <div className="w-12 h-0.5 bg-muted"></div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'btn-premium text-white' : 'bg-muted text-muted-foreground'}`}>
              2
            </div>
            <span className={`text-sm font-medium ${step === 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
              Select Opponent
            </span>
          </div>
        </div>

        {step === 1 && (
          <div>
            <Card className="premium-card p-8 rounded-2xl mb-6">
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
                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-2 mb-3 pb-3 border-b border-white/10">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-400 font-medium">Both parties&apos; funds will be secured</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Total pool</span>
                    <span className="font-mono">${(parseFloat(amount) * 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Service fee (3%)</span>
                    <span className="font-mono text-destructive">-${(parseFloat(amount) * 2 * 0.03).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Punk Out</span>
                    <span className="font-mono text-destructive">${(parseFloat(amount) * 0.10).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-white/10 pt-2 mt-2">
                    <span>Winner Receives</span>
                    <span className="font-mono text-green-600">${(parseFloat(amount) * 2 * 0.97).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Stipulation Card - Structured Form */}
            <Card className="premium-card p-6 rounded-2xl mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Bet Stipulation</h3>
                {stipulationComplete && (
                  <span className="ml-auto text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-full">✓ Complete</span>
                )}
              </div>

              {!stipulationComplete ? (
                <div className="space-y-5">
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-accent">Required:</strong> Complete all stipulation fields before continuing. This defines the terms of your bet.
                      </p>
                    </div>
                  </div>

                  {/* Race Type */}
                  <div>
                    <Label htmlFor="raceType" className="text-sm font-semibold mb-2 block">
                      1. Race Type <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="raceType"
                      data-testid="race-type-input"
                      value={stipulationForm.raceType}
                      onChange={(e) => setStipulationForm({...stipulationForm, raceType: e.target.value})}
                      placeholder="e.g., 1/8 Mile Drag Race, 1/4 Mile, Street Race, etc."
                      className="bg-input/50 border-white/10 rounded-lg"
                    />
                  </div>

                  {/* Rules */}
                  <div>
                    <Label htmlFor="rules" className="text-sm font-semibold mb-2 block">
                      2. Track Rules or Street Rules <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="rules"
                      data-testid="rules-input"
                      value={stipulationForm.rules}
                      onChange={(e) => setStipulationForm({...stipulationForm, rules: e.target.value})}
                      placeholder="e.g., Track Rules: Must follow NHRA guidelines&#10;or&#10;Street Rules: No police interference, start from roll, etc."
                      className="bg-input/50 border-white/10 rounded-lg min-h-[80px] resize-none"
                      rows="3"
                    />
                  </div>

                  {/* Race Outcome */}
                  <div>
                    <Label htmlFor="outcome" className="text-sm font-semibold mb-2 block">
                      3. Race Outcome (How Winner is Determined) <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="outcome"
                      data-testid="outcome-input"
                      value={stipulationForm.outcome}
                      onChange={(e) => setStipulationForm({...stipulationForm, outcome: e.target.value})}
                      placeholder="e.g., First to cross finish line wins. Red light = automatic loss. False start = loss."
                      className="bg-input/50 border-white/10 rounded-lg min-h-[80px] resize-none"
                      rows="3"
                    />
                  </div>

                  {/* Race Details */}
                  <div>
                    <Label htmlFor="details" className="text-sm font-semibold mb-2 block">
                      4. Additional Race Details <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="details"
                      data-testid="details-input"
                      value={stipulationForm.details}
                      onChange={(e) => setStipulationForm({...stipulationForm, details: e.target.value})}
                      placeholder="e.g., Date, time, location, car specifications, any other conditions..."
                      className="bg-input/50 border-white/10 rounded-lg min-h-[80px] resize-none"
                      rows="3"
                    />
                  </div>

                  <Button
                    onClick={() => {
                      // Validate all fields are filled
                      if (!stipulationForm.raceType.trim()) {
                        toast.error('Race Type is required');
                        return;
                      }
                      if (!stipulationForm.rules.trim()) {
                        toast.error('Rules are required');
                        return;
                      }
                      if (!stipulationForm.outcome.trim()) {
                        toast.error('Race Outcome is required');
                        return;
                      }
                      if (!stipulationForm.details.trim()) {
                        toast.error('Race Details are required');
                        return;
                      }

                      // Combine all fields into stipulation text
                      const fullStipulation = `RACE TYPE:\n${stipulationForm.raceType}\n\nRULES:\n${stipulationForm.rules}\n\nOUTCOME:\n${stipulationForm.outcome}\n\nDETAILS:\n${stipulationForm.details}`;
                      setStipulation(fullStipulation);
                      setStipulationComplete(true);
                      toast.success('Stipulation completed!');
                    }}
                    className="w-full btn-premium text-white rounded-lg h-12 font-bold"
                    data-testid="done-stipulation-button"
                  >
                    Done - Lock In Stipulation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap font-sans">{stipulation}</pre>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setStipulationComplete(false)}
                    className="w-full rounded-lg"
                    data-testid="edit-stipulation-button"
                  >
                    Edit Stipulation
                  </Button>
                </div>
              )}

              <div className="mt-4 bg-accent/10 border border-accent/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-accent">About DP:</strong> If there is a dispute, a Designated Person (DP) will mediate. 
                    After bet is accepted, both parties will agree on a trusted DP. The DP&apos;s word is final.
                  </p>
                </div>
              </div>
            </Card>

            {/* DP Required for High-Value Bets */}
            {requiresDP && (
              <Card className="bg-card border-destructive/30 p-6 rounded-2xl mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-destructive" />
                  <h3 className="font-bold text-lg text-destructive">Designated Person (DP) Required</h3>
                  {selectedDP && (
                    <span className="ml-auto text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-full">✓ DP Selected</span>
                  )}
                </div>

                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-destructive mb-1">High-Value Bet Alert</p>
                      <p className="text-xs text-muted-foreground">
                        Bets over <strong className="text-destructive">$999.99</strong> require a trusted Designated Person (DP) to verify the outcome. 
                        Select a mutually agreed upon DP before continuing.
                      </p>
                    </div>
                  </div>
                </div>

                {!selectedDP ? (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Search for DP</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        data-testid="dp-search-input"
                        value={dpSearchQuery}
                        onChange={(e) => setDpSearchQuery(e.target.value)}
                        placeholder="Search by name, phone, or Betz ID"
                        className="pl-10 bg-input/50 border-white/10 rounded-lg"
                      />
                    </div>

                    {dpSearchResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto space-y-2 border border-white/10 rounded-lg p-2">
                        {dpSearchResults.map((dp) => (
                          <div
                            key={dp.user_id}
                            className="flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 rounded-lg cursor-pointer transition-all"
                            onClick={() => {
                              setSelectedDP(dp);
                              setDpSearchQuery('');
                              setDpSearchResults([]);
                              toast.success(`${dp.name} selected as DP`);
                            }}
                            data-testid={`dp-result-${dp.user_id}`}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={dp.avatar} />
                              <AvatarFallback className="bg-muted text-xs">{dp.name?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">{dp.name}</p>
                              <p className="text-xs text-muted-foreground">{dp.betz_id}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-primary/10 border border-border p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">Selected DP</p>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={selectedDP.avatar} />
                          <AvatarFallback className="btn-premium text-white">{selectedDP.name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{selectedDP.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedDP.betz_id}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDP(null)}
                      className="w-full rounded-lg"
                      data-testid="change-dp-button"
                    >
                      Change DP
                    </Button>
                  </div>
                )}
              </Card>
            )}

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
                if (!stipulationComplete) {
                  toast.error('Please complete the stipulation before continuing');
                  return;
                }
                if (requiresDP && !selectedDP) {
                  toast.error('Please select a Designated Person (DP) for this high-value bet');
                  return;
                }
                setStep(2);
              }}
              disabled={!stipulationComplete || (requiresDP && !selectedDP)}
              className="w-full btn-premium text-white hover:bg-primary/90 rounded-full h-14 text-lg font-bold uppercase tracking-wide btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Select Opponent
            </Button>
          </div>
        )}

        {step === 2 && (
          <div>
            {/* Bet Summary */}
            <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-border p-6 rounded-2xl mb-6">
              <h3 className="text-lg font-bold mb-3">Bet Summary</h3>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Bet Amount</p>
                  <p className="text-2xl font-bold font-mono text-primary">${parseFloat(amount).toFixed(2)}</p>
                </div>
                {selectedDP && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Designated Person</p>
                    <p className="text-sm font-semibold">{selectedDP.name}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="premium-card p-6 rounded-2xl mb-6">
              <h3 className="text-xl font-bold mb-4">Select Your Opponent</h3>
              {/* Toggle between search and invite mode */}
              <div className="flex gap-2 mb-4">
                <Button
                  onClick={() => {
                    setShowInviteMode(false);
                    setInviteContact('');
                  }}
                  variant={!showInviteMode ? "default" : "outline"}
                  className="flex-1 rounded-lg"
                  data-testid="search-mode-button"
                >
                  Search Users
                </Button>
                <Button
                  onClick={() => {
                    setShowInviteMode(true);
                    setSelectedOpponent(null);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  variant={showInviteMode ? "default" : "outline"}
                  className="flex-1 rounded-lg"
                  data-testid="invite-mode-button"
                >
                  Invite New User
                </Button>
              </div>

              {!showInviteMode ? (
                <>
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
                          <AvatarFallback className="btn-premium text-white">{getInitials(selectedOpponent.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{selectedOpponent.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedOpponent.betz_id}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-5">
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        User doesn&apos;t have BETZ? Enter their phone number or email to send them an invite link to download the app.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-2">
                    <Button
                      onClick={() => setInviteType('phone')}
                      variant={inviteType === 'phone' ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      data-testid="phone-invite-button"
                    >
                      Phone Number
                    </Button>
                    <Button
                      onClick={() => setInviteType('email')}
                      variant={inviteType === 'email' ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      data-testid="email-invite-button"
                    >
                      Email Address
                    </Button>
                  </div>

                  <Input
                    data-testid="invite-contact-input"
                    value={inviteContact}
                    onChange={(e) => setInviteContact(e.target.value)}
                    placeholder={inviteType === 'phone' ? 'Enter phone number' : 'Enter email address'}
                    type={inviteType === 'phone' ? 'tel' : 'email'}
                    className="bg-input/50 border-white/10 rounded-lg h-12"
                  />

                  {inviteContact && (
                    <>
                      <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                        <p className="text-sm font-semibold mb-1">Contact to check/invite:</p>
                        <p className="text-lg font-mono text-accent">{inviteContact}</p>
                      </div>
                      
                      <Button
                        onClick={checkContactIsMember}
                        className="w-full rounded-lg"
                        data-testid="check-member-button"
                      >
                        Check if Member / Send Invite
                      </Button>
                      
                      <div className="text-xs text-muted-foreground text-center">
                        We&apos;ll check if they&apos;re a member. If not, we&apos;ll send them an invite to join BETZ.
                      </div>
                    </>
                  )}
                </div>
              )}

              {!showInviteMode && (
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
              )}
            </Card>

            <div className="flex gap-5">
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
                className="flex-1 btn-premium text-white hover:bg-primary/90 rounded-full h-14 font-bold uppercase btn-premium"
              >
                {loading ? 'Processing...' : 'Send Bet Request'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}