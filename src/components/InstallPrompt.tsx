import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallPromptProps {
  language?: 'en' | 'ta' | 'tanglish';
  className?: string;
  variant?: 'banner' | 'button' | 'card';
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ 
  language = 'en',
  className = '',
}) => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  
  const handleInstallClick = () => {
    if (isInstallable && promptInstall) {
      promptInstall();
    } else if (isIOS) {
      alert(language === 'ta' ? 'கீழே உள்ள Share பட்டனை அழுத்தி "Add to Home Screen" என்பதை தேர்ந்தெடுக்கவும்.' : 'Tap the Share icon at the bottom and select "Add to Home Screen" to install.');
    } else {
      alert(language === 'ta' ? 'பிரவுசர் மெனுவில் சென்று "Install App" அல்லது "Add to Home Screen" என்பதை கிளிக் செய்யவும்.' : 'Click "Install App" or "Add to Home Screen" in your browser menu (top right 3 dots).');
    }
  };

  const installLabel =
    language === 'ta'
      ? 'ஆப் இன்ஸ்டால் செய்க'
      : language === 'tanglish'
      ? 'App Install பண்ணுங்க'
      : 'Install as App';

  return (
    <div
      id="pwa-install-small-btn"
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-[#090d16]/90 p-1 pl-3.5 shadow-xl shadow-blue-950/50 backdrop-blur-xl transition-all duration-200 hover:scale-105 hover:border-cyan-400/60 ${className}`}
    >
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 text-xs font-bold text-white transition-colors hover:text-cyan-300"
        title={installLabel}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-sm shadow-blue-500/30">
          <Download className="h-3.5 w-3.5" />
        </div>
        <span className="tracking-tight pr-1">{installLabel}</span>
      </button>

      <button 
        onClick={() => setDismissed(true)}
        className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Close install prompt"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
