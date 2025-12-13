import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, User, Shield, Trophy, LogOut, Camera, Upload, X, Play, Star, QrCode, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeShare from '../components/QRCodeShare';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProfilePage({ user, setUser, onLogout }) {
  const navigate = useNavigate();
  const [showQRCode, setShowQRCode] = useState(false);
  const [name, setName] = useState(user.name);
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [racingTeam, setRacingTeam] = useState(user.racing_team || '');
  const [websiteUrl, setWebsiteUrl] = useState(user.website_url || '');
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [carMake, setCarMake] = useState(user.car_make || '');
  const [carModel, setCarModel] = useState(user.car_model || '');
  const [carYear, setCarYear] = useState(user.car_year || '');
  const [carMods, setCarMods] = useState(user.car_mods || '');
  const [instagram, setInstagram] = useState(user.instagram || '');
  const [youtube, setYoutube] = useState(user.youtube || '');
  
  // Privacy settings
  const [profilePublic, setProfilePublic] = useState(user.privacy_settings?.profile_public ?? false);
  const [showGalleryPreview, setShowGalleryPreview] = useState(user.privacy_settings?.show_gallery_preview ?? false);
  const [showContact, setShowContact] = useState(user.privacy_settings?.show_contact ?? false);
  const [showLocation, setShowLocation] = useState(user.privacy_settings?.show_location ?? false);
  const [allowBetRequests, setAllowBetRequests] = useState(user.privacy_settings?.allow_bet_requests ?? true);
  
  const [loading, setLoading] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const avatarInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const headerImageInputRef = useRef(null);

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      await axios.put(`${API}/users/profile`, 
        { 
          name, 
          display_name: displayName,
          racing_team: racingTeam,
          website_url: websiteUrl,
          bio,
          location,
          car_make: carMake,
          car_model: carModel,
          car_year: carYear,
          car_mods: carMods,
          instagram,
          youtube
        },
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
      await axios.put(`${API}/users/profile`, {
        privacy_settings: {
          profile_public: profilePublic,
          show_gallery_preview: showGalleryPreview,
          show_contact: showContact,
          show_location: showLocation,
          allow_bet_requests: allowBetRequests
        }
      }, {
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

  const handleHeaderImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('Header image file:', file.name, file.type, file.size);

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

      console.log('Uploading header image, size:', base64.length);

      try {
        const response = await axios.put(`${API}/users/profile`, 
          { header_image: base64 },
          { headers: { Authorization: `Bearer ${token}` }}
        );

        console.log('Header upload response:', response.data);

        const userRes = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userRes.data);
        toast.success('Header image updated');
      } catch (error) {
        console.error('Header upload error:', error);
        toast.error(error.response?.data?.detail || 'Failed to update header image');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      toast.error('Failed to read image file');
      setLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleGalleryUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/mpeg', 'video/3gpp', 'video/x-m4v'];

    setUploadingMedia(true);

    for (let file of files) {
      const isImage = allowedImageTypes.includes(file.type);
      const isVideo = allowedVideoTypes.includes(file.type);

      if (!isImage && !isVideo) {
        toast.error(`${file.name}: Invalid format. Use JPEG, PNG, GIF, WebP, HEIC for images or MP4, MOV, AVI, WebM, MPEG, 3GP, M4V for videos`);
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
            data: base64,
            mime_type: file.type
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
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        {/* Profile Header with Banner */}
        <Card className="premium-card rounded-2xl overflow-hidden" data-testid="profile-header-card">
          {/* Header Banner Image */}
          <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary via-primary/70 to-accent overflow-hidden">
            {user.header_image ? (
              <img 
                src={user.header_image} 
                alt="Header" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full relative">
                {/* Racing Theme Pattern Background */}
                <div className="absolute inset-0 opacity-20">
                  {/* Checkered flag pattern */}
                  <div className="grid grid-cols-12 h-full">
                    {[...Array(48)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`${(Math.floor(i / 12) + (i % 12)) % 2 === 0 ? 'bg-white' : 'bg-transparent'}`}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Racing stripes */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <div className="w-full h-1 bg-accent transform -skew-y-12"></div>
                  <div className="w-full h-2 bg-accent/60 transform -skew-y-12 ml-8"></div>
                </div>
                
                {/* Center text and icon */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Trophy className="h-12 w-12 text-accent mb-3 animate-pulse" />
                  <p className="text-lg font-bold text-white/90">Racing Profile</p>
                  <p className="text-sm text-white/60">Click "Edit Header" to add your image</p>
                </div>
              </div>
            )}
            
            {/* Edit Header Image Button */}
            <input
              ref={headerImageInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic"
              onChange={handleHeaderImageChange}
              className="hidden"
              data-testid="header-image-upload-input"
            />
            <Button
              onClick={() => headerImageInputRef.current?.click()}
              className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur-sm z-10 pointer-events-auto"
              data-testid="change-header-button"
            >
              <Camera className="h-4 w-4 mr-2" />
              Edit Header
            </Button>
          </div>

          {/* Profile Info Section */}
          <div className="relative px-6 pb-6">
            {/* Avatar overlapping the header */}
            <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-16 md:-mt-20">
              <div className="relative">
                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-card">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="btn-premium text-white text-4xl md:text-5xl font-bold">
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
                  className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
                  data-testid="change-avatar-button"
                >
                  <Camera className="h-5 w-5" />
                </Button>
              </div>

              {/* Name and info next to avatar on desktop */}
              <div className="flex-1 md:mb-4 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-black font-heading mb-1 flex items-center justify-center md:justify-start gap-2" data-testid="profile-name">
                  {user.name}
                  {user.trust_score > 0 && (
                    <Badge className="h-5 px-2 text-xs bg-accent/20 text-accent border border-accent/50 flex items-center gap-1" data-testid="profile-trust-score">
                      <Star className="h-3 w-3 fill-accent" />
                      {user.trust_score}%
                    </Badge>
                  )}
                </h2>
                {user.display_name && (
                  <p className="text-primary font-semibold text-lg" data-testid="profile-display-name">"{user.display_name}"</p>
                )}
                {user.racing_team && (
                  <p className="text-sm text-muted-foreground" data-testid="profile-racing-team">
                    <Shield className="h-3 w-3 inline mr-1" />
                    {user.racing_team}
                  </p>
                )}
                <p className="text-accent font-mono font-bold text-lg mb-1" data-testid="profile-betz-id">{user.betz_id}</p>
                {user.location && (
                  <p className="text-sm text-muted-foreground mb-1" data-testid="profile-location">
                    📍 {user.location}
                  </p>
                )}
                {user.website_url && (
                  <a 
                    href={user.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline block mb-1"
                    data-testid="profile-website"
                  >
                    🔗 {user.website_url}
                  </a>
                )}
                {(user.instagram || user.youtube) && (
                  <div className="flex gap-2 justify-center md:justify-start mt-2">
                    {user.instagram && (
                      <a
                        href={`https://instagram.com/${user.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full hover:opacity-80"
                        data-testid="profile-instagram"
                      >
                        📷 {user.instagram}
                      </a>
                    )}
                    {user.youtube && (
                      <a
                        href={`https://youtube.com/${user.youtube.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded-full hover:opacity-80"
                        data-testid="profile-youtube"
                      >
                        ▶️ {user.youtube}
                      </a>
                    )}
                  </div>
                )}

                {/* Share Profile Button */}
                <Button
                  onClick={() => setShowQRCode(true)}
                  variant="outline"
                  className="mt-3 rounded-full border-primary/50 text-primary hover:bg-primary/10"
                  data-testid="share-profile-button"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Share Profile
                </Button>
              </div>
            </div>
          
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-5 mt-6">
              <div className="p-4 bg-muted/30 rounded-xl text-center">
                <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold font-mono text-primary" data-testid="profile-win-count">{user.win_count}</p>
                <p className="text-xs text-muted-foreground">Wins</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl text-center">
                <Trophy className="h-6 w-6 text-destructive mx-auto mb-2" />
                <p className="text-2xl font-bold font-mono text-destructive" data-testid="profile-loss-count">{user.loss_count}</p>
                <p className="text-xs text-muted-foreground">Losses</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl text-center">
                <Trophy className="h-6 w-6 text-accent mx-auto mb-2" />
                <p className="text-2xl font-bold font-mono text-accent" data-testid="profile-win-rate">{winRate}%</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
            </div>

            {/* Bio Section */}
            {user.bio && (
              <div className="mt-6 p-4 bg-muted/30 rounded-xl" data-testid="profile-bio-section">
                <h4 className="font-semibold text-sm mb-2 text-primary">About</h4>
                <p className="text-sm text-foreground leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Car Details Section */}
            {(user.car_make || user.car_model) && (
              <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-xl" data-testid="profile-car-section">
                <h4 className="font-semibold text-sm mb-3 text-primary flex items-center gap-2">
                  🏎️ Car Details
                </h4>
                <div className="space-y-2">
                  {(user.car_make || user.car_model || user.car_year) && (
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {user.car_year && `${user.car_year} `}
                        {user.car_make && `${user.car_make} `}
                        {user.car_model}
                      </p>
                    </div>
                  )}
                  {user.car_mods && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Modifications:</p>
                      <p className="text-sm text-foreground">{user.car_mods}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Edit Profile */}
        <Card className="premium-card p-6 rounded-2xl" data-testid="edit-profile-card">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-primary" />
            Edit Profile
          </h3>
          <div className="space-y-5">
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
              <Label htmlFor="display-name">Display Name (Optional)</Label>
              <Input
                id="display-name"
                data-testid="display-name-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Speed Racer"
                className="bg-input/50 border-white/10 rounded-lg h-12"
              />
            </div>
            <div>
              <Label htmlFor="racing-team">Racing Team (Optional)</Label>
              <Input
                id="racing-team"
                data-testid="racing-team-input"
                value={racingTeam}
                onChange={(e) => setRacingTeam(e.target.value)}
                placeholder="e.g., Lightning Racing Team"
                className="bg-input/50 border-white/10 rounded-lg h-12"
              />
            </div>
            <div>
              <Label htmlFor="website">Website URL (Optional)</Label>
              <Input
                id="website"
                data-testid="website-input"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="bg-input/50 border-white/10 rounded-lg h-12"
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio (Optional)</Label>
              <textarea
                id="bio"
                data-testid="bio-input"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about your racing journey..."
                className="w-full bg-input/50 border border-white/10 rounded-lg p-3 min-h-[100px] text-foreground placeholder:text-muted-foreground resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">{bio.length}/500 characters</p>
            </div>
            <div>
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                data-testid="location-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Los Angeles, CA"
                className="bg-input/50 border-white/10 rounded-lg h-12"
              />
            </div>
            
            {/* Car Details Section */}
            <div className="pt-4 border-t border-white/10">
              <h4 className="font-semibold text-sm mb-3 text-primary">Car Details (Optional)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="car-make">Make</Label>
                  <Input
                    id="car-make"
                    data-testid="car-make-input"
                    value={carMake}
                    onChange={(e) => setCarMake(e.target.value)}
                    placeholder="e.g., Nissan"
                    className="bg-input/50 border-white/10 rounded-lg h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="car-model">Model</Label>
                  <Input
                    id="car-model"
                    data-testid="car-model-input"
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    placeholder="e.g., GT-R"
                    className="bg-input/50 border-white/10 rounded-lg h-12"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="car-year">Year</Label>
                <Input
                  id="car-year"
                  data-testid="car-year-input"
                  value={carYear}
                  onChange={(e) => setCarYear(e.target.value)}
                  placeholder="e.g., 2023"
                  className="bg-input/50 border-white/10 rounded-lg h-12"
                />
              </div>
              <div className="mt-3">
                <Label htmlFor="car-mods">Modifications</Label>
                <textarea
                  id="car-mods"
                  data-testid="car-mods-input"
                  value={carMods}
                  onChange={(e) => setCarMods(e.target.value)}
                  placeholder="List your car modifications..."
                  className="w-full bg-input/50 border border-white/10 rounded-lg p-3 min-h-[80px] text-foreground placeholder:text-muted-foreground resize-none"
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground mt-1">{carMods.length}/300 characters</p>
              </div>
            </div>

            {/* Social Links Section */}
            <div className="pt-4 border-t border-white/10">
              <h4 className="font-semibold text-sm mb-3 text-primary">Social Links (Optional)</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    data-testid="instagram-input"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@yourusername"
                    className="bg-input/50 border-white/10 rounded-lg h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    data-testid="youtube-input"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="@yourchannel"
                    className="bg-input/50 border-white/10 rounded-lg h-12"
                  />
                </div>
              </div>
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
              className="w-full btn-premium text-white rounded-full h-12 font-bold"
            >
              {loading ? 'Processing...' : 'Update Profile'}
            </Button>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="premium-card p-6 rounded-2xl" data-testid="privacy-card">
          <h3 className="text-lg font-bold mb-5 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary" />
            Privacy Settings
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Control what contacts can see on your profile</p>
          <div className="space-y-3">
            {/* Friends View Full Profile */}
            <div className="flex items-center justify-between py-2">
              <p className="font-medium text-sm text-foreground">Allow contacts to view full profile</p>
              <button
                onClick={() => setProfilePublic(!profilePublic)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  profilePublic 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                data-testid="profile-public-toggle"
              >
                {profilePublic ? 'YES' : 'NO'}
              </button>
            </div>

            {/* Gallery Preview */}
            <div className="flex items-center justify-between py-2">
              <p className="font-medium text-sm text-foreground">Show gallery preview (3 photos) to contacts</p>
              <button
                onClick={() => setShowGalleryPreview(!showGalleryPreview)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  showGalleryPreview 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                data-testid="gallery-preview-toggle"
              >
                {showGalleryPreview ? 'YES' : 'NO'}
              </button>
            </div>

            {/* Contact Info */}
            <div className="flex items-center justify-between py-2">
              <p className="font-medium text-sm text-foreground">Show contact info (email & phone) to contacts</p>
              <button
                onClick={() => setShowContact(!showContact)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  showContact 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                data-testid="show-contact-toggle"
              >
                {showContact ? 'YES' : 'NO'}
              </button>
            </div>

            {/* Location */}
            <div className="flex items-center justify-between py-2">
              <p className="font-medium text-sm text-foreground">Show location to contacts</p>
              <button
                onClick={() => setShowLocation(!showLocation)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  showLocation 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                data-testid="show-location-toggle"
              >
                {showLocation ? 'YES' : 'NO'}
              </button>
            </div>

            {/* Bet Requests */}
            <div className="flex items-center justify-between py-2">
              <p className="font-medium text-sm text-foreground">Allow others to send bet requests</p>
              <button
                onClick={() => setAllowBetRequests(!allowBetRequests)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  allowBetRequests 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                data-testid="allow-bet-requests-toggle"
              >
                {allowBetRequests ? 'YES' : 'NO'}
              </button>
            </div>

            <Button
              data-testid="update-privacy-button"
              onClick={handleUpdatePrivacy}
              disabled={loading}
              className="w-full btn-premium text-white rounded-xl h-12 font-semibold mt-2"
            >
              {loading ? 'Processing...' : 'Save Privacy Settings'}
            </Button>

            {/* Re-watch Tutorial */}
            <Button
              onClick={() => {
                localStorage.removeItem('onboarding_completed');
                window.location.reload();
              }}
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground rounded-xl h-10 mt-2"
              data-testid="rewatch-tutorial-button"
            >
              Re-watch Tutorial
            </Button>
          </div>
        </Card>

        {/* Gallery */}
        <Card className="premium-card p-6 rounded-2xl" data-testid="gallery-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center">
              <Upload className="h-5 w-5 mr-2 text-primary" />
              Media Gallery
            </h3>
            <div>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleGalleryUpload}
                className="hidden"
                data-testid="gallery-upload-input"
              />
              <Button
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingMedia}
                size="sm"
                className="btn-premium text-white rounded-full"
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
              <p className="text-muted-foreground">MP4, MOV, AVI, WebM, MPEG, 3GP, M4V • Max 50MB per video</p>
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
                    <div className="relative w-full h-full bg-black">
                      <video
                        className="w-full h-full object-contain cursor-pointer"
                        controls
                        controlsList="nodownload"
                        preload="metadata"
                        playsInline
                        onError={(e) => {
                          console.error('Video error:', e, item);
                          toast.error('Video format may not be supported by your browser');
                        }}
                      >
                        <source src={item.data} type={item.mime_type || 'video/mp4'} />
                        {item.mime_type === 'video/quicktime' && <source src={item.data} type="video/mp4" />}
                        Your browser does not support the video tag or this video format.
                      </video>
                      <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs">
                        <Play className="h-3 w-3 inline mr-1" />
                        {item.mime_type?.split('/')[1]?.toUpperCase() || 'VIDEO'}
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
        <Card className="premium-card p-6 rounded-2xl border-white/5" data-testid="logout-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted/30 rounded-lg">
                <LogOut className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Sign Out</h3>
                <p className="text-xs text-muted-foreground">End your current session</p>
              </div>
            </div>
          </div>
          <Button
            data-testid="logout-button"
            onClick={handleLogout}
            variant="ghost"
            className="w-full bg-muted/20 hover:bg-red-500/20 text-red-500 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-xl h-11 font-medium transition-all duration-200"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </Card>
      </div>

      {/* QR Code Share Modal */}
      <QRCodeShare
        user={user}
        type="profile"
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
      />
    </div>
  );
}