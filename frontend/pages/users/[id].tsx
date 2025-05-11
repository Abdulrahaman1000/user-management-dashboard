import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../services/api';

interface UserData {
  name: string;
  email: string;
  role: string;
  status: string;
  password?: string;
  profilePhoto?: File | null;
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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const router = useRouter();

  const addDebug = (message: string) => {
    console.log(message);
    setDebugInfo(prev => [...prev, message]);
  };

  useEffect(() => {
    if (router.isReady && router.query.id) {
      fetchUser();
    }
  }, [router.isReady, router.query]);

  const fetchUser = async () => {
    if (!router.query.id) {
      addDebug('No user ID found in query parameters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addDebug('No authentication token found');
        router.push('/login');
        return;
      }

      const userId = router.query.id as string;
      addDebug(`Starting fetch for user ID: ${userId}`);

      const timeoutId = setTimeout(() => {
        addDebug('User fetch timed out');
        setAlert({ type: 'error', message: 'Request timed out. Please try again.' });
        setLoading(false);
      }, 10000);

      const res = await api.get(`/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 8000
      });

      clearTimeout(timeoutId);
      addDebug('User data received from API');

      const userData = res.data?.data || res.data?.user || res.data;
      if (!userData) {
        addDebug('No user data found in response');
        throw new Error('Invalid user data structure');
      }

      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'user',
        status: userData.status || 'active',
      });

      if (userData.profilePhoto) {
        const photoUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/uploads/${userData.profilePhoto}?ts=${Date.now()}`;
        addDebug(`Setting profile photo preview: ${photoUrl}`);
        setPhotoPreview(photoUrl);
      }
    } catch (err: any) {
      addDebug(`Error fetching user: ${err.message}`);
      const errorMessage = err.response?.data?.message || 'Failed to load user data. Please try again.';
      setAlert({ type: 'error', message: errorMessage });

      if (err.response?.status === 401) {
        addDebug('Unauthorized, redirecting to login');
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

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
    addDebug('Starting user update process');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addDebug('No authentication token found');
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
        addDebug('Password included in update');
      }
      
      if (formData.profilePhoto) {
        formDataToSend.append('profilePhoto', formData.profilePhoto);
        addDebug('Profile photo included in update');
      }

      await api.put(`/users/${router.query.id}`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      addDebug('User update successful');
      setAlert({ type: 'success', message: 'User updated successfully!' });
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      addDebug(`Update error: ${err.message}`);
      const errorMessage = err.response?.data?.message || 'Failed to update user. Please try again.';
      setAlert({ type: 'error', message: errorMessage });

      if (err.response?.status === 401) {
        addDebug('Unauthorized, redirecting to login');
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setUpdating(false);
    }
  };

  const forceContinue = () => {
    addDebug('Force continuing past loading state');
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-xl mb-4">Loading user data...</p>
{/*         
        <div className="mt-8 p-4 bg-gray-100 rounded-lg max-w-2xl w-full">
          <h3 className="font-bold mb-2">Debug Information:</h3>
          <pre className="text-xs overflow-auto max-h-64 bg-gray-200 p-2 rounded">
            {debugInfo.map((msg, i) => (
              <div key={i} className="mb-1">{`[${i}] ${msg}`}</div>
            ))}
          </pre>
          <button 
            onClick={forceContinue} 
            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Force Continue
          </button>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="mt-4 ml-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div> */}
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
        <div className={`${alert.type === 'error' 
          ? 'bg-red-100 border-red-400 text-red-700' 
          : 'bg-green-100 border-green-400 text-green-700'} 
          border px-4 py-3 rounded mb-4`}>
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
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="profilePhoto">
            Profile Photo
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="profilePhoto"
            type="file"
            name="profilePhoto"
            accept="image/*"
            onChange={handleFileChange}
          />
          {photoPreview && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-1">Preview:</p>
              <img 
                src={photoPreview} 
                alt="Profile preview" 
                className="w-24 h-24 object-cover rounded-full border"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            disabled={updating}
          >
            {updating ? (
              <span className="flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Updating...
              </span>
            ) : (
              'Update User'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}