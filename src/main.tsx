import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import './ui/styles/tokens.css';
import './ui/styles/app.css';
import './ui/styles/editor.css';
import './ui/styles/player.css';
import './ui/styles/ride.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
