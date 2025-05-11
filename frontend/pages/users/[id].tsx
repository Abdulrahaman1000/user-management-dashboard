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
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const router = useRouter();

  // Debug function to log information
  const addDebug = (message: string) => {
    console.log(message);
    setDebugInfo(prev => [...prev, message]);
  };

  useEffect(() => {
    addDebug(`Router is ready: ${router.isReady}`);
    addDebug(`Router query: ${JSON.stringify(router.query)}`);
    
    // Only fetch if router is ready and id exists
    if (router.isReady && router.query.id) {
      addDebug(`About to fetch user with ID: ${router.query.id}`);
      fetchUser();
    } else {
      addDebug('Waiting for router to be ready or ID to be available');
    }
  }, [router.isReady, router.query]);

  const fetchUser = async () => {
    if (!router.query.id) {
      addDebug('No ID in router.query, cannot fetch user');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addDebug('No token found, redirecting to login');
        router.push('/login');
        return;
      }
      
      const userId = router.query.id as string;
      addDebug(`Fetching user with ID: ${userId}`);
      
      // Add a timeout to ensure we don't get stuck in an infinite loading state
      const timeoutId = setTimeout(() => {
        addDebug('API call timed out after 10 seconds');
        setLoading(false);
        setError('Request timed out. Please try again.');
      }, 10000);
      
      try {
        const res = await api.get(`/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 8000 // Set timeout on Axios request
        });
        
        // Clear timeout since we got a response
        clearTimeout(timeoutId);
        
        addDebug(`API Response received: ${res.status}`);
        addDebug(`Response data: ${JSON.stringify(res.data).substring(0, 200)}...`);

        // Handle different API response structures
        let userData;
        if (res.data?.data) {
          userData = res.data.data;
          addDebug('Found user data in res.data.data');
        } else if (res.data?.user) {
          userData = res.data.user;
          addDebug('Found user data in res.data.user');
        } else {
          userData = res.data;
          addDebug('Using res.data directly as user data');
        }

        if (userData) {
          addDebug(`User data extracted: ${JSON.stringify(userData).substring(0, 200)}...`);
          
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            role: userData.role || 'user',
            status: userData.status || 'active',
            password: '', // Don't include password in initial form data
          });
          
          addDebug('Form data set successfully');
          
          // If user has a profile photo
          if (userData.profilePhoto) {
            const photoUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/uploads/${userData.profilePhoto}?ts=${Date.now()}`;
            addDebug(`Setting photo preview URL: ${photoUrl}`);
            setPhotoPreview(photoUrl);
          } else {
            addDebug('No profile photo found in user data');
          }
        } else {
          addDebug('No user data found in response');
          setError('Could not find user data in the response');
        }
      } catch (err: any) {
        // Clear timeout if there's an error
        clearTimeout(timeoutId);
        
        addDebug(`Error in API call: ${err.message}`);
        if (err.response) {
          addDebug(`Error response: ${JSON.stringify(err.response.data)}`);
        }
        
        throw err; // Re-throw for the outer catch to handle
      }
    } catch (err: any) {
      addDebug(`Error fetching user: ${err.message}`);
      setError('Failed to load user data. Please try again.');
      
      if (err.response?.status === 401) {
        addDebug('401 unauthorized error, clearing token');
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      addDebug('Setting loading to false');
      setLoading(false);
    }
  };

  // Regular form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        profilePhoto: file
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    addDebug('Submitting form');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addDebug('No token found, redirecting to login');
        router.push('/login');
        return;
      }
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('role', formData.role);
      formDataToSend.append('status', formData.status);
      
      // Only include password if it's not empty
      if (formData.password && formData.password.trim() !== '') {
        formDataToSend.append('password', formData.password);
      }
      
      // Add profile photo if it exists
      if (formData.profilePhoto instanceof File) {
        formDataToSend.append('profilePhoto', formData.profilePhoto);
        addDebug('Added profile photo to form data');
      }
      
      const userId = router.query.id as string;
      addDebug(`Submitting update for user ID: ${userId}`);
      
      const res = await api.put(`/users/${userId}`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      addDebug(`Update response: ${res.status}`);
      alert('User updated successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      addDebug(`Error updating user: ${err.message}`);
      if (err.response) {
        addDebug(`Error response: ${JSON.stringify(err.response.data)}`);
      }
      
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

  const forceContinue = () => {
    addDebug('Forcing continue past loading state');
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-xl mb-4">Loading user data...</p>
        
        {/* Debug information */}
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
        </div>
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

      {/* Debug information (collapsed by default) */}
      <details className="mb-4 bg-gray-100 p-2 rounded">
        <summary className="cursor-pointer font-semibold">Debug Info</summary>
        <pre className="text-xs overflow-auto max-h-40 bg-gray-200 p-2 rounded mt-2">
          {debugInfo.map((msg, i) => (
            <div key={i} className="mb-1">{`[${i}] ${msg}`}</div>
          ))}
        </pre>
      </details>

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
            {updating ? 'Updating...' : 'Update User'}
          </button>
        </div>
      </form>
    </div>
  );
}