import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Lock, Trophy, Upload, Play, DollarSign, Users } from 'lucide-react';
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
          {profile.display_name && (
            <p className="text-primary font-semibold text-lg" data-testid="profile-display-name">"{profile.display_name}"</p>
          )}
          {profile.racing_team && !profile.is_private && (
            <p className="text-sm text-muted-foreground mb-2" data-testid="profile-racing-team">
              🏁 {profile.racing_team}
            </p>
          )}
          <p className="text-accent font-mono font-semibold text-lg mb-4" data-testid="profile-betz-id">{profile.betz_id}</p>
          
          {profile.are_friends && (
            <Badge className="bg-primary/20 text-primary mb-4">Friend</Badge>
          )}
          {profile.trust_score > 0 && !profile.is_private && (
            <Badge className="bg-accent/20 text-accent border border-accent/50 mb-4">
              ⭐ {profile.trust_score}% Trust Score
            </Badge>
          )}

          {profile.is_private ? (
            <>
            {/* Basic Info - Always Visible for Private Profiles */}
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

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <Button
                onClick={() => navigate(`/place-bet?opponent=${profile.user_id}`)}
                className="w-full bg-primary text-primary-foreground rounded-full h-12 font-bold"
                data-testid="send-bet-button"
                disabled={!profile.can_send_bet}
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Send Bet Request
              </Button>
            </div>

            {/* Privacy Notice */}
            <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-destructive mb-1">Private Profile</p>
                  <p className="text-sm text-muted-foreground">
                    This user's profile is set to private. Add them as a friend to view their full profile, bio, car details, and complete media gallery.
                  </p>
                </div>
              </div>
            </div>
            </>
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

              {/* Location & Social Links */}
              <div className="mt-6 text-center">
                {profile.location && profile.privacy_settings?.show_location !== false && (
                  <p className="text-sm text-muted-foreground mb-2" data-testid="profile-location">
                    📍 {profile.location}
                  </p>
                )}
                {profile.website_url && (
                  <a 
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline block mb-2"
                    data-testid="profile-website"
                  >
                    🔗 {profile.website_url}
                  </a>
                )}
                {(profile.instagram || profile.youtube) && (
                  <div className="flex gap-2 justify-center mt-2">
                    {profile.instagram && (
                      <a
                        href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full hover:opacity-80"
                        data-testid="profile-instagram"
                      >
                        📷 {profile.instagram}
                      </a>
                    )}
                    {profile.youtube && (
                      <a
                        href={`https://youtube.com/${profile.youtube.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded-full hover:opacity-80"
                        data-testid="profile-youtube"
                      >
                        ▶️ {profile.youtube}
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Bio Section */}
              {profile.bio && (
                <div className="mt-6 p-4 bg-muted/30 rounded-xl text-left" data-testid="profile-bio-section">
                  <h4 className="font-semibold text-sm mb-2 text-primary">About</h4>
                  <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Car Details Section */}
              {(profile.car_make || profile.car_model) && (
                <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-xl text-left" data-testid="profile-car-section">
                  <h4 className="font-semibold text-sm mb-3 text-primary flex items-center gap-2">
                    🏎️ Car Details
                  </h4>
                  <div className="space-y-2">
                    {(profile.car_make || profile.car_model || profile.car_year) && (
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          {profile.car_year && `${profile.car_year} `}
                          {profile.car_make && `${profile.car_make} `}
                          {profile.car_model}
                        </p>
                      </div>
                    )}
                    {profile.car_mods && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-1">Modifications:</p>
                        <p className="text-sm text-foreground">{profile.car_mods}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Send Bet Button */}
              <Button
                onClick={() => navigate(`/place-bet?opponent=${profile.user_id}`)}
                className="w-full mt-6 bg-primary text-primary-foreground rounded-full h-12 font-bold"
                data-testid="send-bet-button"
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Send Bet Request
              </Button>
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
