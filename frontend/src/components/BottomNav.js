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
                className="flex flex-col items-center justify-center -mt-7"
                data-testid="nav-bet"
              >
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 35%, #d97706 75%, #f59e0b 100%)',
                    boxShadow: '0 8px 24px rgba(168,85,247,0.45), 0 4px 18px rgba(251,191,36,0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
                    border: '2px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <Icon className="h-7 w-7 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-heading text-[11px] tracking-[0.15em] brand-text mt-1">BET</span>
              </button>
            );
          }
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                active 
                  ? 'text-white bg-white/5' 
                  : 'text-white/40 hover:text-white/80'
              }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5px]' : ''}`} style={active ? { color: '#fbbf24' } : {}} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'brand-text' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
