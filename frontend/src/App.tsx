import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Watchlists from './components/Watchlists';
import Chatbox from './components/Chatbox';
import './styles/main.css';

// Full-page chat route component
function ChatPage() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="w-full h-full">
        <Chatbox isOpen={true} onClose={() => {}} fullWidth={true} />
      </div>
    </div>
  );
}

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                ASX Stock Dashboard
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Welcome, Investor
                </span>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">T</span>
                </div>
              </div>
            </div>
          </header>
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/watchlists" element={<Watchlists />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/portfolio" element={
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
                  <p className="text-gray-600">Portfolio management coming soon...</p>
                </div>
              } />
              <Route path="/analysis" element={
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Market Analysis</h2>
                  <p className="text-gray-600">AI-powered market analysis coming soon...</p>
                </div>
              } />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
