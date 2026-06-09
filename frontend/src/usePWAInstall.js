import { useState, useEffect } from 'react';

export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if the application is already running in standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent default browser install dialog from automatically popping up
      e.preventDefault();
      // Store the event so we can trigger it later via our custom button
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA was successfully installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      return false;
    }
    // Show the custom browser install prompt
    deferredPrompt.prompt();
    // Wait for the user choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User choice for PWA installation: ${outcome}`);

    // Clean up the deferred prompt
    setDeferredPrompt(null);
    setIsInstallable(false);

    return outcome === 'accepted';
  };

  // Only show the install button if it's installable and not already installed
  return { isInstallable: isInstallable && !isInstalled, installApp };
}
