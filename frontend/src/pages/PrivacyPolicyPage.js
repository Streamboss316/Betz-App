import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 h-14 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="ml-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold">Privacy Policy</h1>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <div className="text-center py-4">
          <h1 className="text-2xl font-bold text-primary">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-1">Last Updated: December 2024</p>
        </div>

        <Card className="premium-card p-6 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">1. Information We Collect</h2>
              <p className="text-sm text-muted-foreground mt-2">
                We collect information you provide directly to us, including:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>Account information (name, email, phone number)</li>
                <li>Profile information (avatar, bio, social links)</li>
                <li>Transaction data (deposits, withdrawals, bet history)</li>
                <li>Communications (messages, support requests)</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">2. How We Use Your Information</h2>
              <p className="text-sm text-muted-foreground mt-2">
                We use the information we collect to:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Detect, investigate, and prevent fraudulent transactions</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">3. Data Storage & Security</h2>
              <p className="text-sm text-muted-foreground mt-2">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. Your data is stored securely and encrypted.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                We retain your information for as long as your account is active or as needed to provide you services, comply with legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <UserCheck className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">4. Your Rights</h2>
              <p className="text-sm text-muted-foreground mt-2">
                You have the right to:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">5. Third-Party Services</h2>
              <p className="text-sm text-muted-foreground mt-2">
                We may share your information with third-party service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, and customer service. These third parties are obligated to maintain the confidentiality of your information.
              </p>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">6. Contact Us</h2>
              <p className="text-sm text-muted-foreground mt-2">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-sm text-primary mt-2 font-mono">
                privacy@betz.com
              </p>
            </div>
          </div>
        </Card>

        <p className="text-xs text-center text-muted-foreground py-4">
          By using BETZ, you agree to this Privacy Policy.
        </p>
      </div>
    </div>
  );
}
