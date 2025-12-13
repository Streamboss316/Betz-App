import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import '@/App.css';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Shield, CheckCircle, XCircle } from 'lucide-react';

import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import PlaceBetPage from './pages/PlaceBetPage';
import BetDetailsPage from './pages/BetDetailsPage';
import ProfilePage from './pages/ProfilePage';
import ContactsPage from './pages/ContactsPage';
import WalletPage from './pages/WalletPage';
import MessagesPage from './pages/MessagesPage';
import PublicChatPage from './pages/PublicChatPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminSettings from './pages/AdminSettings';
import AdminUsers from './pages/AdminUsers';
import AdminBets from './pages/AdminBets';
import AdminRevenue from './pages/AdminRevenue';
import AdminDPPage from './pages/AdminDPPage';
import AdminDemoMode from './pages/AdminDemoMode';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ViewUserProfile from './pages/ViewUserProfile';
import ReviewPage from './pages/ReviewPage';
import DPDashboard from './pages/DPDashboard';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import QuickBetPage from './pages/QuickBetPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ContactPage from './pages/ContactPage';
import AdminLegalPage from './pages/AdminLegalPage';
import GlobalHeader from './components/GlobalHeader';
import BottomNav from './components/BottomNav';
import NotificationBubble from './components/NotificationBubble';
import OnboardingTutorial from './components/OnboardingTutorial';
import QRCodeShare from './components/QRCodeShare';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [user, setUser] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDPPopup, setShowDPPopup] = useState(false);
  const [dpNotification, setDpNotification] = useState(null);
  const [betDetails, setBetDetails] = useState(null);
  const [dpProcessing, setDpProcessing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminTkn = localStorage.getItem('admin_token');
    
    if (adminTkn) {
      setAdminToken(adminTkn);
    }
    
    if (token) {
      axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setUser(res.data);
        setLoading(false);
        
        // Check if onboarding should be shown
        const onboardingCompleted = localStorage.getItem('onboarding_completed');
        if (!onboardingCompleted) {
          setShowOnboarding(true);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Poll for DP notifications
  useEffect(() => {
    if (!user) return;

    const checkDPNotifications = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get(`${API}/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Find unread DP requests
        const dpRequest = res.data.find(n => n.type === 'dp_request' && !n.read);
        
        if (dpRequest && (!dpNotification || dpRequest.notification_id !== dpNotification.notification_id)) {
          setDpNotification(dpRequest);
          setShowDPPopup(true);
          
          // Load bet details
          if (dpRequest.bet_id) {
            loadBetDetailsForPopup(dpRequest.bet_id);
          }
        }
      } catch (error) {
        console.error('Failed to check notifications');
      }
    };

    // Check immediately
    checkDPNotifications();

    // Poll every 10 seconds
    const interval = setInterval(checkDPNotifications, 10000);
    
    return () => clearInterval(interval);
  }, [user, dpNotification]);

  const loadBetDetailsForPopup = async (betId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/bets/${betId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBetDetails(res.data);
    } catch (error) {
      console.error('Failed to load bet details');
    }
  };

  const handleAcceptDP = async () => {
    if (!dpNotification) return;
    
    setDpProcessing(true);
    const token = localStorage.getItem('token');
    
    try {
      await axios.put(`${API}/bets/${dpNotification.bet_id}/dp/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mark notification as read
      await axios.put(`${API}/notifications/${dpNotification.notification_id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('You accepted the DP role!');
      setShowDPPopup(false);
      setDpNotification(null);
      
      // Navigate to DP Dashboard (using window.location for full navigation)
      window.location.href = '/dp-dashboard';
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept DP role');
    } finally {
      setDpProcessing(false);
    }
  };

  const handleDeclineDP = async () => {
    if (!dpNotification) return;
    
    setDpProcessing(true);
    const token = localStorage.getItem('token');
    
    try {
      await axios.put(`${API}/bets/${dpNotification.bet_id}/dp/decline`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mark notification as read
      await axios.put(`${API}/notifications/${dpNotification.notification_id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('DP role declined');
      setShowDPPopup(false);
      setDpNotification(null);
      setBetDetails(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to decline DP role');
    } finally {
      setDpProcessing(false);
    }
  };

  const login = (token, userData, isNewUser = false) => {
    localStorage.setItem('token', token);
    setUser(userData);
    
    // Show onboarding for new users or if they haven't completed it
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    if (isNewUser || !onboardingCompleted) {
      setShowOnboarding(true);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const adminLogin = (token) => {
    setAdminToken(token);
  };

  const adminLogout = () => {
    localStorage.removeItem('admin_token');
    setAdminToken(null);
  };

  const [showQRFromMenu, setShowQRFromMenu] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl font-heading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <GlobalHeader 
          user={user} 
          onLogout={logout}
          onShowQR={() => setShowQRFromMenu(true)}
          onShowTutorial={() => setShowOnboarding(true)}
        />
        {user && <NotificationBubble user={user} />}
        {user && <BottomNav />}
        <Routes>
          <Route path="/auth" element={!user ? <AuthPage onLogin={login} /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/" element={user ? <HomePage user={user} onLogout={logout} /> : <Navigate to="/auth" />} />
          <Route path="/place-bet" element={user ? <PlaceBetPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/bets/:betId" element={user ? <BetDetailsPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/profile" element={user ? <ProfilePage user={user} setUser={setUser} onLogout={logout} /> : <Navigate to="/auth" />} />
          <Route path="/friends" element={user ? <ContactsPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/wallet" element={user ? <WalletPage user={user} setUser={setUser} /> : <Navigate to="/auth" />} />
          <Route path="/messages" element={user ? <MessagesPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/public-chat" element={user ? <PublicChatPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/notifications" element={user ? <NotificationsPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/user/:userId" element={user ? <ViewUserProfile /> : <Navigate to="/auth" />} />
          <Route path="/admin/login" element={!adminToken ? <AdminLoginPage onAdminLogin={adminLogin} /> : <Navigate to="/admin/dashboard" />} />
          <Route path="/admin/dashboard" element={adminToken ? <AdminDashboard onLogout={adminLogout} /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/settings" element={adminToken ? <AdminSettings /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/users" element={adminToken ? <AdminUsers /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/bets" element={adminToken ? <AdminBets /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/revenue" element={adminToken ? <AdminRevenue /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/dp" element={adminToken ? <AdminDPPage /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/demo" element={adminToken ? <AdminDemoMode /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/legal" element={adminToken ? <AdminLegalPage /> : <Navigate to="/admin/login" />} />
          <Route path="/review/:betId" element={user ? <ReviewPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/dp-dashboard" element={user ? <DPDashboard user={user} /> : <Navigate to="/auth" />} />
          <Route path="/transactions" element={user ? <TransactionHistoryPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/quick-bet" element={user ? <QuickBetPage user={user} /> : <Navigate to="/auth" />} />
          
          {/* Legal Pages - Public */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </BrowserRouter>

      {/* Global DP Request Popup */}
      {user && (
        <Dialog open={showDPPopup} onOpenChange={setShowDPPopup}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-destructive animate-pulse" />
                ⚡ URGENT: DP Request
              </DialogTitle>
              <DialogDescription>
                You've been selected as a Designated Person - Review immediately!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Card className="bg-destructive/10 border-destructive/30 p-4 rounded-xl animate-pulse">
                <p className="text-sm leading-relaxed font-semibold">
                  {dpNotification?.content}
                </p>
              </Card>

              {betDetails ? (
                <>
                  {/* Bet Amount */}
                  <Card className="bg-card border-white/10 p-4 rounded-xl">
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
                  <Card className="bg-card border-white/10 p-4 rounded-xl">
                    <h4 className="font-bold mb-3 text-sm text-muted-foreground">Racers</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Creator</p>
                        <p className="font-semibold">{betDetails.creator?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{betDetails.creator?.betz_id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Opponent</p>
                        <p className="font-semibold">{betDetails.opponent?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{betDetails.opponent?.betz_id}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Stipulation */}
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

                  <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-destructive">Time Sensitive:</strong> Please respond quickly to avoid delaying the contest. Review the stipulation carefully before accepting.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading bet details...</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={handleDeclineDP}
                disabled={dpProcessing}
                className="flex-1 rounded-full"
                data-testid="decline-dp-popup-button"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
              <Button
                onClick={handleAcceptDP}
                disabled={dpProcessing || !betDetails}
                className="flex-1 bg-primary text-primary-foreground rounded-full"
                data-testid="accept-dp-popup-button"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {dpProcessing ? 'Processing...' : 'Accept DP Role'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Onboarding Tutorial */}
      {user && (
        <OnboardingTutorial
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {/* QR Code Share from Menu */}
      {user && (
        <QRCodeShare
          user={user}
          type="profile"
          isOpen={showQRFromMenu}
          onClose={() => setShowQRFromMenu(false)}
        />
      )}
    </div>
  );
}

export default App;