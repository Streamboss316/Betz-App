import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { ArrowLeft, User, Shield, Trophy, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProfilePage({ user, setUser, onLogout }) {
  const navigate = useNavigate();
  const [name, setName] = useState(user.name);
  const [profilePublic, setProfilePublic] = useState(user.privacy_settings?.profile_public ?? true);
  const [activityPublic, setActivityPublic] = useState(user.privacy_settings?.activity_public ?? true);
  const [loading, setLoading] = useState(false);

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      await axios.put(`${API}/users/profile`, null, {
        params: { name },
        headers: { Authorization: `Bearer ${token}` }
      });

      const userRes = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data);
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrivacy = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      await axios.put(`${API}/users/privacy`, null, {
        params: { profile_public: profilePublic, activity_public: activityPublic },
        headers: { Authorization: `Bearer ${token}` }
      });

      const userRes = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data);
      toast.success('Privacy settings updated');
    } catch (error) {
      toast.error('Failed to update privacy');
    } finally {
      setLoading(false);
    }
  };

  const winRate = user.win_count + user.loss_count > 0
    ? ((user.win_count / (user.win_count + user.loss_count)) * 100).toFixed(1)
    : 0;

  const handleLogout = () => {
    onLogout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full" data-testid="back-button">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold font-heading ml-4" data-testid="profile-title">Profile</h1>
      </header>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="bg-card border-white/10 p-8 rounded-2xl text-center" data-testid="profile-header-card">
          <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/50">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-black font-heading mb-1" data-testid="profile-name">{user.name}</h2>
          <p className="text-accent font-mono font-bold text-lg mb-4" data-testid="profile-betz-id">{user.betz_id}</p>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-muted/30 rounded-xl">
              <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold font-mono text-primary" data-testid="profile-win-count">{user.win_count}</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl">
              <Trophy className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold font-mono text-destructive" data-testid="profile-loss-count">{user.loss_count}</p>
              <p className="text-xs text-muted-foreground">Losses</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl">
              <Trophy className="h-6 w-6 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold font-mono text-accent" data-testid="profile-win-rate">{winRate}%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
          </div>
        </Card>

        {/* Edit Profile */}
        <Card className="bg-card border-white/10 p-6 rounded-2xl" data-testid="edit-profile-card">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-primary" />
            Edit Profile
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                data-testid="name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-input/50 border-white/10 rounded-lg h-12"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={user.email}
                disabled
                className="bg-muted/30 border-white/10 rounded-lg h-12 text-muted-foreground"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={user.phone}
                disabled
                className="bg-muted/30 border-white/10 rounded-lg h-12 text-muted-foreground"
              />
            </div>
            <Button
              data-testid="update-profile-button"
              onClick={handleUpdateProfile}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-full h-12 font-bold"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="bg-card border-white/10 p-6 rounded-2xl" data-testid="privacy-card">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary" />
            Privacy Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-semibold">Public Profile</p>
                <p className="text-sm text-muted-foreground">Others can view your profile</p>
              </div>
              <Switch
                data-testid="profile-public-switch"
                checked={profilePublic}
                onCheckedChange={setProfilePublic}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-semibold">Public Activity</p>
                <p className="text-sm text-muted-foreground">Others can see your bets</p>
              </div>
              <Switch
                data-testid="activity-public-switch"
                checked={activityPublic}
                onCheckedChange={setActivityPublic}
              />
            </div>
            <Button
              data-testid="update-privacy-button"
              onClick={handleUpdatePrivacy}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-full h-12 font-bold"
            >
              {loading ? 'Updating...' : 'Save Privacy Settings'}
            </Button>
          </div>
        </Card>

        {/* Logout */}
        <Card className="bg-card border-white/10 p-6 rounded-2xl" data-testid="logout-card">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <LogOut className="h-5 w-5 mr-2 text-destructive" />
            Sign Out
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of your BETZ account on this device
          </p>
          <Button
            data-testid="logout-button"
            onClick={handleLogout}
            variant="outline"
            className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white rounded-full h-12 font-bold"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sign Out
          </Button>
        </Card>
      </div>
    </div>
  );
}