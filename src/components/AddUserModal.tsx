import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from './Input';
import { authService } from '../services/auth';
import Alert from './Alert';
import { User } from '../types/auth';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: string;
  }) => void;
  editingUser?: User | null;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingUser
}) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    role: '',
    password: ''
  });

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || '',
        email: editingUser.email || '',
        phoneNumber: editingUser.phoneNumber || '',
        role: editingUser.role?.toLowerCase() || '',
        password: ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        role: '',
        password: ''
      });
    }
  }, [editingUser, isOpen]);

  if (!isOpen) return null;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.role) {
      setError('Please select a role');
      return;
    }

    const userData = {
      fullName: formData.name,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      role: formData.role,
      password: ''
    };

    try {
      if (editingUser) {
        // Update existing user
        await authService.updateUser(editingUser.id, userData);
        setSuccess('User updated successfully!');
      } else {
        // Create new user
        const res = await authService.register(userData);
        if (res) {
          setSuccess('User created successfully!');
        } else {
          throw new Error('Failed to create user');
        }
      }

      setTimeout(() => {
        onSubmit(userData);
        setSuccess('');
        onClose();
      }, 2000);
    } catch (err) {
      setError(editingUser ? 'Failed to update user' : 'Failed to create user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                type="text"
                required
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
              />

              <Input
                label="Email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />

              <Input
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                required
                autoComplete="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
              />

              {/* {!editingUser && (
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  required={!editingUser}
                  autoComplete="new-password"
                />
              )} */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  required
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="">Select a role</option>
                  <option value="vendor">Vendor</option>
                  <option value="rythu">Rythu</option>
                </select>
              </div>

              {error && (
                <Alert 
                  type="error" 
                  message={error}
                />
              )}

              {success && (
                <Alert 
                  type="success" 
                  message={success}
                />
              )}

              <div className="mt-5 sm:mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:text-sm"
                >
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};