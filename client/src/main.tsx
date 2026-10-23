import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/controls.css';
import './styles/status.css';
import './styles/table.css';
import './styles/pagination.css';
import './styles/stats.css';
import './styles/feedback.css';
import './styles/login.css';
import './styles/profile.css';
import './styles/sample-details.css';

import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);