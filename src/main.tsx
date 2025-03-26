
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
  createRoot(rootElement).render(<Bootstrap />);
} else {
  console.error("Could not find root element to mount app");
}
