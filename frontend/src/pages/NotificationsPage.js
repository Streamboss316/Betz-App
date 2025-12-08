import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function NotificationsPage({ user }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load notifications');
      setLoading(false);
    }
  };

  const handleMarkRead = async (notificationId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const handleNotificationClick = (notification) => {
    handleMarkRead(notification.notification_id);
    
    if (notification.bet_id) {
      navigate(`/bets/${notification.bet_id}`);
    }
  };

  const getNotificationIcon = (type) => {
    return <Bell className="h-5 w-5 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full" data-testid="back-button">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold font-heading ml-4" data-testid="notifications-title">Notifications</h1>
      </header>

      <div className="p-6 max-w-2xl mx-auto">
        {loading ? (
          <p className="text-muted-foreground text-center">Loading...</p>
        ) : notifications.length === 0 ? (
          <Card className="bg-card border-white/10 p-8 rounded-2xl text-center">
            <BellOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </Card>
        ) : (
          <div className="space-y-3" data-testid="notifications-list">
            {notifications.map((notif) => (
              <Card
                key={notif.notification_id}
                data-testid={`notification-${notif.notification_id}`}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  notif.read
                    ? 'bg-card border-white/10'
                    : 'bg-primary/10 border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      notif.read ? 'text-muted-foreground' : 'text-foreground'
                    }`}>
                      {notif.content}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}