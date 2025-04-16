
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add startup logging
console.log('Application starting...');
console.log('Environment:', import.meta.env.MODE);

// Log whether running in Docker or not
try {
  fetch('/assets/gemma3-1b-it-int4.task', { method: 'HEAD' })
    .then(response => {
      console.log('Model file check result:', response.status, response.ok);
    })
    .catch(error => {
      console.error('Error checking model file:', error);
    });
} catch (error) {
  console.error('Failed to check model file:', error);
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found! Application cannot start.');
} else {
  console.log('Root element found, mounting application...');
  createRoot(rootElement).render(<App />);
  console.log('Application mounted successfully');
}
