import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Card } from './ui/card';
import { QrCode, Copy, Share2, Download, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function QRCodeShare({ user, type = 'profile', betId = null, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    if (type === 'profile') {
      return `${baseUrl}/user/${user?.user_id}`;
    } else if (type === 'bet' && betId) {
      return `${baseUrl}/bets/${betId}`;
    }
    return baseUrl;
  };

  const getShareData = () => {
    if (type === 'profile') {
      return {
        title: `${user?.name}'s BETZ Profile`,
        text: `Challenge me on BETZ! My Betz ID: ${user?.betz_id}`,
        url: getShareUrl()
      };
    } else if (type === 'bet') {
      return {
        title: 'BETZ - Challenge',
        text: 'Check out this bet on BETZ!',
        url: getShareUrl()
      };
    }
    return { title: 'BETZ', text: 'Join me on BETZ!', url: getShareUrl() };
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    const shareData = getShareData();
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = type === 'profile' ? `betz-${user?.betz_id}.png` : `betz-bet-${betId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      toast.success('QR Code downloaded!');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            {type === 'profile' ? 'Share Profile' : 'Share Bet'}
          </DialogTitle>
          <DialogDescription>
            {type === 'profile' 
              ? 'Share your BETZ profile via QR code or link'
              : 'Share this bet with others'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* QR Code Display */}
          <Card className="p-6 bg-white rounded-xl flex flex-col items-center justify-center">
            <QRCodeSVG
              id="qr-code-svg"
              value={getShareUrl()}
              size={200}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#1a1a1a"
            />
            {type === 'profile' && user?.betz_id && (
              <p className="mt-3 text-sm font-mono text-gray-800 font-semibold">
                {user.betz_id}
              </p>
            )}
          </Card>

          {/* Share URL */}
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-muted/30 rounded-lg text-xs font-mono truncate">
              {getShareUrl()}
            </div>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="icon"
              className="rounded-lg h-10 w-10"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleDownloadQR}
              variant="outline"
              className="rounded-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Save QR
            </Button>
            <Button
              onClick={handleShare}
              className="btn-premium text-white rounded-xl"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Betz ID for quick copy */}
          {type === 'profile' && user?.betz_id && (
            <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/30">
              <p className="text-xs text-muted-foreground mb-1">Quick Add - Betz ID</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user.betz_id);
                  toast.success('Betz ID copied!');
                }}
                className="text-lg font-mono font-bold text-primary hover:text-accent transition-colors"
              >
                {user.betz_id}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
