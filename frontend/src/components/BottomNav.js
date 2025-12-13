import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, MessageCircle, Wallet, Plus } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/friends', icon: Users, label: 'Contacts' },
    { path: '/place-bet', icon: Plus, label: 'Bet', isAction: true },
    { path: '/public-chat', icon: MessageCircle, label: 'Chat' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 h-20 px-2 pb-2">
      <div className="max-w-lg mx-auto h-full flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          // Center action button (Place Bet)
          if (item.isAction) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center -mt-6"
                data-testid="nav-bet"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-primary mt-1">Bet</span>
              </button>
            );
          }
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                active 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
