import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { 
  DollarSign, Users, Shield, Trophy, Zap, Wallet, 
  ArrowRight, CheckCircle, X, MessageSquare, QrCode
} from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to BETZ',
    subtitle: 'Trusted P2P Betting',
    description: 'The secure way to settle bets with friends. Your funds are protected, and every bet is verified.',
    icon: Shield,
    iconColor: 'text-primary',
    bgGradient: 'from-primary/20 to-purple-900/20'
  },
  {
    id: 'place-bet',
    title: 'Place a Bet',
    subtitle: 'Challenge Anyone',
    description: 'Create a bet, set your terms, and challenge a friend. Both parties put up equal stakes.',
    icon: DollarSign,
    iconColor: 'text-green-500',
    bgGradient: 'from-green-500/20 to-emerald-900/20'
  },
  {
    id: 'quick-bet',
    title: 'Quick Bet',
    subtitle: 'Fast & Simple',
    description: 'For quick wagers, use Quick Bet. Both parties declare the winner - if you agree, it settles instantly.',
    icon: Zap,
    iconColor: 'text-yellow-500',
    bgGradient: 'from-yellow-500/20 to-amber-900/20'
  },
  {
    id: 'contacts',
    title: 'Build Your Network',
    subtitle: 'Find & Add Contacts',
    description: 'Search for friends by name or Betz ID. Add trusted contacts for quick betting.',
    icon: Users,
    iconColor: 'text-blue-500',
    bgGradient: 'from-blue-500/20 to-indigo-900/20'
  },
  {
    id: 'wallet',
    title: 'Secure Wallet',
    subtitle: 'Your Funds, Protected',
    description: 'Deposit and withdraw securely. Your balance is locked during active bets to guarantee payouts.',
    icon: Wallet,
    iconColor: 'text-accent',
    bgGradient: 'from-accent/20 to-yellow-900/20'
  },
  {
    id: 'disputes',
    title: 'Fair Dispute Resolution',
    subtitle: 'Designated Person (DP)',
    description: 'If there\'s a disagreement, nominate a trusted DP to settle. Their decision is final.',
    icon: MessageSquare,
    iconColor: 'text-orange-500',
    bgGradient: 'from-orange-500/20 to-red-900/20'
  },
  {
    id: 'trust',
    title: 'Build Trust',
    subtitle: 'Earn Your Reputation',
    description: 'Complete bets honorably to increase your trust score. Higher scores mean more credibility.',
    icon: Trophy,
    iconColor: 'text-yellow-500',
    bgGradient: 'from-yellow-500/20 to-amber-900/20'
  },
  {
    id: 'share',
    title: 'Share & Invite',
    subtitle: 'Grow the Community',
    description: 'Share your profile via QR code. Invite friends to join BETZ and start betting!',
    icon: QrCode,
    iconColor: 'text-primary',
    bgGradient: 'from-primary/20 to-purple-900/20'
  }
];

export default function OnboardingTutorial({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onClose();
  };

  const step = TUTORIAL_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" hideCloseButton>
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${step.bgGradient} opacity-50`} />
        
        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          data-testid="skip-tutorial"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="relative p-8 pt-12">
          {/* Progress Dots */}
          <div className="flex justify-center gap-1.5 mb-8">
            {TUTORIAL_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep 
                    ? 'w-6 bg-primary' 
                    : idx < currentStep 
                      ? 'w-1.5 bg-primary/50' 
                      : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`p-5 rounded-2xl bg-white/10 backdrop-blur-sm`}>
              <Icon className={`h-12 w-12 ${step.iconColor}`} />
            </div>
          </div>

          {/* Text */}
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {step.subtitle}
            </p>
            <h2 className="text-2xl font-bold mb-3">{step.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Step Counter */}
          <p className="text-center text-xs text-muted-foreground mb-6">
            {currentStep + 1} of {TUTORIAL_STEPS.length}
          </p>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                onClick={handlePrev}
                variant="outline"
                className="flex-1 rounded-xl h-12"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1 btn-premium text-white rounded-xl h-12"
              data-testid="tutorial-next"
            >
              {isLastStep ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
