import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { X, Bell, MessageCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function NotificationBubble({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [bubble, setBubble] = useState(null);
  const [lastNotificationId, setLastNotificationId] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const checkForNewNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const unreadNotifications = res.data.filter(n => !n.read);
      
      if (unreadNotifications.length > 0) {
        const latestNotification = unreadNotifications[0];
        
        // Only show bubble for new notifications we haven't seen
        if (latestNotification.notification_id !== lastNotificationId) {
          setLastNotificationId(latestNotification.notification_id);
          
          // Show bubble for important notification types
          const importantTypes = ['winner_declared', 'bet_received', 'bet_request', 'bet_accepted', 'punk_out_claimed', 'dp_request'];
          if (importantTypes.includes(latestNotification.type)) {
            setBubble(latestNotification);
            setIsVisible(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check notifications');
    }
  }, [lastNotificationId]);

  useEffect(() => {
    if (user) {
      // Check immediately
      checkForNewNotifications();
      
      // Poll every 5 seconds for new notifications
      const interval = setInterval(checkForNewNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [user, checkForNewNotifications]);

  const handleBubbleClick = () => {
    setIsVisible(false);
    setBubble(null);
    navigate('/notifications');
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsVisible(false);
    setBubble(null);
  };

  // Don't show on auth page or notifications page
  if (!bubble || !isVisible || location.pathname === '/auth' || location.pathname === '/notifications') {
    return null;
  }

  // Truncate message for bubble
  const truncateMessage = (msg, maxLength = 50) => {
    if (msg.length <= maxLength) return msg;
    return msg.substring(0, maxLength) + '...';
  };

  return (
    <div 
      className="fixed bottom-24 right-4 z-[100] animate-bounce-in cursor-pointer"
      onClick={handleBubbleClick}
      data-testid="notification-bubble"
    >
      {/* Floating Bubble */}
      <div className="relative">
        {/* Main Bubble */}
        <div className="bg-primary shadow-2xl rounded-2xl p-4 max-w-[280px] border border-primary/50 hover:scale-105 transition-transform">
          {/* Close button */}
          <button 
            onClick={handleDismiss}
            className="absolute -top-2 -right-2 bg-card border border-border rounded-full p-1 hover:bg-muted transition-colors shadow-lg"
            data-testid="dismiss-bubble"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
          
          {/* Content */}
          <div className="flex items-start gap-3">
            {/* Bell Icon with pulse */}
            <div className="flex-shrink-0 relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bell className="h-5 w-5 text-white" />
              </div>
              {/* Pulse indicator */}
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-[10px] text-white font-bold">!</span>
              </span>
            </div>
            
            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">
                {truncateMessage(bubble.content)}
              </p>
              <p className="text-xs text-white/70 mt-1 font-medium">
                Tap to view →
              </p>
            </div>
          </div>
        </div>
        
        {/* Speech bubble tail */}
        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-primary transform rotate-45 border-r border-b border-primary/50"></div>
      </div>
    </div>
  );
}
