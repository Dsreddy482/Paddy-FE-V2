import React, { useState, useEffect } from 'react';
import { Search, X, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/auth';
import { authService } from '../services/auth';

interface UserSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setUsers([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const results = await authService.searchUsers(searchQuery);
        setUsers(results);
      } catch (err) {
        setError('Failed to fetch users');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 w-full max-w-lg sm:align-middle mx-4 sm:mx-auto">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Search Users</h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full rounded-md border-gray-300 pl-10 h-12 focus:border-green-500 focus:ring-green-500 text-base sm:text-sm"
                placeholder="Search by name, email, or phone number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="mt-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {loading ? (
                <div className="text-center py-4">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-green-500 border-r-transparent"></div>
                </div>
              ) : error ? (
                <p className="text-center text-red-500 py-4">{error}</p>
              ) : users.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  {searchQuery.trim() ? 'No users found' : 'Start typing to search users'}
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <li
                      key={user.id}
                      className="py-4 px-2 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleUserClick(user.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-800 font-medium">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {user.email}
                          </p>
                          {user.phone && (
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <Phone className="h-4 w-4 mr-1" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};