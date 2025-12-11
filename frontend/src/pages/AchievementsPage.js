import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Trophy, Lock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AchievementsPage({ user }) {
  const navigate = useNavigate();
  const [allAchievements, setAllAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    const token = localStorage.getItem('token');
    try {
      // Load all possible achievements
      const allRes = await axios.get(`${API}/achievements`);
      
      // Load user's earned achievements
      const userRes = await axios.get(`${API}/users/me/achievements`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAllAchievements(allRes.data);
      setUserAchievements(userRes.data.earned.map(a => a.achievement_id));
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load achievements');
      setLoading(false);
    }
  };

  const isEarned = (achievementId) => {
    return userAchievements.includes(achievementId);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full" data-testid="back-button">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold font-heading ml-4" data-testid="achievements-title">Achievements</h1>
        <Badge className="ml-auto bg-primary/20 text-primary">
          <Trophy className="h-3 w-3 mr-1" />
          {userAchievements.length} / {allAchievements.length}
        </Badge>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Progress Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Your Progress</h2>
              <p className="text-sm text-muted-foreground">Keep racing to unlock more!</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black font-mono text-primary">
                {Math.round((userAchievements.length / allAchievements.length) * 100)}%
              </p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
          
          <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-500"
              style={{ width: `${(userAchievements.length / allAchievements.length) * 100}%` }}
            />
          </div>
        </Card>

        {/* Achievements Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading achievements...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {allAchievements.map((achievement) => {
              const earned = isEarned(achievement.achievement_id);
              return (
                <Card
                  key={achievement.achievement_id}
                  className={`p-6 rounded-2xl transition-all ${
                    earned
                      ? 'bg-gradient-to-br from-primary/20 to-accent/20 border-primary/50'
                      : 'bg-card/50 border-white/10 opacity-60'
                  }`}
                  data-testid={`achievement-${achievement.achievement_id}`}
                >
                  <div className="flex items-start gap-5">
                    <div className={`text-5xl ${earned ? 'animate-pulse' : 'grayscale opacity-40'}`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{achievement.name}</h3>
                        {earned ? (
                          <Badge className="bg-primary/30 text-primary text-xs">
                            ✓ Unlocked
                          </Badge>
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Motivational Message */}
        {userAchievements.length < allAchievements.length && (
          <Card className="bg-accent/10 border-accent/30 p-6 rounded-2xl text-center">
            <Trophy className="h-12 w-12 text-accent mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Keep Racing!</h3>
            <p className="text-sm text-muted-foreground">
              {allAchievements.length - userAchievements.length} achievements left to unlock. 
              Win more bets, build your reputation, and dominate the track!
            </p>
          </Card>
        )}

        {userAchievements.length === allAchievements.length && (
          <Card className="bg-gradient-to-br from-primary to-accent p-8 rounded-2xl text-center">
            <div className="text-6xl mb-4">🏆👑🎉</div>
            <h3 className="font-black text-2xl mb-2">LEGEND STATUS!</h3>
            <p className="text-sm">
              You've unlocked ALL achievements! You're a true BETZ champion!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
