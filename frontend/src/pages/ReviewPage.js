import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { ArrowLeft, Star, CheckCircle, ShieldCheck, ThumbsUp, ThumbsDown, Handshake, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ReviewPage({ user }) {
  const { betId } = useParams();
  const navigate = useNavigate();
  const [bet, setBet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [ratings, setRatings] = useState([0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [betId]);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [betRes, questionsRes] = await Promise.all([
        axios.get(`${API}/bets/${betId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/review-questions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setBet(betRes.data);
      setQuestions(questionsRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load bet');
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (ratings.some(r => r === 0)) {
      toast.error('Please answer all questions');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    const reviewedUserId = bet.creator_id === user.user_id ? bet.opponent_id : bet.creator_id;

    try {
      await axios.post(`${API}/bets/${betId}/review`, {
        bet_id: betId,
        reviewed_user_id: reviewedUserId,
        ratings: ratings
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Review submitted! Thanks for your feedback.');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const getRatingIcon = (value) => {
    if (value === 1) return <ThumbsDown className="h-5 w-5" />;
    if (value === 2) return <RotateCcw className="h-5 w-5" />;
    if (value === 3) return <ThumbsUp className="h-5 w-5" />;
    if (value === 4) return <Star className="h-5 w-5 fill-current" />;
    return null;
  };

  const getRatingLabel = (value) => {
    if (value === 1) return 'Poor';
    if (value === 2) return 'Fair';
    if (value === 3) return 'Good';
    if (value === 4) return 'Excellent';
    return '';
  };

  const getRatingColor = (value, isSelected) => {
    if (!isSelected) return 'bg-muted/30 border-white/10 text-muted-foreground hover:bg-muted/50';
    if (value === 1) return 'bg-red-500/20 border-red-500/50 text-red-400';
    if (value === 2) return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
    if (value === 3) return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
    if (value === 4) return 'bg-green-500/20 border-green-500/50 text-green-400';
    return '';
  };

  if (loading || !bet) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p className="text-sm text-muted-foreground">Loading review...</p>
      </div>
    );
  }

  const reviewedUser = bet.creator_id === user.user_id ? bet.opponent : bet.creator;
  const avgRating = ratings.filter(r => r > 0).length > 0 
    ? ratings.reduce((a, b) => a + b, 0) / 4
    : 0;
  const overallPercentage = Math.round((avgRating / 4) * 100);

  const getOverallColor = () => {
    if (overallPercentage >= 75) return 'text-green-500';
    if (overallPercentage >= 50) return 'text-blue-500';
    if (overallPercentage >= 25) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* User Being Reviewed - Compact Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-white/10 p-4 rounded-xl" data-testid="reviewed-user-card">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary/50">
              <AvatarImage src={reviewedUser?.avatar} />
              <AvatarFallback className="btn-premium text-white text-lg font-bold">
                {getInitials(reviewedUser?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg font-bold" data-testid="reviewed-user-name">{reviewedUser?.name}</h2>
              <p className="text-xs text-muted-foreground font-mono">{reviewedUser?.betz_id}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">Bet:</span>
                <span className="text-sm font-semibold text-primary">${bet.amount.toFixed(2)}</span>
              </div>
            </div>
            {reviewedUser?.trust_score > 0 && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="text-xl font-bold text-primary">{reviewedUser?.trust_score}%</p>
              </div>
            )}
          </div>
        </Card>

        {/* Rating Questions - Professional Style */}
        <Card className="premium-card p-4 rounded-xl" data-testid="rating-questions-card">
          <div className="flex items-center gap-2 mb-4">
            <Handshake className="h-5 w-5 text-accent" />
            <h3 className="font-semibold">Rate Your Experience</h3>
          </div>

          <div className="space-y-5">
            {questions.map((question, idx) => (
              <div key={question.question_id} data-testid={`question-${idx}`}>
                <p className="text-sm font-medium mb-2 text-foreground">{idx + 1}. {question.text}</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((value) => (
                    <button
                      key={value}
                      data-testid={`rating-${idx}-${value}`}
                      onClick={() => {
                        const newRatings = [...ratings];
                        newRatings[idx] = value;
                        setRatings(newRatings);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${getRatingColor(value, ratings[idx] === value)}`}
                    >
                      {getRatingIcon(value)}
                      <span className="text-[10px] mt-1 font-medium">{getRatingLabel(value)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Overall Rating Preview - Minimal */}
        {ratings.some(r => r > 0) && (
          <Card className="bg-muted/20 border-white/10 p-4 rounded-xl" data-testid="overall-rating-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Overall Trust Score</p>
                <p className="text-sm text-muted-foreground">Based on your ratings</p>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-bold ${getOverallColor()}`} data-testid="overall-percentage">
                  {overallPercentage}%
                </p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  overallPercentage >= 75 ? 'bg-green-500' :
                  overallPercentage >= 50 ? 'bg-blue-500' :
                  overallPercentage >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </Card>
        )}

        {/* Submit Button - Clean */}
        <Button
          data-testid="submit-review-button"
          onClick={handleSubmitReview}
          disabled={submitting || ratings.some(r => r === 0)}
          className="w-full btn-premium text-white rounded-xl h-12 text-sm font-semibold"
        >
          {submitting ? (
            'Submitting...'
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Trust Review
            </>
          )}
        </Button>

        {/* Helper Text */}
        <p className="text-xs text-center text-muted-foreground px-4">
          Your honest feedback helps build a trusted betting community. 
          All reviews are anonymous.
        </p>
      </div>
    </div>
  );
}
