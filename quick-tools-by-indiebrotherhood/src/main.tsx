import { PrivateWorkspaceGate } from '../../shared/PrivateWorkspaceGate';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(<StrictMode><PrivateWorkspaceGate><App /></PrivateWorkspaceGate></StrictMode>);
