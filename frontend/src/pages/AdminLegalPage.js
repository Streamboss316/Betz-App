import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { ArrowLeft, FileText, Shield, Mail, Save, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DEFAULT_CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'December 2024',
    sections: [
      {
        title: '1. Information We Collect',
        content: 'We collect information you provide directly to us, including: Account information (name, email, phone number), Profile information (avatar, bio, social links), Transaction data (deposits, withdrawals, bet history), Communications (messages, support requests).'
      },
      {
        title: '2. How We Use Your Information',
        content: 'We use the information to: Provide, maintain, and improve our services, Process transactions and send related information, Send technical notices and support messages, Respond to your comments and questions, Detect, investigate, and prevent fraudulent transactions.'
      },
      {
        title: '3. Data Storage & Security',
        content: 'We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. Your data is stored securely and encrypted.'
      },
      {
        title: '4. Your Rights',
        content: 'You have the right to: Access your personal data, Correct inaccurate data, Request deletion of your data, Object to processing of your data, Data portability, Withdraw consent at any time.'
      },
      {
        title: '5. Contact',
        content: 'For privacy concerns, contact us at privacy@betz.com'
      }
    ]
  },
  terms: {
    title: 'Terms of Service',
    lastUpdated: 'December 2024',
    sections: [
      {
        title: '1. Acceptance of Terms',
        content: 'By accessing or using BETZ, you agree to be bound by these Terms of Service and all applicable laws and regulations.'
      },
      {
        title: '2. Eligibility',
        content: 'You must be at least 18 years old to use BETZ. BETZ is a peer-to-peer platform for settling personal bets between individuals.'
      },
      {
        title: '3. Platform Fees',
        content: '3% platform fee on winning payouts. No fees for deposits or withdrawals. Fees are automatically deducted from winnings.'
      },
      {
        title: '4. Bet Rules & Disputes',
        content: 'Both parties must confirm the winner. If there is a dispute, a Designated Person (DP) will make the final decision. DP decisions are final and binding.'
      },
      {
        title: '5. Prohibited Activities',
        content: 'Users are prohibited from: Creating multiple accounts, Money laundering, Colluding with other users, Harassing other users, Exploiting the platform.'
      },
      {
        title: '6. Limitation of Liability',
        content: 'BETZ is provided "as is" without warranties. We are not liable for losses resulting from the use of our platform.'
      }
    ]
  },
  contact: {
    email: 'support@betz.com',
    responseTime: 'Within 24 hours',
    faq: [
      { question: 'How do I reset my password?', answer: 'Click "Forgot Password" on the login page.' },
      { question: 'How long do withdrawals take?', answer: '1-3 business days depending on payment method.' },
      { question: 'What if there\'s a dispute?', answer: 'A Designated Person (DP) will make the final decision.' },
      { question: 'Is my money safe?', answer: 'Yes! Funds are held securely in escrow during active bets.' }
    ]
  }
};

export default function AdminLegalPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('privacy');
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await axios.get(`${API}/admin/legal-content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && Object.keys(res.data).length > 0) {
        setContent(res.data);
      }
    } catch (error) {
      // Use default content if not found
      console.log('Using default legal content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('admin_token');
    try {
      await axios.put(`${API}/admin/legal-content`, content, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Legal content saved successfully');
    } catch (error) {
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (pageKey, sectionIndex, field, value) => {
    setContent(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        sections: prev[pageKey].sections.map((s, i) => 
          i === sectionIndex ? { ...s, [field]: value } : s
        )
      }
    }));
  };

  const updatePageField = (pageKey, field, value) => {
    setContent(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        [field]: value
      }
    }));
  };

  const updateFAQ = (index, field, value) => {
    setContent(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        faq: prev.contact.faq.map((f, i) => 
          i === index ? { ...f, [field]: value } : f
        )
      }
    }));
  };

  const addSection = (pageKey) => {
    setContent(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        sections: [...prev[pageKey].sections, { title: 'New Section', content: '' }]
      }
    }));
  };

  const removeSection = (pageKey, index) => {
    setContent(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        sections: prev[pageKey].sections.filter((_, i) => i !== index)
      }
    }));
  };

  const addFAQ = () => {
    setContent(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        faq: [...prev.contact.faq, { question: '', answer: '' }]
      }
    }));
  };

  const removeFAQ = (index) => {
    setContent(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        faq: prev.contact.faq.filter((_, i) => i !== index)
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-primary/20 h-16 flex items-center px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')} className="rounded-full hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="ml-4 flex-1">
          <h1 className="text-lg font-bold">Legal & Policies</h1>
          <p className="text-xs text-muted-foreground">Edit Privacy, Terms, and Contact pages</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/${activeTab === 'privacy' ? 'privacy' : activeTab === 'terms' ? 'terms' : 'contact'}`, '_blank')}
            className="rounded-xl"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="btn-premium text-white rounded-xl"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save All
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'privacy', label: 'Privacy Policy', icon: Shield },
            { key: 'terms', label: 'Terms of Service', icon: FileText },
            { key: 'contact', label: 'Contact Info', icon: Mail }
          ].map(tab => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl ${activeTab === tab.key ? 'btn-premium text-white' : ''}`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Privacy Policy Editor */}
        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <Card className="premium-card p-4 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Page Title</label>
                  <Input
                    value={content.privacy.title}
                    onChange={(e) => updatePageField('privacy', 'title', e.target.value)}
                    className="bg-muted/30 border-white/10 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Last Updated</label>
                  <Input
                    value={content.privacy.lastUpdated}
                    onChange={(e) => updatePageField('privacy', 'lastUpdated', e.target.value)}
                    className="bg-muted/30 border-white/10 mt-1"
                  />
                </div>
              </div>
            </Card>

            {content.privacy.sections.map((section, idx) => (
              <Card key={idx} className="premium-card p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <Input
                    value={section.title}
                    onChange={(e) => updateSection('privacy', idx, 'title', e.target.value)}
                    className="bg-muted/30 border-white/10 font-semibold"
                    placeholder="Section Title"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSection('privacy', idx)}
                    className="text-red-500 hover:text-red-400 ml-2"
                  >
                    Remove
                  </Button>
                </div>
                <textarea
                  value={section.content}
                  onChange={(e) => updateSection('privacy', idx, 'content', e.target.value)}
                  className="w-full h-24 p-3 bg-muted/30 border border-white/10 rounded-lg text-sm resize-none"
                  placeholder="Section content..."
                />
              </Card>
            ))}

            <Button variant="outline" onClick={() => addSection('privacy')} className="w-full rounded-xl">
              + Add Section
            </Button>
          </div>
        )}

        {/* Terms Editor */}
        {activeTab === 'terms' && (
          <div className="space-y-4">
            <Card className="premium-card p-4 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Page Title</label>
                  <Input
                    value={content.terms.title}
                    onChange={(e) => updatePageField('terms', 'title', e.target.value)}
                    className="bg-muted/30 border-white/10 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Last Updated</label>
                  <Input
                    value={content.terms.lastUpdated}
                    onChange={(e) => updatePageField('terms', 'lastUpdated', e.target.value)}
                    className="bg-muted/30 border-white/10 mt-1"
                  />
                </div>
              </div>
            </Card>

            {content.terms.sections.map((section, idx) => (
              <Card key={idx} className="premium-card p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <Input
                    value={section.title}
                    onChange={(e) => updateSection('terms', idx, 'title', e.target.value)}
                    className="bg-muted/30 border-white/10 font-semibold"
                    placeholder="Section Title"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSection('terms', idx)}
                    className="text-red-500 hover:text-red-400 ml-2"
                  >
                    Remove
                  </Button>
                </div>
                <textarea
                  value={section.content}
                  onChange={(e) => updateSection('terms', idx, 'content', e.target.value)}
                  className="w-full h-24 p-3 bg-muted/30 border border-white/10 rounded-lg text-sm resize-none"
                  placeholder="Section content..."
                />
              </Card>
            ))}

            <Button variant="outline" onClick={() => addSection('terms')} className="w-full rounded-xl">
              + Add Section
            </Button>
          </div>
        )}

        {/* Contact Editor */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            <Card className="premium-card p-4 rounded-xl">
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Support Email</label>
                  <Input
                    value={content.contact.email}
                    onChange={(e) => updatePageField('contact', 'email', e.target.value)}
                    className="bg-muted/30 border-white/10 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Response Time</label>
                  <Input
                    value={content.contact.responseTime}
                    onChange={(e) => updatePageField('contact', 'responseTime', e.target.value)}
                    className="bg-muted/30 border-white/10 mt-1"
                  />
                </div>
              </div>
            </Card>

            <Card className="premium-card p-4 rounded-xl">
              <h3 className="font-semibold mb-3">FAQ Items</h3>
              <div className="space-y-4">
                {content.contact.faq.map((faq, idx) => (
                  <div key={idx} className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <Input
                        value={faq.question}
                        onChange={(e) => updateFAQ(idx, 'question', e.target.value)}
                        className="bg-muted/30 border-white/10"
                        placeholder="Question"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFAQ(idx)}
                        className="text-red-500 hover:text-red-400 ml-2"
                      >
                        ×
                      </Button>
                    </div>
                    <Input
                      value={faq.answer}
                      onChange={(e) => updateFAQ(idx, 'answer', e.target.value)}
                      className="bg-muted/30 border-white/10"
                      placeholder="Answer"
                    />
                  </div>
                ))}
                <Button variant="outline" onClick={addFAQ} className="w-full rounded-xl">
                  + Add FAQ
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
