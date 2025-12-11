import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, Bell, BellOff, Shield, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function NotificationsPage({ user }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDPDialog, setShowDPDialog] = useState(false);
  const [selectedDPNotif, setSelectedDPNotif] = useState(null);
  const [dpProcessing, setDpProcessing] = useState(false);
  const [betDetails, setBetDetails] = useState(null);
  const [loadingBet, setLoadingBet] = useState(false);

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

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation(); // Prevent triggering notification click
    
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state immediately
      setNotifications(notifications.filter(n => n.notification_id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = async (notification) => {
    handleMarkRead(notification.notification_id);
    
    // Handle DP request specially with popup
    if (notification.type === 'dp_request') {
      setSelectedDPNotif(notification);
      setShowDPDialog(true);
      
      // Load bet details to show stipulation
      if (notification.bet_id) {
        await loadBetDetails(notification.bet_id);
      }
      return;
    }
    
    if (notification.bet_id) {
      navigate(`/bets/${notification.bet_id}`);
    }
  };

  const loadBetDetails = async (betId) => {
    setLoadingBet(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await axios.get(`${API}/bets/${betId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBetDetails(res.data);
    } catch (error) {
      toast.error('Failed to load bet details');
    } finally {
      setLoadingBet(false);
    }
  };

  const handleAcceptDP = async () => {
    if (!selectedDPNotif) return;
    
    setDpProcessing(true);
    const token = localStorage.getItem('token');
    
    try {
      await axios.put(`${API}/bets/${selectedDPNotif.bet_id}/dp/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('You accepted the DP role!');
      setShowDPDialog(false);
      loadNotifications();
      
      // Navigate to DP Dashboard
      navigate('/dp-dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept DP role');
    } finally {
      setDpProcessing(false);
    }
  };

  const handleDeclineDP = async () => {
    if (!selectedDPNotif) return;
    
    setDpProcessing(true);
    const token = localStorage.getItem('token');
    
    try {
      await axios.put(`${API}/bets/${selectedDPNotif.bet_id}/dp/decline`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('DP role declined');
      setShowDPDialog(false);
      loadNotifications();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to decline DP role');
    } finally {
      setDpProcessing(false);
    }
  };

  const getNotificationIcon = (type) => {
    if (type === 'dp_request') {
      return <Shield className="h-5 w-5 text-destructive" />;
    }
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
          <Card className="premium-card p-8 rounded-2xl text-center">
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
                  notif.type === 'dp_request' 
                    ? 'bg-destructive/10 border-destructive/50 hover:bg-destructive/20'
                    : notif.read
                    ? 'premium-card'
                    : 'bg-primary/10 border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notif.type === 'dp_request' ? 'bg-destructive/20' : 'bg-primary/20'
                  }`}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    {notif.type === 'dp_request' && (
                      <span className="inline-block px-2 py-0.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full mb-1">
                        DP REQUEST
                      </span>
                    )}
                    <p className={`font-semibold ${
                      notif.read ? 'text-muted-foreground' : 'text-foreground'
                    }`}>
                      {notif.content}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notif.read && (
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteNotification(notif.notification_id, e)}
                      className="h-8 w-8 rounded-full hover:bg-destructive/20 hover:text-destructive"
                      data-testid={`delete-notif-${notif.notification_id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* DP Request Dialog */}
      <Dialog open={showDPDialog} onOpenChange={setShowDPDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-destructive" />
              DP Request
            </DialogTitle>
            <DialogDescription>
              Review the bet details and stipulation before accepting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <Card className="bg-destructive/10 border-destructive/30 p-4 rounded-xl">
              <p className="text-sm leading-relaxed font-semibold">
                {selectedDPNotif?.content}
              </p>
            </Card>

            {loadingBet ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading bet details...</p>
              </div>
            ) : betDetails ? (
              <>
                {/* Bet Amount */}
                <Card className="premium-card p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Bet Amount</p>
                      <p className="text-3xl font-black font-mono text-primary">${betDetails.amount?.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Total Pool</p>
                      <p className="text-xl font-bold font-mono">${(betDetails.amount * 2)?.toFixed(2)}</p>
                    </div>
                  </div>
                </Card>

                {/* Racers */}
                <Card className="premium-card p-4 rounded-xl">
                  <h4 className="font-bold mb-3 text-sm text-muted-foreground">Racers</h4>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Creator</p>
                      <p className="font-semibold">{betDetails.creator?.name || 'Member'}</p>
                      <p className="text-xs text-muted-foreground">{betDetails.creator?.betz_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Opponent</p>
                      <p className="font-semibold">{betDetails.opponent?.name || 'Member'}</p>
                      <p className="text-xs text-muted-foreground">{betDetails.opponent?.betz_id}</p>
                    </div>
                  </div>
                </Card>

                {/* Stipulation - CRITICAL */}
                <Card className="bg-primary/10 border-primary/30 p-5 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <h4 className="font-bold text-lg">Bet Stipulation</h4>
                  </div>
                  {betDetails.stipulation ? (
                    <div className="bg-card p-4 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{betDetails.stipulation}</pre>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No stipulation provided</p>
                  )}
                </Card>

                {/* DP Responsibilities */}
                <Card className="bg-muted/30 p-4 rounded-xl">
                  <h4 className="font-bold mb-3">Your DP Responsibilities:</h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Verify the race outcome fairly based on the stipulation above</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Review evidence from both parties (videos, photos, etc.)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Declare the winner according to agreed rules</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Your decision is final and binding</strong></span>
                    </li>
                  </ul>
                </Card>

                <div className="bg-accent/10 border border-accent/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-accent">Important:</strong> Make sure you understand the stipulation and can fairly judge this race. By accepting, you agree to be available when the race is completed.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground">Unable to load bet details</p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={handleDeclineDP}
              disabled={dpProcessing}
              className="flex-1 rounded-full"
              data-testid="decline-dp-button"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>
            <Button
              onClick={handleAcceptDP}
              disabled={dpProcessing}
              className="flex-1 btn-premium text-white rounded-full"
              data-testid="accept-dp-button"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {dpProcessing ? 'Processing...' : 'Accept DP Role'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}