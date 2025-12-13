import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  Menu, X, Zap, History, QrCode, HelpCircle, 
  Settings, Shield, Bell, MessageSquare
} from 'lucide-react';

export default function AppMenu({ user, onLogout, onShowQR, onShowTutorial }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      icon: Zap,
      label: 'Quick Bet',
      description: 'Fast, simple wagers',
      onClick: () => navigate('/quick-bet'),
      color: 'text-yellow-500'
    },
    {
      icon: MessageSquare,
      label: 'Direct Messages',
      description: 'Private 1-on-1 chat',
      onClick: () => navigate('/messages'),
      color: 'text-green-500'
    },
    {
      icon: History,
      label: 'Transaction History',
      description: 'View all transactions',
      onClick: () => navigate('/transactions'),
      color: 'text-blue-500'
    },
    {
      icon: QrCode,
      label: 'Share Profile',
      description: 'QR code & Betz ID',
      onClick: () => {
        onShowQR?.();
        setIsOpen(false);
      },
      color: 'text-primary'
    },
    {
      icon: Bell,
      label: 'Notifications',
      description: 'View all notifications',
      onClick: () => navigate('/notifications'),
      color: 'text-orange-500'
    },
    {
      icon: Shield,
      label: 'DP Dashboard',
      description: 'Designated Person duties',
      onClick: () => navigate('/dp-dashboard'),
      color: 'text-purple-500',
      show: user?.is_dp
    },
    {
      icon: HelpCircle,
      label: 'How It Works',
      description: 'View tutorial',
      onClick: () => {
        onShowTutorial?.();
        setIsOpen(false);
      },
      color: 'text-cyan-500'
    },
    {
      icon: Settings,
      label: 'Profile & Settings',
      description: 'Edit your profile',
      onClick: () => navigate('/profile'),
      color: 'text-muted-foreground'
    }
  ];

  const filteredItems = menuItems.filter(item => item.show !== false);

  return (
    <>
      {/* Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="rounded-full h-9 w-9"
        data-testid="app-menu-button"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-background border-l border-white/10 z-50 transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-background">
          <div>
            <h2 className="font-bold text-lg">Menu</h2>
            <p className="text-xs text-muted-foreground">{user?.name}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="rounded-full h-9 w-9 hover:bg-white/10"
            data-testid="close-menu-button"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Menu Items */}
        <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] bg-background">
          {filteredItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.onClick();
                if (!item.onClick.toString().includes('setIsOpen')) {
                  setIsOpen(false);
                }
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors text-left"
              data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className={`p-2 rounded-lg bg-muted/30 ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer - Close Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-background">
          <Button
            onClick={() => setIsOpen(false)}
            variant="outline"
            className="w-full rounded-xl border-white/20"
            data-testid="menu-close-bottom"
          >
            <X className="h-4 w-4 mr-2" />
            Close Menu
          </Button>
        </div>
      </div>
    </>
  );
}
