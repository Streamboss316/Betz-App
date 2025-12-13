import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, FileText, AlertTriangle, DollarSign, Users, Gavel, Ban, ShieldCheck } from 'lucide-react';

export default function TermsOfServicePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 h-14 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="ml-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold">Terms of Service</h1>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <div className="text-center py-4">
          <h1 className="text-2xl font-bold text-primary">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-1">Last Updated: December 2024</p>
        </div>

        <Card className="premium-card p-6 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">1. Acceptance of Terms</h2>
              <p className="text-sm text-muted-foreground mt-2">
                By accessing or using BETZ, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
              </p>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">2. Eligibility</h2>
              <p className="text-sm text-muted-foreground mt-2">
                You must be at least 18 years old to use BETZ. By using our service, you represent and warrant that you are of legal age to form a binding contract and meet all eligibility requirements.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                BETZ is a peer-to-peer platform for settling personal bets between individuals. Users are responsible for ensuring their use of the platform complies with local laws and regulations.
              </p>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">3. Platform Fees & Payments</h2>
              <p className="text-sm text-muted-foreground mt-2">
                BETZ charges a platform fee on completed bets. Current fee structure:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>3% platform fee on winning payouts</li>
                <li>No fees for deposits or withdrawals (standard processing)</li>
                <li>Fees are automatically deducted from winnings</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                All payments are processed securely. Funds are held in escrow during active bets to guarantee payouts.
              </p>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <Gavel className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">4. Bet Rules & Disputes</h2>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Bet Creation:</strong> Both parties must agree to bet terms before funds are locked.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Winner Declaration:</strong> Both parties must confirm the winner. If there is a dispute, a Designated Person (DP) will be assigned to make the final decision.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>DP Decisions:</strong> Designated Person decisions are final and binding. By using BETZ, you agree to accept DP rulings without debate.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Punk Out:</strong> Users may forfeit a bet (Punk Out), which results in automatic loss and payment to the opponent.
              </p>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <Ban className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">5. Prohibited Activities</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Users are prohibited from:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>Creating multiple accounts</li>
                <li>Using the platform for money laundering</li>
                <li>Colluding with other users to defraud the system</li>
                <li>Harassing or threatening other users</li>
                <li>Attempting to manipulate or exploit the platform</li>
                <li>Violating any applicable laws or regulations</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">6. Account Suspension</h2>
              <p className="text-sm text-muted-foreground mt-2">
                BETZ reserves the right to suspend or terminate accounts that violate these terms. Suspended accounts may have funds frozen pending investigation. Users will be notified of any account actions.
              </p>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">7. Limitation of Liability</h2>
              <p className="text-sm text-muted-foreground mt-2">
                BETZ is provided "as is" without warranties of any kind. We are not liable for any losses resulting from the use of our platform, including but not limited to lost bets, technical issues, or user disputes.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Users are solely responsible for their betting decisions and ensuring compliance with local laws.
              </p>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">8. Changes to Terms</h2>
              <p className="text-sm text-muted-foreground mt-2">
                We reserve the right to modify these terms at any time. Users will be notified of significant changes. Continued use of BETZ after changes constitutes acceptance of the new terms.
              </p>
            </div>
          </div>
        </Card>

        <p className="text-xs text-center text-muted-foreground py-4">
          By using BETZ, you acknowledge that you have read, understood, and agree to these Terms of Service.
        </p>
      </div>
    </div>
  );
}
