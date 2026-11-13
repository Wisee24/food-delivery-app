import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/app.css';
import App from './App';

// Feature-detect native Popover API and load polyfill only when needed
if (
  typeof HTMLElement !== 'undefined' &&
  !Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'popover')
) {
  void import('@oddbird/popover-polyfill');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
