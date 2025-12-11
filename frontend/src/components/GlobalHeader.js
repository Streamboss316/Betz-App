import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Bell, Users, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function GlobalHeader({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotificationCount();
      // Poll every 10 seconds
      const interval = setInterval(loadNotificationCount, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotificationCount = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const unreadCount = res.data.filter(n => !n.read).length;
      setNotificationCount(unreadCount);
    } catch (error) {
      console.error('Failed to load notifications');
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  // Don't show on auth page
  if (location.pathname === '/auth' || !user) {
    return null;
  }

  // Show back button on all pages except home
  const showBackButton = location.pathname !== '/';

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleExitDemoMode = () => {
    const adminToken = localStorage.getItem('admin_return_token');
    if (adminToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('demo_mode_active');
      localStorage.setItem('admin_token', adminToken);
      localStorage.removeItem('admin_return_token');
      window.location.href = '/admin/demo-mode';
    }
  };

  const isDemoMode = localStorage.getItem('demo_mode_active') === 'true';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack} 
            className="rounded-full"
            data-testid="global-back-button"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        )}
        <h1 
          className="text-2xl font-bold tracking-tight text-white cursor-pointer hover:text-primary transition-colors" 
          onClick={() => navigate('/')}
          data-testid="global-header-title"
        >
          BETZ
        </h1>
        {isDemoMode && (
          <Badge className="bg-accent/20 text-accent border-accent/50 animate-pulse">
            DEMO MODE
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isDemoMode && (
          <Button
            variant="outline"
            onClick={handleExitDemoMode}
            className="border-accent/50 text-accent hover:bg-accent/10 rounded-full text-xs"
            data-testid="exit-demo-button"
          >
            Exit Demo
          </Button>
        )}

        {/* Public Chat */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full relative" 
          onClick={() => navigate('/public-chat')}
          data-testid="global-public-chat-icon"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full relative" 
          onClick={() => navigate('/notifications')}
          data-testid="global-notifications-icon"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground">
              {notificationCount > 9 ? '9+' : notificationCount}
            </Badge>
          )}
        </Button>

        {/* Profile */}
        <Avatar 
          className="h-10 w-10 cursor-pointer border-2 border-primary/50 hover:border-primary transition-all" 
          onClick={() => navigate('/profile')}
          data-testid="global-profile-avatar"
        >
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
