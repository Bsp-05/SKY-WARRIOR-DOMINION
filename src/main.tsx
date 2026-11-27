// Entry point: mount the App into the #root element from index.html.
// The global styles (Tailwind + HUD fonts) are imported here so the
// bundler includes them exactly once, before the first render.
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Sky Warrior Dominion: missing #root element in index.html');
}

createRoot(rootElement).render(<App />);
