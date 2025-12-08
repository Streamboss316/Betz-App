import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Lock, Trophy, Upload, Play } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ViewUserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/users/${userId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load profile');
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const winRate = profile?.win_count + profile?.loss_count > 0
    ? ((profile.win_count / (profile.win_count + profile.loss_count)) * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl font-heading">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-destructive text-2xl font-heading">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-border/50 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full" data-testid="back-button">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4" data-testid="profile-title">
          {profile.is_private ? 'Private Profile' : `${profile.name}'s Profile`}
        </h1>
      </header>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="bg-card border-white/10 p-8 rounded-2xl text-center" data-testid="profile-header-card">
          <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/50">
            <AvatarImage src={profile.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold mb-1" data-testid="profile-name">{profile.name}</h2>
          <p className="text-accent font-mono font-semibold text-lg mb-4" data-testid="profile-betz-id">{profile.betz_id}</p>
          
          {profile.are_friends && (
            <Badge className="bg-primary/20 text-primary mb-4">Friend</Badge>
          )}

          {profile.is_private ? (
            <div className="mt-6 p-6 bg-muted/30 rounded-xl">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground font-semibold mb-2">This Profile is Private</p>
              <p className="text-sm text-muted-foreground">
                {profile.are_friends 
                  ? 'Add this user as a friend to view their full profile'
                  : 'This user has set their profile to private'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-muted/30 rounded-xl">
                  <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold font-mono text-primary" data-testid="profile-win-count">{profile.win_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Wins</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <Trophy className="h-6 w-6 text-destructive mx-auto mb-2" />
                  <p className="text-2xl font-bold font-mono text-destructive" data-testid="profile-loss-count">{profile.loss_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Losses</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <Trophy className="h-6 w-6 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold font-mono text-accent" data-testid="profile-win-rate">{winRate}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
              </div>

              {profile.balance !== undefined && (
                <div className="mt-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">Balance</p>
                  <p className="text-3xl font-bold font-mono text-primary">${profile.balance.toFixed(2)}</p>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Gallery */}
        {!profile.is_private && profile.gallery && profile.gallery.length > 0 && (
          <Card className="bg-card border-white/10 p-6 rounded-2xl" data-testid="gallery-card">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-primary" />
              Media Gallery
            </h3>

            <div className="grid grid-cols-3 gap-3" data-testid="gallery-grid">
              {profile.gallery.map((item) => (
                <div key={item.item_id} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  {item.type === 'image' ? (
                    <img
                      src={item.data}
                      alt="Gallery item"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <video
                        src={item.data}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {profile.is_private && !profile.are_friends && (
          <Card className="bg-card border-white/10 p-6 rounded-2xl text-center">
            <p className="text-muted-foreground mb-4">Want to see more?</p>
            <Button
              onClick={() => navigate('/friends')}
              className="bg-primary text-primary-foreground rounded-full"
            >
              Add Friend
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
