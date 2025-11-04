import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Smartphone, 
  Monitor, 
  X, 
  CheckCircle,
  Wifi,
  WifiOff
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    // Check if app is already installed (PWA, TWA, or standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isFromTWA = document.referrer.includes('android-app://') || 
                     window.location.search.includes('utm_source=pwa');
    
    const appInstalled = isStandalone || isInWebAppiOS || isFromTWA;
    setIsInstalled(appInstalled);

    // Only show install functionality if not already installed
    if (!appInstalled) {
      // Listen for beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        console.log('PWA: Install prompt available');
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setIsInstallable(true);
        
        // Show install prompt after delay
        setTimeout(() => setShowPrompt(true), 5000);
      };

      // Listen for app installed event
      const handleAppInstalled = () => {
        setIsInstalled(true);
        setIsInstallable(false);
        setShowPrompt(false);
        toast({
          title: "App Installed Successfully",
          description: "KAYTESS is now available on your home screen",
        });
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
      
      // Fallback: Show manual install option after delay if no auto prompt
      setTimeout(() => {
        if (!deferredPrompt && !appInstalled) {
          setShowPrompt(true);
          setIsInstallable(true);
        }
      }, 10000);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, [toast]);

  useEffect(() => {
    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          toast({
            title: "Installing App",
            description: "KAYTESS is being installed to your device",
          });
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('Installation failed:', error);
        showManualInstallInstructions();
      }
    } else {
      showManualInstallInstructions();
    }
  };

  const showManualInstallInstructions = () => {
    const isAndroid = /Android/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    
    let instructions = "";
    
    if (isAndroid && isChrome) {
      instructions = "Chrome: Menu (⋮) → Install app or Add to Home screen";
    } else if (isChrome) {
      instructions = "Chrome: Menu (⋮) → Install KAYTESS";
    } else if (isSafari) {
      instructions = "Safari: Share (⬆️) → Add to Home Screen → Add";
    } else if (isFirefox) {
      instructions = "Firefox: Menu (☰) → Install or Add to Home Screen";
    } else {
      instructions = "Look for 'Install' or 'Add to Home Screen' in your browser menu";
    }
    
    toast({
      title: "Install KAYTESS App",
      description: instructions,
      duration: 8000,
    });
  };

  const redirectToPlayStore = () => {
    // This would redirect to Play Store if you had a published app
    // For now, show install instructions
    toast({
      title: "Get KAYTESS App",
      description: "Install directly from your browser for the best experience",
      duration: 5000,
    });
    setShowPrompt(true);
  };

  // Don't show anything if app is already installed
  if (isInstalled) {
    return null;
  }

  // Don't show if user dismissed and it's not installable
  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <Card className="border-primary/20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Install KAYTESS</CardTitle>
                <p className="text-xs text-muted-foreground">Get the app experience</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPrompt(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              {isOnline ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Monitor className="h-3 w-3 mr-1" />
              PWA Ready
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="flex-1 h-9"
            >
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrompt(false)}
              className="h-9"
            >
              Later
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Works offline • No app store needed • Instant updates
          </p>
        </CardContent>
      </Card>
    </div>
  );
}