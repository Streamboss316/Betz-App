import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { ArrowLeft, Send, MessageSquare, Search } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MessagesPage({ user }) {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    if (selectedFriend) {
      loadMessages(selectedFriend.user_id);
    }
  }, [selectedFriend]);

  const loadFriends = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load friends');
      setLoading(false);
    }
  };

  const loadMessages = async (friendId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/messages/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (error) {
      console.error('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend) return;

    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API}/messages/send`, null, {
        params: {
          receiver_id: selectedFriend.user_id,
          content: newMessage
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewMessage('');
      loadMessages(selectedFriend.user_id);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.betz_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Friends List Sidebar */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        <header className="h-16 border-b border-white/5 flex items-center px-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full" data-testid="back-button">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold font-heading ml-4" data-testid="messages-title">Messages</h1>
        </header>

        {/* Search Bar */}
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/30 border-white/10 rounded-lg"
              data-testid="search-friends-input"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2" data-testid="friends-list">
          {loading ? (
            <p className="text-muted-foreground text-center">Loading...</p>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center p-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                {friends.length === 0 ? 'No friends to message' : 'No friends found'}
              </p>
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <div
                key={friend.user_id}
                data-testid={`friend-${friend.user_id}`}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  selectedFriend?.user_id === friend.user_id
                    ? 'bg-primary/20 border border-primary'
                    : 'hover:bg-muted/30'
                }`}
              >
                <div 
                  className="flex items-center gap-3 flex-1"
                  onClick={() => setSelectedFriend(friend)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={friend.avatar} />
                    <AvatarFallback className="bg-muted">{getInitials(friend.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{friend.name}</p>
                    <p className="text-sm text-muted-foreground">{friend.betz_id}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/user/${friend.user_id}`);
                  }}
                  title="View Profile"
                >
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {!selectedFriend ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a friend to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <header className="h-16 border-b border-white/5 flex items-center px-6">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedFriend.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(selectedFriend.name)}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="font-bold" data-testid="chat-friend-name">{selectedFriend.name}</p>
                <p className="text-sm text-muted-foreground">{selectedFriend.betz_id}</p>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="messages-list">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user.user_id;
                  return (
                    <div
                      key={idx}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${idx}`}
                    >
                      <div
                        className={`max-w-md p-4 rounded-2xl ${
                          isMe
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-white/10'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-white/5 p-4">
              <div className="flex gap-3">
                <Input
                  data-testid="message-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-input/50 border-white/10 rounded-full h-12"
                />
                <Button
                  data-testid="send-message-button"
                  onClick={handleSendMessage}
                  size="icon"
                  className="bg-primary text-primary-foreground rounded-full h-12 w-12 btn-glow"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}