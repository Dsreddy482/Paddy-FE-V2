import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Edit, Trash2, Mail, Phone, MapPin, User as UserIcon } from 'lucide-react';
import { authService } from '../services/auth';
import { AddUserModal } from '../components/AddUserModal';
import { User } from '../types/auth';
import { Header } from '../components/Header';

type UserRole = 'all' | 'vendor' | 'rythu';

export const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRole, setActiveRole] = useState<UserRole>('all');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authService.searchUsers('All');
      setUsers(response);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (userData: {
    fullName: string;
    email: string;
    password: string;
    role: string;
    phoneNumber: string;
  }) => {
    try {
      //await authService.register(userData);
      await fetchUsers();
      setIsAddUserModalOpen(false);
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const handleEditUser = async (userData: {
    fullName: string;
    email: string;
    password?: string;
    role: string;
    phone?: string;
    location?: string;
  }) => {
    if (!editingUser) return;

    try {
      //await authService.updateUser(editingUser.id, userData);
      await fetchUsers();
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      //await authService.deleteUser(userId);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = activeRole === 'all' || user.role?.toLowerCase() === activeRole;
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phoneNumber && user.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveRole('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeRole === 'all'
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All Users ({users.length})
                </button>
                <button
                  onClick={() => setActiveRole('vendor')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeRole === 'vendor'
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Vendors ({users.filter(u => u.role?.toLowerCase() === 'vendor').length})
                </button>
                <button
                  onClick={() => setActiveRole('rythu')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeRole === 'rythu'
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Rythus ({users.filter(u => u.role?.toLowerCase() === 'rythu').length})
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="p-4">
              <div className="bg-red-50 text-red-800 p-4 rounded-md">{error}</div>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <h2 className="text-lg font-medium text-gray-900">{user.name}</h2>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {/* <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button> */}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-gray-500">
                      <Mail className="h-4 w-4 mr-2" />
                      {user.email}
                    </div>
                    {user.phoneNumber && (
                      <div className="flex items-center text-gray-500">
                        <Phone className="h-4 w-4 mr-2" />
                        {user.phoneNumber}
                      </div>
                    )}
                   
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => navigate(`/user/${user.id}`)}
                      className="w-full text-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddUserModal
        isOpen={isAddUserModalOpen || !!editingUser}
        onClose={() => {
          setIsAddUserModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={editingUser ? handleEditUser : handleAddUser}
        editingUser={editingUser}
      />
    </div>
  );
};

export default UserManagement;