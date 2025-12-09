import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { ArrowLeft, Star } from 'lucide-react';
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

      toast.success('Review submitted!');
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

  const getRatingLabel = (rating) => {
    if (rating === 1) return '25% - Poor';
    if (rating === 2) return '50% - Fair';
    if (rating === 3) return '75% - Good';
    if (rating === 4) return '100% - Excellent';
    return 'Not Rated';
  };

  if (loading || !bet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl font-heading">Loading...</div>
      </div>
    );
  }

  const reviewedUser = bet.creator_id === user.user_id ? bet.opponent : bet.creator;
  const avgRating = ratings.filter(r => r > 0).length > 0 
    ? ratings.reduce((a, b) => a + b, 0) / 4
    : 0;
  const overallPercentage = Math.round((avgRating / 4) * 100);

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-border/50 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full" data-testid="back-button">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4" data-testid="review-title">Rate Your Opponent</h1>
      </header>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* User Being Reviewed */}
        <Card className="bg-card border-white/10 p-6 rounded-2xl text-center" data-testid="reviewed-user-card">
          <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-primary/50">
            <AvatarImage src={reviewedUser?.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {getInitials(reviewedUser?.name)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold mb-1" data-testid="reviewed-user-name">{reviewedUser?.name}</h2>
          <p className="text-sm text-muted-foreground">Bet Amount: ${bet.amount.toFixed(2)}</p>
        </Card>

        {/* Rating Questions */}
        <Card className="bg-card border-white/10 p-6 rounded-2xl" data-testid="rating-questions-card">
          <h3 className="text-lg font-bold mb-4">Please Rate Your Experience</h3>
          <p className="text-sm text-muted-foreground mb-6">Your honest feedback helps build trust in the community</p>

          <div className="space-y-6">
            {questions.map((question, idx) => (
              <div key={question.question_id} data-testid={`question-${idx}`}>
                <p className="font-semibold mb-3">{idx + 1}. {question.text}</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((value) => (
                    <Button
                      key={value}
                      data-testid={`rating-${idx}-${value}`}
                      onClick={() => {
                        const newRatings = [...ratings];
                        newRatings[idx] = value;
                        setRatings(newRatings);
                      }}
                      variant={ratings[idx] === value ? 'default' : 'outline'}
                      className={`h-16 flex-col rounded-xl ${
                        ratings[idx] === value
                          ? value === 4 ? 'bg-primary' : value === 3 ? 'bg-accent' : value === 2 ? 'bg-secondary' : 'bg-destructive'
                          : ''
                      }`}
                    >
                      <Star className={`h-5 w-5 mb-1 ${
                        ratings[idx] === value ? 'fill-current' : ''
                      }`} />
                      <span className="text-xs">{value === 1 ? '25%' : value === 2 ? '50%' : value === 3 ? '75%' : '100%'}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Overall Rating Preview */}
        {ratings.some(r => r > 0) && (
          <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-white/10 p-6 rounded-2xl text-center" data-testid="overall-rating-card">
            <p className="text-sm text-muted-foreground mb-2">Overall Trust Rating</p>
            <div className="text-5xl font-black font-mono text-primary mb-2" data-testid="overall-percentage">
              {overallPercentage}%
            </div>
            <p className="text-sm text-muted-foreground">{getRatingLabel(avgRating)}</p>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          data-testid="submit-review-button"
          onClick={handleSubmitReview}
          disabled={submitting || ratings.some(r => r === 0)}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl h-14 text-base font-semibold btn-glow"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
}