import { useState, useEffect, useCallback } from 'react';
import {
  canUseNativeInstall,
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  isIOS,
  isStandaloneMode,
  onAppInstalled,
  onInstallBannerRequested,
  onInstallPromptAvailable,
  triggerNativeInstall,
} from '../utils/pwaInstall';

const DISMISS_KEY = 'spiritsverse-pwa-dismissed-v2';

export function usePwaInstall() {
  const [installReady, setInstallReady] = useState(() => canUseNativeInstall());
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneMode()) {
      setIsInstalled(true);
      return;
    }

    const syncPrompt = () => setInstallReady(canUseNativeInstall());

    const unsubPrompt = onInstallPromptAvailable(() => {
      syncPrompt();
      setShowManualGuide(false);
      if (!dismissed) setBannerVisible(true);
    });

    const unsubInstalled = onAppInstalled(() => {
      setIsInstalled(true);
      setInstallReady(false);
      setBannerVisible(false);
      clearDeferredInstallPrompt();
    });

    const unsubOpen = onInstallBannerRequested(() => {
      localStorage.removeItem(DISMISS_KEY);
      setDismissed(false);
      setBannerVisible(true);
      if (isIOS()) setShowIOSGuide(true);
      if (canUseNativeInstall()) setShowManualGuide(false);
    });

    // Show banner after brief delay on mobile / when native prompt is already available
    let timer: number | undefined;
    if (!dismissed && !isStandaloneMode()) {
      timer = window.setTimeout(() => {
        if (canUseNativeInstall() || isIOS()) {
          setBannerVisible(true);
          if (isIOS()) setShowIOSGuide(true);
        }
      }, 2000);
    }

    syncPrompt();

    return () => {
      unsubPrompt();
      unsubInstalled();
      unsubOpen();
      if (timer) window.clearTimeout(timer);
    };
  }, [dismissed]);

  const canInstall = installReady && !isInstalled;
  const showPrompt = bannerVisible && !dismissed && !isInstalled;

  const install = useCallback(async () => {
    if (isInstalled) return;

    if (isIOS() || !getDeferredInstallPrompt()) {
      setShowIOSGuide(isIOS());
      setShowManualGuide(!isIOS());
      setBannerVisible(true);
      return;
    }

    setIsInstalling(true);
    try {
      const outcome = await triggerNativeInstall();
      setInstallReady(canUseNativeInstall());
      if (outcome === 'accepted') {
        setBannerVisible(false);
      } else if (outcome === 'unavailable') {
        setShowManualGuide(true);
      }
    } catch (error) {
      console.error('PWA install failed:', error);
      setShowManualGuide(true);
    } finally {
      setIsInstalling(false);
    }
  }, [isInstalled]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
    setBannerVisible(false);
    setShowIOSGuide(false);
    setShowManualGuide(false);
  }, []);

  return {
    canInstall,
    showPrompt,
    showIOSGuide,
    showManualGuide,
    isInstalled,
    isInstalling,
    install,
    dismiss,
  };
}
