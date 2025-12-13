import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { ArrowLeft, Send, MessageSquare, Search, Trash2, AtSign, Users, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MessagesPage({ user }) {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const loadContacts = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load contacts');
      setLoading(false);
    }
  };

  const loadMessages = async (contactId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/messages/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (error) {
      console.error('Failed to load messages');
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.user_id);
    }
  }, [selectedContact]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API}/messages/send`, null, {
        params: {
          receiver_id: selectedContact.user_id,
          content: newMessage
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewMessage('');
      setShowMentions(false);
      loadMessages(selectedContact.user_id);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Message deleted');
      loadMessages(selectedContact.user_id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete message');
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Check for @ mention
    const lastChar = value[value.length - 1];
    if (lastChar === '@') {
      setShowMentions(true);
      setMentionSearch('');
    } else if (showMentions) {
      const lastAtIndex = value.lastIndexOf('@');
      const searchText = value.substring(lastAtIndex + 1);
      setMentionSearch(searchText);
    }
  };

  const insertMention = (contact) => {
    const lastAtIndex = newMessage.lastIndexOf('@');
    const beforeMention = newMessage.substring(0, lastAtIndex);
    setNewMessage(`${beforeMention}@${contact.name} `);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const renderMessageContent = (content) => {
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span 
            key={index} 
            className="text-accent font-semibold cursor-pointer hover:underline"
            onClick={() => {
              const mentionedContact = contacts.find(c => c.name === part);
              if (mentionedContact) {
                navigate(`/user/${mentionedContact.user_id}`);
              }
            }}
          >
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  const filteredMentions = contacts.filter(contact => 
    contact.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.betz_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mobile: Show contact list view
  if (!selectedContact) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 h-14 flex items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full h-9 w-9" data-testid="back-button">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="ml-3">
            <h1 className="text-base font-semibold" data-testid="messages-title">Messages</h1>
          </div>
        </header>

        <div className="p-4 max-w-lg mx-auto space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/30 border-white/10 rounded-xl"
              data-testid="search-contacts-input"
            />
          </div>

          {/* Contacts List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredContacts.length === 0 ? (
            <Card className="premium-card p-8 rounded-xl text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-7 w-7 text-primary/60" />
              </div>
              <p className="text-muted-foreground font-medium">
                {contacts.length === 0 ? 'No contacts yet' : 'No contacts found'}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
                {contacts.length === 0 ? 'Add contacts to start messaging' : 'Try a different search'}
              </p>
              {contacts.length === 0 && (
                <Button 
                  onClick={() => navigate('/friends')}
                  size="sm"
                  className="btn-premium text-white rounded-full"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Add Contacts
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <Card 
                  key={contact.user_id}
                  className="premium-card p-4 rounded-xl cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setSelectedContact(contact)}
                  data-testid={`contact-${contact.user_id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-white/10">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback className="bg-primary text-white">{getInitials(contact.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.betz_id}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chat View (when contact is selected)
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Chat Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 h-14 flex items-center px-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setSelectedContact(null)} 
          className="rounded-full h-9 w-9" 
          data-testid="back-to-contacts"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 ml-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={selectedContact.avatar} />
            <AvatarFallback className="bg-primary text-white text-sm">{getInitials(selectedContact.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm" data-testid="chat-contact-name">{selectedContact.name}</p>
            <p className="text-xs text-muted-foreground">{selectedContact.betz_id}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32" data-testid="messages-list">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-primary/60" />
            </div>
            <p className="text-muted-foreground font-medium">No messages yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === user.user_id;
            return (
              <div
                key={idx}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                data-testid={`message-${idx}`}
              >
                <div className="relative max-w-[80%]">
                  <div
                    className={`p-3 rounded-2xl ${
                      isMe
                        ? 'btn-premium text-white rounded-br-md'
                        : 'bg-muted/50 border border-white/10 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm">{renderMessageContent(msg.content)}</p>
                    <p className={`text-[10px] mt-1 ${
                      isMe ? 'text-white/60' : 'text-muted-foreground'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  {isMe && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                      onClick={() => handleDeleteMessage(msg.message_id)}
                      data-testid={`delete-message-${idx}`}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-white/10 p-3 pb-20">
        {/* Mention Dropdown */}
        {showMentions && filteredMentions.length > 0 && (
          <div className="mb-2 bg-card border border-white/10 rounded-lg max-h-32 overflow-y-auto">
            {filteredMentions.slice(0, 4).map((contact) => (
              <div
                key={contact.user_id}
                className="flex items-center gap-2 p-2 hover:bg-muted/30 cursor-pointer"
                onClick={() => insertMention(contact)}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback className="bg-muted text-xs">{getInitials(contact.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{contact.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              data-testid="message-input"
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && !showMentions && handleSendMessage()}
              placeholder="Type a message..."
              className="bg-muted/30 border-white/10 rounded-full h-11 pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
              onClick={() => {
                setNewMessage(newMessage + '@');
                setShowMentions(true);
                inputRef.current?.focus();
              }}
              title="Mention"
            >
              <AtSign className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <Button
            data-testid="send-message-button"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="btn-premium text-white rounded-full h-11 w-11"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
