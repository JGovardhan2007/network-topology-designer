import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against benign ResizeObserver notifications from canvas container resizes
const originalOnError = window.onerror;
window.onerror = function (message, source, lineno, colno, error) {
  if (
    typeof message === 'string' &&
    (message.includes('ResizeObserver loop completed') ||
      message.includes('ResizeObserver loop limit exceeded'))
  ) {
    return true; // suppresses the error
  }
  if (originalOnError) {
    return originalOnError(message, source, lineno, colno, error);
  }
  return false;
};

window.addEventListener('error', (event) => {
  if (
    event.message &&
    (event.message.includes('ResizeObserver loop completed') ||
      event.message.includes('ResizeObserver loop limit exceeded'))
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(<App />);
