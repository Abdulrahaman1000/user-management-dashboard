import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../services/api';

interface UserData {
  name: string;
  email: string;
  role: string;
  password?: string;
}

export default function EditUser() {
  const [formData, setFormData] = useState<UserData>({
    name: '',
    email: '',
    role: '',
    password: '',
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    if (!id) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      console.log(`Fetching user with ID: ${id}`);
      
      const res = await api.get(`/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('User fetch response:', res.data);

      // Handle different API response structures
      let userData;
      if (res.data?.data) {
        userData = res.data.data;
      } else {
        userData = res.data;
      }

      if (userData) {
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          role: userData.role || 'user',
          password: '', // Don't include password in initial form data
        });
      }
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError('Failed to load user data. Please try again.');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Create a copy of the data to send
      const dataToUpdate = { ...formData };
      
      // Only include password if it's not empty
      if (!dataToUpdate.password || dataToUpdate.password.trim() === '') {
        delete dataToUpdate.password;
      }

      console.log(`Updating user with ID: ${id}`, dataToUpdate);
      
      // Log the exact request being made
      console.log(`PUT request to: /users/${id}`);
      console.log('Request payload:', JSON.stringify(dataToUpdate));
      console.log('Headers:', { 'Authorization': 'Bearer [token]' });
      
      // Try with a different API pattern
      const res = await api.put(`/users/${id}`, dataToUpdate, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Update response:', res);

      alert('User updated successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error updating user:', err.response || err);
      
      // Log the full error details
      if (err.response) {
        console.log('Error status:', err.response.status);
        console.log('Error headers:', err.response.headers);
        console.log('Error data:', err.response.data);
      }
      
      // Better error handling
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          router.push('/login');
        }, 2000);
        return;
      }
      
      setError(err.response?.data?.message || 'Failed to update user. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit User</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded transition"
        >
          Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Name
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password (Leave blank to keep unchanged)
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Leave blank to keep current password"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
            Role
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Update User'}
          </button>
        </div>
      </form>
    </div>
  );
}