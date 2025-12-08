import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import '@/App.css';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import PlaceBetPage from './pages/PlaceBetPage';
import BetDetailsPage from './pages/BetDetailsPage';
import ProfilePage from './pages/ProfilePage';
import FriendsPage from './pages/FriendsPage';
import WalletPage from './pages/WalletPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminSettings from './pages/AdminSettings';
import AdminUsers from './pages/AdminUsers';
import AdminBets from './pages/AdminBets';
import AdminRevenue from './pages/AdminRevenue';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ViewUserProfile from './pages/ViewUserProfile';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [user, setUser] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [loading, setLoading] = useState(true);

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
      })
      .catch(() => {
        localStorage.removeItem('token');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
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
        <Routes>
          <Route path="/auth" element={!user ? <AuthPage onLogin={login} /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/" element={user ? <HomePage user={user} onLogout={logout} /> : <Navigate to="/auth" />} />
          <Route path="/place-bet" element={user ? <PlaceBetPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/bets/:betId" element={user ? <BetDetailsPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/profile" element={user ? <ProfilePage user={user} setUser={setUser} onLogout={logout} /> : <Navigate to="/auth" />} />
          <Route path="/friends" element={user ? <FriendsPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/wallet" element={user ? <WalletPage user={user} setUser={setUser} /> : <Navigate to="/auth" />} />
          <Route path="/messages" element={user ? <MessagesPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/notifications" element={user ? <NotificationsPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/user/:userId" element={user ? <ViewUserProfile /> : <Navigate to="/auth" />} />
          <Route path="/admin/login" element={!adminToken ? <AdminLoginPage onAdminLogin={adminLogin} /> : <Navigate to="/admin/dashboard" />} />
          <Route path="/admin/dashboard" element={adminToken ? <AdminDashboard onLogout={adminLogout} /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/settings" element={adminToken ? <AdminSettings /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/users" element={adminToken ? <AdminUsers /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/bets" element={adminToken ? <AdminBets /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/revenue" element={adminToken ? <AdminRevenue /> : <Navigate to="/admin/login" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;