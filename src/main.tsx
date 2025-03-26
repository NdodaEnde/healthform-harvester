
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Create a small bootstrap component to handle errors during mount
const Bootstrap = () => {
  try {
    return <App />;
  } catch (error) {
    console.error("Error rendering app:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Application Error</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            There was a problem loading the application. Please refresh the page or try again later.
          </p>
          <div className="text-sm text-gray-500 mb-4">
            Error: {error instanceof Error ? error.message : String(error)}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
};

// Wait for DOM to be ready before mounting
const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  
  // Catch any render errors at the highest level
  try {
    root.render(<Bootstrap />);
  } catch (error) {
    console.error("Critical error during initial render:", error);
    
    // Try to render at least an error message
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1 style="color: red;">Critical Error</h1>
        <p>The application could not start. Please contact support.</p>
        <pre style="background: #f1f1f1; padding: 10px; text-align: left;">${
          error instanceof Error ? error.stack || error.message : String(error)
        }</pre>
        <button onclick="window.location.reload()" style="padding: 8px 16px; background: blue; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
} else {
  console.error("Could not find root element to mount app");
}
