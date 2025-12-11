import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Send, Users, Circle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PublicChatPage({ user }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    loadAllUsers();
    loadOnlineStatus();
    // Poll for new messages and online status every 3 seconds
    const interval = setInterval(() => {
      loadMessages();
      loadOnlineStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/chat/public`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load messages');
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      // Get all users including current user for member list
      const res = await axios.get(`${API}/users/search`, {
        params: { query: '' }, // Empty query returns all users
        headers: { Authorization: `Bearer ${token}` }
      });
      // Include current user in the list
      const allUsersIncludingCurrent = [...res.data, user];
      setAllUsers(allUsersIncludingCurrent);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load users');
      setLoading(false);
    }
  };

  const loadOnlineStatus = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/users/online`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Create a Set of online user IDs for quick lookup
      const onlineIds = new Set(res.data.map(u => u.user_id));
      setOnlineUserIds(onlineIds);
    } catch (error) {
      console.error('Failed to load online status');
    }
  };

  const handleUserClick = async (clickedUser, isOnline) => {
    // Only allow clicking if user is online
    if (!isOnline) {
      return; // Do nothing if user is offline
    }
    
    // User is online - go to direct messages
    navigate('/messages');
    toast.success(`Opening chat with ${clickedUser.name}`);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API}/chat/public/send`, null, {
        params: { content: newMessage },
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewMessage('');
      loadMessages();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-white/5 flex items-center px-6 bg-black/60 backdrop-blur-md">
          <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="public-chat-title">BETZ CHAT</h1>
          <Badge className="ml-4 bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Users className="h-3 w-3 mr-1" />
            {onlineUserIds.size} Online
          </Badge>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5" data-testid="chat-messages">
          {loading ? (
            <p className="text-muted-foreground text-center">Loading messages...</p>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-2">Be the first to start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.sender_id === user.user_id;
              return (
                <div
                  key={msg.message_id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  data-testid={`message-${msg.message_id}`}
                >
                  <Avatar 
                    className="h-10 w-10 cursor-pointer" 
                    onClick={() => !isOwnMessage && navigate(`/user/${msg.sender_id}`)}
                    data-testid={`avatar-${msg.sender_id}`}
                  >
                    <AvatarImage src={msg.sender_avatar} />
                    <AvatarFallback className="bg-muted">{getInitials(msg.sender_name)}</AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 max-w-lg ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      {!isOwnMessage && (
                        <span 
                          className="font-semibold text-sm cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/user/${msg.sender_id}`)}
                          data-testid={`sender-name-${msg.sender_id}`}
                        >
                          {msg.sender_name}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                    <Card className={`inline-block p-3 ${
                      isOwnMessage 
                        ? 'btn-premium text-white' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    </Card>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-white/10 p-4 bg-card/50 backdrop-blur-sm">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <Input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-muted/30 border-white/10 rounded-full"
              data-testid="message-input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="rounded-full px-6"
              data-testid="send-button"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* All Members Sidebar */}
      <div className="w-80 border-l border-white/10 flex flex-col bg-card/30">
        <div className="h-16 border-b border-white/5 flex items-center px-6">
          <h2 className="text-lg font-bold" data-testid="members-title">
            <Users className="h-5 w-5 inline mr-2" />
            Members ({allUsers.length})
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2" data-testid="members-list">
          {loading ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground text-sm">Loading members...</p>
            </div>
          ) : allUsers.length === 0 ? (
            <div className="text-center p-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground text-sm">No other members</p>
            </div>
          ) : (
            allUsers.map((member) => {
              const isOnline = onlineUserIds.has(member.user_id);
              return (
                <div
                  key={member.user_id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isOnline 
                      ? 'hover:bg-muted/30 cursor-pointer' 
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => handleUserClick(member, isOnline)}
                  data-testid={`member-${member.user_id}`}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-muted">{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <Circle 
                      className={`absolute bottom-0 right-0 h-3 w-3 ${
                        isOnline 
                          ? 'fill-green-500 text-green-500' 
                          : 'fill-red-500 text-red-500'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.betz_id}</p>
                    <p className={`text-xs font-semibold ${
                      isOnline ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {isOnline ? '● Online' : '● Offline'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
