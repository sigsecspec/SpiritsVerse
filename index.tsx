import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ConfigSetup from './components/ConfigSetup';
import { isSupabaseConfigured } from './services/supabaseClient';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isSupabaseConfigured ? <App /> : <ConfigSetup />}
  </React.StrictMode>
);