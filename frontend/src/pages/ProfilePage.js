import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { ArrowLeft, User, Shield, Trophy, LogOut, Camera, Upload, X, Play } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProfilePage({ user, setUser, onLogout }) {
  const navigate = useNavigate();
  const [name, setName] = useState(user.name);
  const [profilePublic, setProfilePublic] = useState(user.privacy_settings?.profile_public ?? true);
  const [activityPublic, setActivityPublic] = useState(user.privacy_settings?.activity_public ?? true);
  const [loading, setLoading] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const avatarInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      await axios.put(`${API}/users/profile`, 
        { name },
        { headers: { Authorization: `Bearer ${token}` }}
      );

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

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/users/gallery`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGallery(res.data);
    } catch (error) {
      console.error('Failed to load gallery');
    }
  };

  const winRate = user.win_count + user.loss_count > 0
    ? ((user.win_count / (user.win_count + user.loss_count)) * 100).toFixed(1)
    : 0;

  const handleLogout = () => {
    onLogout();
    navigate('/auth');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid image format. Please use: JPEG, PNG, GIF, WebP, or HEIC');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const base64 = event.target.result;
      const token = localStorage.getItem('token');

      try {
        await axios.put(`${API}/users/profile`, 
          { avatar: base64 },
          { headers: { Authorization: `Bearer ${token}` }}
        );

        const userRes = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userRes.data);
        toast.success('Profile picture updated');
      } catch (error) {
        toast.error('Failed to update profile picture');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleGalleryUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/mpeg'];

    setUploadingMedia(true);

    for (let file of files) {
      const isImage = allowedImageTypes.includes(file.type);
      const isVideo = allowedVideoTypes.includes(file.type);

      if (!isImage && !isVideo) {
        toast.error(`${file.name}: Invalid format. Use JPEG, PNG, GIF, WebP, HEIC for images or MP4, MOV, AVI, WebM, MPEG for videos`);
        continue;
      }

      if (isImage && file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB for images)`);
        continue;
      }

      if (isVideo && file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 50MB for videos)`);
        continue;
      }

      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const base64 = event.target.result;
        const token = localStorage.getItem('token');

        try {
          await axios.post(`${API}/users/gallery/upload`, {
            type: isImage ? 'image' : 'video',
            data: base64
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          toast.success(`${file.name} uploaded successfully`);
          loadGallery();
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
        }
      };

      reader.readAsDataURL(file);
    }

    setUploadingMedia(false);
  };

  const handleDeleteGalleryItem = async (itemId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/users/gallery/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted from gallery');
      loadGallery();
    } catch (error) {
      toast.error('Failed to delete');
    }
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
          <div className="relative inline-block mb-4">
            <Avatar className="h-24 w-24 border-4 border-primary/50">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic"
              onChange={handleAvatarChange}
              className="hidden"
              data-testid="avatar-upload-input"
            />
            <Button
              size="icon"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
              data-testid="change-avatar-button"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
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

        {/* Gallery */}
        <Card className="bg-card border-white/10 p-6 rounded-2xl" data-testid="gallery-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center">
              <Upload className="h-5 w-5 mr-2 text-primary" />
              Media Gallery
            </h3>
            <div>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,video/mp4,video/quicktime,video/x-msvideo,video/webm,video/mpeg"
                multiple
                onChange={handleGalleryUpload}
                className="hidden"
                data-testid="gallery-upload-input"
              />
              <Button
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingMedia}
                size="sm"
                className="bg-primary text-primary-foreground rounded-full"
                data-testid="upload-media-button"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingMedia ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>

          <div className="mb-4 p-3 bg-muted/30 rounded-lg text-xs space-y-2">
            <div>
              <p className="font-semibold text-foreground mb-1">Allowed Image Formats:</p>
              <p className="text-muted-foreground">JPEG, JPG, PNG, GIF, WebP, HEIC • Max 10MB per image</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Allowed Video Formats:</p>
              <p className="text-muted-foreground">MP4, MOV, AVI, WebM, MPEG • Max 50MB per video</p>
            </div>
          </div>

          {gallery.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">No media yet. Upload photos or videos!</p>
              <p className="text-xs text-muted-foreground mt-1">Click the Upload button above to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3" data-testid="gallery-grid">
              {gallery.map((item) => (
                <div key={item.item_id} className="relative group aspect-square rounded-xl overflow-hidden bg-muted" data-testid={`gallery-item-${item.item_id}`}>
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
                  <Button
                    size="icon"
                    onClick={() => handleDeleteGalleryItem(item.item_id)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive/90 hover:bg-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`delete-${item.item_id}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
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