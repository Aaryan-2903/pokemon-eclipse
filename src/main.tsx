import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const savedTheme = window.localStorage.getItem('pokemon-3d-theme');
document.documentElement.dataset.theme = savedTheme === 'midnight-blue' ? 'midnight-blue' : 'eclipse-red';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
