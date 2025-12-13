import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { ArrowLeft, Mail, MessageSquare, Phone, MapPin, Send, HelpCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ContactPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // In production, this would send to a real endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Message sent! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 h-14 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="ml-3 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold">Contact Us</h1>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <div className="text-center py-4">
          <h1 className="text-2xl font-bold text-primary">Get in Touch</h1>
          <p className="text-sm text-muted-foreground mt-1">We're here to help</p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="premium-card p-4 rounded-xl text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Email</h3>
            <p className="text-xs text-muted-foreground mt-1">support@betz.com</p>
          </Card>

          <Card className="premium-card p-4 rounded-xl text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="font-semibold text-sm">Response Time</h3>
            <p className="text-xs text-muted-foreground mt-1">Within 24 hours</p>
          </Card>

          <Card className="premium-card p-4 rounded-xl text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/10 flex items-center justify-center">
              <HelpCircle className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="font-semibold text-sm">FAQ</h3>
            <p className="text-xs text-muted-foreground mt-1">Check our Help Center</p>
          </Card>
        </div>

        {/* Contact Form */}
        <Card className="premium-card p-6 rounded-xl">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Send us a Message
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Name *</label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-muted/30 border-white/10 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Email *</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-muted/30 border-white/10 rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Subject</label>
              <Input
                type="text"
                placeholder="What's this about?"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="bg-muted/30 border-white/10 rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Message *</label>
              <textarea
                placeholder="How can we help you?"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full h-32 p-3 bg-muted/30 border border-white/10 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-premium text-white rounded-xl h-12"
            >
              {loading ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Additional Info */}
        <Card className="premium-card p-6 rounded-xl">
          <h2 className="font-semibold text-lg mb-4">Common Questions</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm text-primary">How do I reset my password?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Click "Forgot Password" on the login page and follow the instructions sent to your email.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-sm text-primary">How long do withdrawals take?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Withdrawals are typically processed within 1-3 business days depending on your payment method.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-sm text-primary">What if there's a dispute?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                If both parties can't agree on the winner, a Designated Person (DP) will be assigned to make the final decision.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-sm text-primary">Is my money safe?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Yes! Funds are held securely in escrow during active bets. Winners are guaranteed to receive their payouts.
              </p>
            </div>
          </div>
        </Card>

        <p className="text-xs text-center text-muted-foreground py-4">
          BETZ Support Team • Available 24/7
        </p>
      </div>
    </div>
  );
}
