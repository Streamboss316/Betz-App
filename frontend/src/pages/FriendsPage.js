import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { ArrowLeft, Search, UserPlus, Check, X, Star } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function FriendsPage({ user }) {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        axios.get(`${API}/friends`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API}/friends/requests`, { headers: { Authorization: `Bearer ${token}` }})
      ]);
      setFriends(friendsRes.data);
      setRequests(requestsRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load friends');
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/users/search`, {
        params: { query: searchQuery },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleSendRequest = async (friendId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API}/friends/request`, null, {
        params: { friend_id: friendId },
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Friend request sent');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (friendId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/friends/${friendId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Friend request accepted');
      loadData();
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (friendId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/friends/${friendId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Friend request rejected');
      loadData();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/friends/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Friend removed');
      loadData();
    } catch (error) {
      toast.error('Failed to remove friend');
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full" data-testid="back-button">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold font-heading ml-4" data-testid="friends-title">Friends</h1>
      </header>

      <div className="p-6 max-w-2xl mx-auto">
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/30 rounded-full p-1">
            <TabsTrigger value="friends" className="rounded-full" data-testid="friends-tab">Friends</TabsTrigger>
            <TabsTrigger value="requests" className="rounded-full" data-testid="requests-tab">
              Requests {requests.length > 0 && `(${requests.length})`}
            </TabsTrigger>
            <TabsTrigger value="add" className="rounded-full" data-testid="add-tab">Add</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" data-testid="friends-list">
            {loading ? (
              <p className="text-muted-foreground text-center">Loading...</p>
            ) : friends.length === 0 ? (
              <Card className="premium-card p-8 rounded-2xl text-center">
                <p className="text-muted-foreground">No friends yet. Start adding!</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <Card key={friend.user_id} className="premium-card p-4 rounded-xl" data-testid={`friend-${friend.user_id}`}>
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate(`/user/${friend.user_id}`)}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback className="btn-premium text-white">{getInitials(friend.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{friend.name}</p>
                            {friend.trust_score > 0 && (
                              <Badge className="h-4 px-1.5 text-[10px] bg-accent/20 text-accent border border-accent/50 flex items-center gap-0.5">
                                <Star className="h-2.5 w-2.5 fill-accent" />
                                {friend.trust_score}%
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{friend.betz_id}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => navigate('/place-bet')}
                          className="btn-premium text-white rounded-full"
                          data-testid={`bet-friend-${friend.user_id}`}
                        >
                          Bet
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveFriend(friend.user_id)}
                          className="rounded-full"
                          data-testid={`remove-friend-${friend.user_id}`}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" data-testid="requests-list">
            {loading ? (
              <p className="text-muted-foreground text-center">Loading...</p>
            ) : requests.length === 0 ? (
              <Card className="premium-card p-8 rounded-2xl text-center">
                <p className="text-muted-foreground">No pending requests</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <Card key={req.friendship.friendship_id} className="premium-card p-4 rounded-xl" data-testid={`request-${req.user.user_id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={req.user.avatar} />
                          <AvatarFallback className="bg-muted">{getInitials(req.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{req.user.name}</p>
                          <p className="text-sm text-muted-foreground">{req.user.betz_id}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          onClick={() => handleAcceptRequest(req.user.user_id)}
                          className="btn-premium text-white rounded-full h-10 w-10"
                          data-testid={`accept-request-${req.user.user_id}`}
                        >
                          <Check className="h-5 w-5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleRejectRequest(req.user.user_id)}
                          className="rounded-full h-10 w-10"
                          data-testid={`reject-request-${req.user.user_id}`}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add">
            <Card className="premium-card p-6 rounded-2xl">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  data-testid="friend-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, phone, or Betz ID"
                  className="pl-10 bg-input/50 border-white/10 rounded-lg h-12"
                />
              </div>

              <div className="space-y-2" data-testid="search-results">
                {searchResults.map((result) => {
                  const isFriend = friends.some(f => f.user_id === result.user_id);
                  
                  return (
                    <div
                      key={result.user_id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30"
                      data-testid={`search-result-${result.user_id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={result.avatar} />
                          <AvatarFallback className="bg-muted">{getInitials(result.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{result.name}</p>
                          <p className="text-sm text-muted-foreground">{result.betz_id}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(result.user_id)}
                        disabled={isFriend}
                        className={`rounded-full ${
                          isFriend
                            ? 'bg-muted text-muted-foreground'
                            : 'btn-premium text-white'
                        }`}
                        data-testid={`add-friend-${result.user_id}`}
                      >
                        {isFriend ? 'Friends' : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}