import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Trophy, Shield, AlertCircle, Star, CheckCircle, XCircle, Calendar, Zap, Lock, ShieldCheck, Camera, Video, Upload, Trash2, Image, Play } from 'lucide-react';
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
  
  // Race scheduling state
  const [showRaceSchedulePopup, setShowRaceSchedulePopup] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Mandatory review state
  const [showMandatoryReview, setShowMandatoryReview] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const [reviewRatings, setReviewRatings] = useState([0, 0, 0, 0]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  
  // DP nomination state for disputes
  const [dpNominationSearch, setDpNominationSearch] = useState('');
  const [dpNominationResults, setDpNominationResults] = useState([]);
  const [nominatingDp, setNominatingDp] = useState(false);
  
  // Evidence upload state
  const [evidence, setEvidence] = useState([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadBet();
    loadReviewQuestions();
    loadEvidence();
  }, [betId]);

  useEffect(() => {
    if (dpSearchQuery.length >= 2) {
      searchUsers();
    } else {
      setDpSearchResults([]);
    }
  }, [dpSearchQuery]);

  // Check if bet just completed and user needs to review
  // Only show review when BOTH users mutually agreed on outcome
  // NO review for:
  // - Punk outs (emotions may lead to unfair ratings)
  // - DP settlements (there was already a dispute)
  useEffect(() => {
    if (bet && !hasReviewed) {
      const isProperlyCompleted = bet.status === 'completed' && bet.winner_id;
      const wasMutuallyAgreed = isProperlyCompleted && !bet.settled_by_dp;
      
      // Only show mandatory review when BOTH users agreed (no DP involved)
      if (wasMutuallyAgreed) {
        checkIfUserReviewed();
      }
    }
  }, [bet, hasReviewed]);

  const loadReviewQuestions = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/review-questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviewQuestions(res.data);
    } catch (error) {
      console.error('Failed to load review questions');
    }
  };

  const checkIfUserReviewed = async () => {
    const token = localStorage.getItem('token');
    try {
      // Check if current user has already reviewed this bet
      const reviewedUserId = bet.creator_id === user.user_id ? bet.opponent_id : bet.creator_id;
      const res = await axios.get(`${API}/users/${reviewedUserId}/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check if current user already submitted a review for this bet
      const existingReview = res.data.find(r => r.bet_id === betId && r.reviewer_id === user.user_id);
      
      if (existingReview) {
        setHasReviewed(true);
      } else {
        // User hasn't reviewed yet - show mandatory review dialog
        setShowMandatoryReview(true);
      }
    } catch (error) {
      // If error, still show review dialog to be safe
      setShowMandatoryReview(true);
    }
  };

  // Load evidence for this bet
  const loadEvidence = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/bets/${betId}/evidence`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvidence(res.data);
    } catch (error) {
      console.error('Failed to load evidence');
    }
  };

  // Upload evidence file
  const handleUploadEvidence = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 50MB.');
      return;
    }

    setUploadingEvidence(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API}/bets/${betId}/evidence`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success(res.data.message);
      loadEvidence();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload evidence');
    } finally {
      setUploadingEvidence(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete evidence
  const handleDeleteEvidence = async (evidenceId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/bets/${betId}/evidence/${evidenceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Evidence deleted');
      loadEvidence();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete evidence');
    }
  };

  const handleSubmitMandatoryReview = async () => {
    if (reviewRatings.some(r => r === 0)) {
      toast.error('Please answer all questions to submit your review');
      return;
    }

    setSubmittingReview(true);
    const token = localStorage.getItem('token');
    const reviewedUserId = bet.creator_id === user.user_id ? bet.opponent_id : bet.creator_id;

    try {
      await axios.post(`${API}/bets/${betId}/review`, {
        bet_id: betId,
        reviewed_user_id: reviewedUserId,
        ratings: reviewRatings
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Review submitted! Thank you for your honest feedback.');
      setShowMandatoryReview(false);
      setHasReviewed(true);
      
      // Navigate to home page after review
      navigate('/');
    } catch (error) {
      if (error.response?.data?.detail?.includes('already reviewed')) {
        setShowMandatoryReview(false);
        setHasReviewed(true);
        navigate('/');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to submit review');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

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

    // Close stipulation dialog and show race schedule popup
    setShowStipulationAgreement(false);
    setShowRaceSchedulePopup(true);
  };

  const handleRaceNow = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/bets/${betId}/accept`, { race_now: true }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Bet accepted! Race is LIVE!');
      setShowRaceSchedulePopup(false);
      loadBet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept bet');
    }
  };

  const handleScheduleRace = async () => {
    if (!scheduledDate) {
      toast.error('Please select a date for the race');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const scheduledDateTime = scheduledTime 
        ? `${scheduledDate}T${scheduledTime}:00` 
        : `${scheduledDate}T12:00:00`;
      
      await axios.put(`${API}/bets/${betId}/accept`, { 
        race_now: false,
        scheduled_date: scheduledDateTime 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Bet scheduled for ${new Date(scheduledDateTime).toLocaleDateString()}. Can only be cancelled via Punk Out.`);
      setShowRaceSchedulePopup(false);
      setScheduledDate('');
      setScheduledTime('');
      loadBet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to schedule bet');
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
      const res = await axios.put(`${API}/bets/${betId}/declare-winner`, null, {
        params: { winner_id: winnerId },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === 'disputed') {
        toast.info('DP will mediate the dispute');
      } else {
        toast.success('Winner declared! Waiting for opponent to confirm.');
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

  const handleCancelPunkOut = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/bets/${betId}/cancel-punk-out`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Punk out claim cancelled');
      loadBet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel punk out');
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

  // Search for DP candidates
  const searchDpCandidates = async (query) => {
    if (query.length < 2) {
      setDpNominationResults([]);
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/users/search`, {
        params: { query },
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter out bet participants
      const filtered = res.data.filter(u => 
        u.user_id !== bet?.creator_id && u.user_id !== bet?.opponent_id
      );
      setDpNominationResults(filtered);
    } catch (error) {
      console.error('Failed to search users');
    }
  };

  // Handle DP nomination for dispute
  const handleNominateDp = async (dpId) => {
    setNominatingDp(true);
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put(`${API}/bets/${betId}/nominate-dp`, null, {
        params: { dp_id: dpId },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.dp_agreed) {
        toast.success(res.data.message);
      } else {
        toast.info(res.data.message);
      }
      setDpNominationSearch('');
      setDpNominationResults([]);
      loadBet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to nominate DP');
    } finally {
      setNominatingDp(false);
    }
  };

  // Handle DP settling dispute (if current user is the DP)
  const handleDpSettleDispute = async (winnerId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put(`${API}/bets/${betId}/dp-settle-dispute`, null, {
        params: { winner_id: winnerId },
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Dispute settled! Winner has been paid.');
      loadBet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to settle dispute');
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const getBetStatus = (status) => {
    if (status === 'pending') return { text: 'Pending', color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' };
    if (status === 'active') return { text: 'Active', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' };
    if (status === 'scheduled') return { text: 'Scheduled', color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' };
    if (status === 'completed') return { text: 'Settled', color: 'bg-green-600/20 text-green-500 border border-green-600/30' };
    if (status === 'disputed') return { text: 'Disputed', color: 'bg-red-600/20 text-red-500 border border-red-600/30' };
    if (status === 'cancelled') return { text: 'Cancelled', color: 'bg-red-600/20 text-red-500 border border-red-600/30' };
    return { text: status, color: 'bg-muted text-muted-foreground' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-base">Processing...</div>
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-base">Bet not found</div>
      </div>
    );
  }

  const isCreator = bet.creator_id === user.user_id;
  const isOpponent = bet.opponent_id === user.user_id;
  const isDP = bet.dp_id === user.user_id;
  const status = getBetStatus(bet.status);

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
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
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge className={`${status.color}`} data-testid="bet-status">{status.text}</Badge>
              {['active', 'scheduled', 'awaiting_confirmation', 'disputed'].includes(bet.status) && (
                <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-full">
                  <Lock className="h-3 w-3 text-green-500" />
                  <span className="text-[10px] text-green-500 font-semibold">Funds Secured</span>
                </div>
              )}
            </div>
            {/* Total Pool Info */}
            {['active', 'scheduled', 'awaiting_confirmation'].includes(bet.status) && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-400 font-medium">
                    Total Pool: ${(bet.amount * 2).toFixed(2)} locked & secured
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Scheduled Date Display */}
          {bet.status === 'scheduled' && bet.scheduled_date && (
            <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-purple-400" />
                <p className="text-lg font-semibold text-purple-400">Race Scheduled</p>
              </div>
              <p className="text-xl font-mono text-foreground" data-testid="scheduled-date">
                {new Date(bet.scheduled_date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Can only be cancelled via Punk Out</p>
            </div>
          )}

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
                  The DP&apos;s word is final with no debate.
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

        {/* Evidence Upload Section */}
        {['active', 'scheduled', 'awaiting_confirmation', 'disputed'].includes(bet.status) && (isCreator || isOpponent || isDP) && (
          <Card className="premium-card p-6 rounded-2xl" data-testid="evidence-upload-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Evidence Gallery</h3>
              </div>
              <Badge className="bg-muted text-muted-foreground text-xs">
                {evidence.length} file{evidence.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Upload Button */}
            <div className="mb-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadEvidence}
                accept="image/*,video/*"
                className="hidden"
                data-testid="evidence-file-input"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingEvidence}
                variant="outline"
                className="w-full rounded-xl border-dashed border-2 h-16 flex items-center justify-center gap-3"
                data-testid="upload-evidence-button"
              >
                {uploadingEvidence ? (
                  <span className="animate-pulse">Uploading...</span>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span>Upload Photo or Video</span>
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Max 50MB • JPEG, PNG, WebP, MP4, MOV supported
              </p>
            </div>

            {/* Evidence Gallery */}
            {evidence.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {evidence.map((item) => (
                  <div 
                    key={item.evidence_id} 
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted/30 group"
                    data-testid={`evidence-item-${item.evidence_id}`}
                  >
                    {item.file_type === 'image' ? (
                      <img 
                        src={`${BACKEND_URL}${item.file_url}`} 
                        alt="Evidence" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted/50">
                        <Play className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    
                    {/* Delete button - only show for uploader */}
                    {item.uploaded_by === user.user_id && (
                      <button
                        onClick={() => handleDeleteEvidence(item.evidence_id)}
                        className="absolute top-1 right-1 p-1.5 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`delete-evidence-${item.evidence_id}`}
                      >
                        <Trash2 className="h-3 w-3 text-white" />
                      </button>
                    )}
                    
                    {/* Type indicator */}
                    <div className="absolute bottom-1 left-1">
                      {item.file_type === 'image' ? (
                        <Image className="h-4 w-4 text-white drop-shadow" />
                      ) : (
                        <Video className="h-4 w-4 text-white drop-shadow" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {evidence.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No evidence uploaded yet
              </div>
            )}
          </Card>
        )}

        {/* Winner Declaration */}
        {/* Claim Punk Out */}
        {(bet.status === 'active' || bet.status === 'scheduled') && (isCreator || isOpponent) && !bet.punk_out_claim_status && (
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
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Waiting for {bet.punk_out_claimer_id === bet.creator_id ? bet.opponent?.name : bet.creator?.name} to accept or reject your punk out claim.
                </p>
                <Button
                  data-testid="cancel-punk-out-button"
                  onClick={handleCancelPunkOut}
                  variant="outline"
                  className="w-full rounded-full border-destructive text-destructive hover:bg-destructive/10"
                >
                  Cancel Punk Out Claim
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-foreground mb-4">
                  <strong>{bet.punk_out_claimer_id === bet.creator_id ? bet.creator?.name : bet.opponent?.name}</strong> claims punk out. Accept or Reject?
                </p>
                <div className="bg-muted/30 rounded-lg p-4 mb-4 space-y-3 text-sm">
                  <p className="font-semibold text-foreground">If you accept:</p>
                  <div className="space-y-2 ml-2">
                    <div className="flex justify-between items-center">
                      <span className="text-foreground">They get:</span>
                      <span className="font-mono font-bold text-primary">${(bet.amount + bet.punk_out_amount).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-2">Their half of total bet + punk out money</p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-foreground">Punk out:</span>
                      <span className="font-mono text-foreground">${bet.punk_out_amount?.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-2">10% of your initial bet</p>
                    
                    <div className="border-t border-white/10 mt-3 pt-3 flex justify-between items-center">
                      <span className="text-foreground">You get:</span>
                      <span className="font-mono font-bold text-accent">${(bet.amount - bet.punk_out_amount).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-2">Your bet minus punk out</p>
                  </div>
                  <div className="border-t border-white/10 mt-3 pt-3">
                    <p className="text-sm">
                      <span className="text-red-500 font-semibold">You lose ${bet.punk_out_amount?.toFixed(2)}</span>
                      <span className="text-muted-foreground">, </span>
                      <span className="text-green-500 font-semibold">they win ${bet.punk_out_amount?.toFixed(2)}</span>
                    </p>
                  </div>
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

        {/* Disputed Bet - DP Nomination Required */}
        {bet.status === 'disputed' && bet.dispute_type === 'needs_dp' && (
          <Card className="bg-red-500/10 border-red-500/30 p-6 rounded-2xl" data-testid="dp-nomination-card">
            <div className="text-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <h3 className="text-xl font-bold text-red-500">Bet Disputed</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Both parties must agree on a Designated Person (DP) to settle this dispute.
              </p>
            </div>

            {/* Show current nominations */}
            {bet.dp_nominations && Object.keys(bet.dp_nominations).length > 0 && (
              <div className="bg-muted/30 p-4 rounded-xl mb-4">
                <p className="text-sm font-medium mb-2">Current Nominations:</p>
                {bet.dp_nominations[bet.creator_id] && (
                  <p className="text-xs text-muted-foreground">
                    {bet.creator?.name} nominated: {bet.dp_nominations[bet.creator_id]}
                  </p>
                )}
                {bet.dp_nominations[bet.opponent_id] && (
                  <p className="text-xs text-muted-foreground">
                    {bet.opponent?.name} nominated: {bet.dp_nominations[bet.opponent_id]}
                  </p>
                )}
              </div>
            )}

            {/* DP Search */}
            <div className="space-y-3">
              <Input
                placeholder="Search for a DP by name or Betz ID..."
                value={dpNominationSearch}
                onChange={(e) => {
                  setDpNominationSearch(e.target.value);
                  searchDpCandidates(e.target.value);
                }}
                className="bg-muted/50"
                data-testid="dp-nomination-search"
              />
              
              {dpNominationResults.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dpNominationResults.map((dpUser) => (
                    <div
                      key={dpUser.user_id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={dpUser.avatar} />
                          <AvatarFallback className="bg-primary text-white">
                            {getInitials(dpUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{dpUser.name}</p>
                          <p className="text-xs text-muted-foreground">{dpUser.betz_id}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleNominateDp(dpUser.user_id)}
                        disabled={nominatingDp}
                        className="btn-premium text-white"
                        data-testid={`nominate-dp-${dpUser.user_id}`}
                      >
                        {nominatingDp ? 'Nominating...' : 'Nominate'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Both users must nominate the same person for them to become the DP
            </p>
          </Card>
        )}

        {/* Disputed Bet - Waiting for DP to settle */}
        {bet.status === 'disputed' && bet.dispute_type === 'dp_mediation' && bet.dp_id && bet.dp_id !== user.user_id && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 p-6 rounded-2xl text-center" data-testid="waiting-dp-card">
            <Shield className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-yellow-500">Awaiting DP Decision</h3>
            <p className="text-sm text-muted-foreground mt-2">
              The Designated Person is reviewing this dispute and will declare the winner.
            </p>
            {bet.dp && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={bet.dp.avatar} />
                  <AvatarFallback className="bg-yellow-500 text-white">{getInitials(bet.dp.name)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{bet.dp.name}</span>
              </div>
            )}
          </Card>
        )}

        {/* DP Settle Dispute (if current user is DP) */}
        {bet.status === 'disputed' && bet.dp_id === user.user_id && (
          <Card className="bg-primary/10 border-primary/30 p-6 rounded-2xl" data-testid="dp-settle-card">
            <div className="text-center mb-4">
              <Shield className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-xl font-bold">You Are The DP</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Review the dispute and declare the winner. Your decision is final.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleDpSettleDispute(bet.creator_id)}
                className="btn-premium text-white rounded-xl h-auto py-4 flex-col"
                data-testid="dp-award-creator"
              >
                <Trophy className="h-6 w-6 mb-1" />
                <span>Award to</span>
                <span className="font-bold">{bet.creator?.name}</span>
              </Button>
              <Button
                onClick={() => handleDpSettleDispute(bet.opponent_id)}
                className="bg-secondary text-secondary-foreground rounded-xl h-auto py-4 flex-col"
                data-testid="dp-award-opponent"
              >
                <Trophy className="h-6 w-6 mb-1" />
                <span>Award to</span>
                <span className="font-bold">{bet.opponent?.name}</span>
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
              {bet.settled_by_dp && (
                <p className="text-xs text-muted-foreground mt-2">Settled by DP</p>
              )}
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

      {/* Race Schedule Popup */}
      <Dialog open={showRaceSchedulePopup} onOpenChange={setShowRaceSchedulePopup}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-accent" />
              Ready to Race?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Both parties have agreed. Choose when to start the race.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Race Now Option */}
            <Button
              onClick={handleRaceNow}
              className="w-full h-16 btn-premium text-white rounded-xl text-lg font-bold"
              data-testid="race-now-button"
            >
              <Zap className="h-6 w-6 mr-3" />
              Race Now
            </Button>
            <p className="text-xs text-center text-muted-foreground -mt-2">
              Start the live bet immediately
            </p>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-sm text-muted-foreground">or</span>
              </div>
            </div>

            {/* Schedule for Later Option */}
            <Card className="bg-muted/20 border-white/10 p-4 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Calendar className="h-5 w-5 text-primary" />
                Schedule for Later
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="race-date" className="text-xs text-muted-foreground">Date</Label>
                  <Input
                    id="race-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="bg-background border-white/10 rounded-lg"
                    data-testid="schedule-date-input"
                  />
                </div>
                <div>
                  <Label htmlFor="race-time" className="text-xs text-muted-foreground">Time (optional)</Label>
                  <Input
                    id="race-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-background border-white/10 rounded-lg"
                    data-testid="schedule-time-input"
                  />
                </div>
              </div>

              <Button
                onClick={handleScheduleRace}
                disabled={!scheduledDate}
                variant="outline"
                className="w-full rounded-xl border-primary text-primary hover:bg-primary/10"
                data-testid="schedule-race-button"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Race
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Bet will be pending until race date. Can only cancel via Punk Out.
              </p>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mandatory Review Dialog - Cannot be dismissed */}
      <Dialog open={showMandatoryReview} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
              <Star className="h-6 w-6 text-accent fill-accent" />
              Rate Your Opponent
            </DialogTitle>
            <DialogDescription className="text-center">
              Please leave an honest review before continuing. This helps build trust in our community.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* User Being Reviewed */}
            {bet && (
              <div className="text-center">
                <Avatar className="h-16 w-16 mx-auto mb-2 border-2 border-primary/50">
                  <AvatarImage src={bet.creator_id === user.user_id ? bet.opponent?.avatar : bet.creator?.avatar} />
                  <AvatarFallback className="bg-primary text-white font-bold">
                    {getInitials(bet.creator_id === user.user_id ? bet.opponent?.name : bet.creator?.name)}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold">{bet.creator_id === user.user_id ? bet.opponent?.name : bet.creator?.name}</p>
                <p className="text-sm text-muted-foreground">Bet: ${bet.amount.toFixed(2)}</p>
              </div>
            )}

            {/* Rating Questions */}
            <div className="space-y-5">
              {reviewQuestions.map((question, idx) => (
                <div key={question.question_id}>
                  <p className="font-medium text-sm mb-2">{idx + 1}. {question.text}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((value) => (
                      <Button
                        key={value}
                        onClick={() => {
                          const newRatings = [...reviewRatings];
                          newRatings[idx] = value;
                          setReviewRatings(newRatings);
                        }}
                        variant={reviewRatings[idx] === value ? 'default' : 'outline'}
                        size="sm"
                        className={`h-12 flex-col rounded-xl text-xs ${
                          reviewRatings[idx] === value
                            ? value === 4 ? 'bg-green-600 hover:bg-green-700' 
                            : value === 3 ? 'bg-primary hover:bg-primary/90' 
                            : value === 2 ? 'bg-yellow-600 hover:bg-yellow-700' 
                            : 'bg-red-600 hover:bg-red-700'
                            : ''
                        }`}
                        data-testid={`mandatory-rating-${idx}-${value}`}
                      >
                        <Star className={`h-4 w-4 mb-0.5 ${reviewRatings[idx] === value ? 'fill-current' : ''}`} />
                        <span>{value === 1 ? '25%' : value === 2 ? '50%' : value === 3 ? '75%' : '100%'}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Rating Preview */}
            {reviewRatings.some(r => r > 0) && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Overall Rating</p>
                <p className="text-3xl font-bold text-primary">
                  {Math.round((reviewRatings.reduce((a, b) => a + b, 0) / 16) * 100)}%
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmitMandatoryReview}
              disabled={submittingReview || reviewRatings.some(r => r === 0)}
              className="w-full btn-premium text-white rounded-xl h-12"
              data-testid="submit-mandatory-review"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review & Continue'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your honest feedback helps maintain a trusted P2P community
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}