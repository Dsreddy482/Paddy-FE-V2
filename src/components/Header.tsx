import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, Sprout, Users, Search, Menu, FileText, Truck, UserCog, MapPin, Package, Home, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserSearch } from './UserSearch';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOperationsDropdownOpen, setIsOperationsDropdownOpen] = useState(false);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const operationsDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (operationsDropdownRef.current && !operationsDropdownRef.current.contains(event.target as Node)) {
        setIsOperationsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/fields', icon: MapPin, label: 'Fields' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
  ];

  const operationsItems = [
    { path: '/paddy', icon: FileText, label: 'Paddy' },
    { path: '/loading', icon: Truck, label: 'Loading' },
    { path: '/amali', icon: UserCog, label: 'Amali' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isOperationsActive = operationsItems.some(item => location.pathname === item.path);

  return (
    <>
      <nav className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => navigate('/dashboard')}
            >
              <div className="bg-white rounded-lg p-2 shadow-md group-hover:shadow-lg transition-shadow">
                <Sprout className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Paddy Manager</h1>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-white hover:bg-green-500 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-white text-green-700 shadow-md'
                      : 'text-white hover:bg-green-500'
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </button>
              ))}

              <div className="relative" ref={operationsDropdownRef}>
                <button
                  onClick={() => setIsOperationsDropdownOpen(!isOperationsDropdownOpen)}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isOperationsActive
                      ? 'bg-white text-green-700 shadow-md'
                      : 'text-white hover:bg-green-500'
                  }`}
                >
                  Operations
                  <ChevronDown className="h-4 w-4 ml-2" />
                </button>

                {isOperationsDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 overflow-hidden z-50">
                    {operationsItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setIsOperationsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center px-4 py-3 text-sm transition-colors ${
                          isActive(item.path)
                            ? 'bg-green-50 text-green-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className="h-4 w-4 mr-3" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsUserSearchOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white hover:bg-green-500 transition-all"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </button>

              <div className="relative ml-3" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-white hover:bg-green-500 transition-all"
                >
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-md">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="font-medium">{user?.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 overflow-hidden z-50">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-green-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-600 mt-1">{user?.email}</p>
                    </div>
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-green-500">
            <div className="px-4 pt-2 pb-4 space-y-1 bg-green-600">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-white text-green-700 shadow-md'
                      : 'text-white hover:bg-green-500'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              ))}

              <div className="border-t border-green-500 my-2 pt-2">
                <p className="px-4 py-2 text-xs font-semibold text-green-200 uppercase tracking-wider">
                  Operations
                </p>
                {operationsItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive(item.path)
                        ? 'bg-white text-green-700 shadow-md'
                        : 'text-white hover:bg-green-500'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setIsUserSearchOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left flex items-center px-4 py-3 rounded-lg text-sm font-medium text-white hover:bg-green-500 transition-all"
              >
                <Search className="h-5 w-5 mr-3" />
                Search Users
              </button>

              <div className="border-t border-green-500 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center px-4 py-3 rounded-lg text-sm font-medium text-white hover:bg-red-500 transition-all"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <UserSearch
        isOpen={isUserSearchOpen}
        onClose={() => setIsUserSearchOpen(false)}
      />
    </>
  );
};

export default Header;