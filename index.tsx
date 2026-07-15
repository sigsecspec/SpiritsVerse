import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import ConfigSetup from './components/ConfigSetup';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import { isSupabaseConfigured } from './services/supabaseClient';
import { initPwaInstallCapture } from './utils/pwaInstall';

initPwaInstallCapture();

registerSW({
  immediate: true,
  onRegisterError(error) {
    console.error('Service worker registration failed:', error);
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isSupabaseConfigured ? <App /> : <ConfigSetup />}
    <PwaInstallPrompt />
  </React.StrictMode>
);