import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Fingerprint, X } from 'lucide-react';
import { toast } from 'sonner';

export default function BiometricPrompt({ userEmail, onClose }) {
  const [loading, setLoading] = useState(false);

  const handleEnableBiometric = () => {
    setLoading(true);
    
    // Simulate biometric setup
    setTimeout(() => {
      localStorage.setItem('biometric_enabled', 'true');
      localStorage.setItem('biometric_user_email', userEmail);
      toast.success('Face ID enabled successfully!');
      setLoading(false);
      onClose();
    }, 1500);
  };

  const handleSkip = () => {
    localStorage.setItem('biometric_prompt_shown', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" data-testid="biometric-prompt">
      <Card className="bg-card border-primary/20 shadow-2xl rounded-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSkip}
          className="absolute top-4 right-4 rounded-full"
          data-testid="close-biometric-prompt"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
            <Fingerprint className="h-10 w-10 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2" data-testid="biometric-title">
            Enable Face ID?
          </h2>
          
          <p className="text-muted-foreground mb-8">
            Sign in quickly and securely with Face ID. Your facial data stays on your device and is never shared.
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleEnableBiometric}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl h-12 font-semibold btn-glow"
              data-testid="enable-biometric-button"
            >
              {loading ? (
                <>
                  <Fingerprint className="mr-2 h-5 w-5 animate-pulse" />
                  Setting up...
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-5 w-5" />
                  Enable Face ID
                </>
              )}
            </Button>

            <Button
              onClick={handleSkip}
              variant="ghost"
              className="w-full rounded-2xl h-12"
              data-testid="skip-biometric-button"
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            You can enable or disable Face ID anytime in Settings
          </p>
        </div>
      </Card>
    </div>
  );
}
