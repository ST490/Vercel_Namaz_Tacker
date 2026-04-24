import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { seedIfNeeded } from '@/lib/seedData';

seedIfNeeded();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)