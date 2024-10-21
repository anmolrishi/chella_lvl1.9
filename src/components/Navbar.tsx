import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Phone, Settings, PhoneCall, ChevronLeft, ChevronRight, LogOut, BarChart2, Home } from 'lucide-react';

interface NavbarProps {
  onOpenCallerConfig: () => void;
  onOpenEditRestaurantInfo: () => void;
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Navbar({ onOpenCallerConfig, onOpenEditRestaurantInfo, isExpanded, setIsExpanded }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('An error occurred while signing out. Please try again.');
    }
  };

  return (
    <nav className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          {isExpanded && (
            <div className="flex items-center">
              <Phone className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-black">FoodieBot</h1>
            </div>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-blue-600 transition-colors duration-300"
          >
            {isExpanded ? (
              <ChevronLeft className="h-6 w-6" />
            ) : (
              <ChevronRight className="h-6 w-6" />
            )}
          </button>
        </div>
        <div className="flex-grow py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center px-6 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 ${isExpanded ? 'justify-start' : 'justify-center'}`}
          >
            <Home className="h-6 w-6" strokeWidth={1.5} />
            {isExpanded && <span className="ml-3 font-semibold">Dashboard</span>}
          </button>
          <button
            onClick={onOpenCallerConfig}
            className={`w-full flex items-center px-6 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 ${isExpanded ? 'justify-start' : 'justify-center'}`}
          >
            <PhoneCall className="h-6 w-6" strokeWidth={1.5} />
            {isExpanded && <span className="ml-3 font-semibold">Caller Config</span>}
          </button>
          <button
            onClick={onOpenEditRestaurantInfo}
            className={`w-full flex items-center px-6 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 ${isExpanded ? 'justify-start' : 'justify-center'}`}
          >
            <Settings className="h-6 w-6" strokeWidth={1.5} />
            {isExpanded && <span className="ml-3 font-semibold">Restaurant Info</span>}
          </button>
          <button
            onClick={() => navigate('/analytics')}
            className={`w-full flex items-center px-6 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 ${isExpanded ? 'justify-start' : 'justify-center'}`}
          >
            <BarChart2 className="h-6 w-6" strokeWidth={1.5} />
            {isExpanded && <span className="ml-3 font-semibold">Analytics</span>}
          </button>
        </div>
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center px-6 py-4 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-300 ${isExpanded ? 'justify-start' : 'justify-center'}`}
        >
          <LogOut className="h-6 w-6" strokeWidth={1.5} />
          {isExpanded && <span className="ml-3 font-semibold">Sign Out</span>}
        </button>
      </div>
    </nav>
  );
}