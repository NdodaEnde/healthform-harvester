
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Create root with error handling
const container = document.getElementById("root");
if (!container) throw new Error("Failed to find the root element");

const root = createRoot(container);
root.render(<App />);
