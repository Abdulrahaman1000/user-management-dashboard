import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import api from '../../services/api';
import Image from 'next/image';

interface UserData {
  name: string;
  email: string;
  role: string;
  status: string;
  password?: string;
  profilePhoto?: File | null;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

interface UserApiResponse {
  data?: {
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    profilePhoto?: string;
  };
  user?: {
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    profilePhoto?: string;
  };
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  profilePhoto?: string;
}

export default function EditUser() {
  const [formData, setFormData] = useState<UserData>({
    name: '',
    email: '',
    role: 'user',
    status: 'active',
    password: '',
    profilePhoto: null,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    if (!router.query.id) {
      console.log('No user ID found in query parameters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found');
        router.push('/login');
        return;
      }

      const userId = router.query.id as string;

      const res = await api.get<UserApiResponse>(`/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 8000,
      });

      const userData = res.data?.data || res.data?.user || res.data;
      if (!userData) {
        console.log('No user data found in response');
        throw new Error('Invalid user data structure');
      }

      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'user',
        status: userData.status || 'active',
        password: '',
      });

      if (userData.profilePhoto) {
        const photoUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/uploads/${userData.profilePhoto}?ts=${Date.now()}`;
        setPhotoPreview(photoUrl);
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      const errorMessage = error.response?.data?.message || 'Failed to load user data. Please try again.';
      setAlert({ type: 'error', message: errorMessage });

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (router.isReady && router.query.id) {
      fetchUser();
    }
  }, [router.isReady, router.query.id, fetchUser]);

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Invalid email format';
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        profilePhoto: file,
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const validationError = validateForm();
    if (validationError) {
      setAlert({ type: 'error', message: validationError });
      return;
    }

    setUpdating(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('role', formData.role);
      formDataToSend.append('status', formData.status);

      if (formData.password?.trim()) {
        formDataToSend.append('password', formData.password);
      }

      if (formData.profilePhoto) {
        formDataToSend.append('profilePhoto', formData.profilePhoto);
      }

      await api.put(`/users/${router.query.id}`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setAlert({ type: 'success', message: 'User updated successfully!' });
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: unknown) {
      const error = err as ApiError;
      const errorMessage = error.response?.data?.message || 'Failed to update user. Please try again.';
      setAlert({ type: 'error', message: errorMessage });

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-xl mb-4">Loading user data...</p>
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

      {alert && (
        <div className={`${alert.type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'} border px-4 py-3 rounded mb-4`}>
          {alert.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Name *
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
            Email *
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
            Password (Leave blank to keep current)
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
          />
        </div>

        <div className="mb-4">
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

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
            Status
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="profilePhoto">
            Profile Photo
          </label>
          <input
            type="file"
            id="profilePhoto"
            name="profilePhoto"
            accept="image/*"
            onChange={handleFileChange}
            className="mb-2"
          />
          {photoPreview && (
            <div className="relative w-32 h-32 mt-2">
              <Image 
                src={photoPreview} 
                alt="Profile Preview" 
                layout="fill" 
                objectFit="cover"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          disabled={updating}
        >
          {updating ? 'Updating...' : 'Update User'}
        </button>
      </form>
    </div>
  );
}