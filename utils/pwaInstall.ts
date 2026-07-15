export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_EVENT = 'spiritsverse-pwa-install-available';
const OPEN_BANNER_EVENT = 'spiritsverse-pwa-open-banner';

let deferredPrompt: BeforeInstallPromptEvent | null = null;

/** Capture beforeinstallprompt as early as possible (before React mounts). */
export function initPwaInstallCapture() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent(INSTALL_EVENT));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('spiritsverse-pwa-installed'));
  });
}

export function getDeferredInstallPrompt() {
  return deferredPrompt;
}

export function clearDeferredInstallPrompt() {
  deferredPrompt = null;
}

export function onInstallPromptAvailable(listener: () => void) {
  window.addEventListener(INSTALL_EVENT, listener);
  return () => window.removeEventListener(INSTALL_EVENT, listener);
}

export function onAppInstalled(listener: () => void) {
  window.addEventListener('spiritsverse-pwa-installed', listener);
  return () => window.removeEventListener('spiritsverse-pwa-installed', listener);
}

export function requestInstallBanner() {
  window.dispatchEvent(new CustomEvent(OPEN_BANNER_EVENT));
}

export function onInstallBannerRequested(listener: () => void) {
  window.addEventListener(OPEN_BANNER_EVENT, listener);
  return () => window.removeEventListener(OPEN_BANNER_EVENT, listener);
}

export function isStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/i.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream;
}

export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

export function canUseNativeInstall(): boolean {
  return Boolean(deferredPrompt) && !isStandaloneMode();
}

export async function triggerNativeInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  const prompt = deferredPrompt;
  deferredPrompt = null;
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  return outcome;
}
