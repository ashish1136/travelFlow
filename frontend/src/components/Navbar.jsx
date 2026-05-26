import React, { useContext } from 'react';
import { Plane, Map as MapIcon, Calendar, Info, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <Link to="/" className="text-xl font-bold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              TravelFlow
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-slate-600 hover:text-primary transition-colors flex items-center gap-1 font-medium">
              <MapIcon className="w-4 h-4" />
              Plan Trip
            </Link>
            {user && (
              <Link to="/my-itineraries" className="text-slate-600 hover:text-primary transition-colors flex items-center gap-1 font-medium">
                <Calendar className="w-4 h-4" />
                My Itineraries
              </Link>
            )}
            {!user ? (
              <Link to="/login">
                <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-lg active:scale-95">
                  Sign In
                </button>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <span className="font-medium text-slate-700">{user.name}</span>
                <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1 font-medium">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
          
          <div className="md:hidden">
            <button className="p-2 text-slate-600">
              <MapIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
