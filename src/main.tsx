import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { seedIfNeeded } from '@/lib/seedData';
import { initStorage } from '@/lib/storage';

async function startApp() {
  // Initialize storage from IndexedDB before anything else
  await initStorage();
  
  // Seed sample data if needed
  seedIfNeeded();

  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  )
}

startApp();