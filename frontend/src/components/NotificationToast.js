import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { X, Bell, Trophy, AlertCircle, UserCheck, DollarSign } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function NotificationToast({ user }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [lastNotificationId, setLastNotificationId] = useState(null);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'winner_declared':
      case 'bet_won':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'bet_lost':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'friend_request':
      case 'friend_accepted':
        return <UserCheck className="h-5 w-5 text-blue-500" />;
      case 'bet_received':
      case 'bet_request':
      case 'bet_accepted':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

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
        
        // Only show toast for new notifications we haven't seen
        if (latestNotification.notification_id !== lastNotificationId) {
          setLastNotificationId(latestNotification.notification_id);
          
          // Show toast for important notification types
          const importantTypes = ['winner_declared', 'bet_received', 'bet_request', 'bet_accepted', 'punk_out_claimed', 'dp_request'];
          if (importantTypes.includes(latestNotification.type)) {
            setToast(latestNotification);
            
            // Auto-hide after 8 seconds
            setTimeout(() => {
              setToast(null);
            }, 8000);
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

  const handleToastClick = () => {
    setToast(null);
    navigate('/notifications');
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setToast(null);
  };

  if (!toast) return null;

  return (
    <div 
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down cursor-pointer"
      onClick={handleToastClick}
      data-testid="notification-toast"
    >
      <div className="bg-card border border-primary/30 rounded-2xl shadow-2xl p-4 max-w-sm mx-4 flex items-start gap-3 hover:border-primary/50 transition-all">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          {getNotificationIcon(toast.type)}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground line-clamp-2">
            {toast.content}
          </p>
          <p className="text-xs text-primary mt-1 font-medium">
            Tap to view details →
          </p>
        </div>
        
        {/* Dismiss button */}
        <button 
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-muted rounded-full transition-colors"
          data-testid="dismiss-toast"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
