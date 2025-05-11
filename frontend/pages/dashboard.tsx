// Fixed Dashboard.js
import { useEffect, useState } from 'react'; 
import { useRouter } from 'next/router'; 
import api from '../services/api'; 

interface User {
  _id: string;
  email: string;
  role?: string;
  name?: string;
}

export default function Dashboard() { 
  const [users, setUsers] = useState<User[]>([]); 
  const [loading, setLoading] = useState(true); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const fetchUsers = async (page: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await api.get(`/users?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('API Response:', res.data);
      
      // Extract pagination data
      if (res.data?.pages) {
        setTotalPages(res.data.pages);
      }
      if (res.data?.currentPage) {
        setCurrentPage(res.data.currentPage);
      }
      
      // Extract users based on the API response format
      let usersData: User[] = [];
      
      if (res.data?.data && Array.isArray(res.data.data)) {
        usersData = res.data.data;
      } else if (Array.isArray(res.data)) {
        usersData = res.data;
      } else if (Array.isArray(res.data.users)) {
        usersData = res.data.users;
      } else {
        console.error('Could not extract users from response:', res.data);
        usersData = [];
      }
      
      // Check if the current user is an admin
      const currentUser = usersData.find(user => user.role === 'admin');
      
      if (currentUser) {
        setIsAdmin(true);
      } else {
        // Alternative: Check if there's admin info in the response
        if (res.data?.user?.role === 'admin' || res.data?.currentUser?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
      
      setUsers(usersData);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      if (err.response?.status === 401) {
        handleLogout();
      }
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    router.push('/users/add');
  };

  const handleEditUser = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await api.delete(`/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (res.status === 200 || res.status === 204) {
        // Success - refresh the user list
        await fetchUsers(currentPage);
        alert('User deleted successfully');
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert(`Failed to delete user: ${err.response?.data?.message || 'Unknown error'}`);
      setLoading(false);
    }
  };
  
  // FIXED: Logout function - force navigation
  const handleLogout = () => {
    localStorage.clear(); // Clear all localStorage items, not just token
    sessionStorage.clear(); // Also clear sessionStorage in case it's used
    // Use replace instead of push to prevent going back with browser history
    window.location.href = '/';
  };
  
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setLoading(true);
    fetchUsers(page);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <p className="text-xl">Loading...</p>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button 
          onClick={handleLogout}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
        >
          Logout
        </button>
      </div>

      {isAdmin ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Manage Users</h2>
            <button
              onClick={handleAddUser}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
            >
              Add User
            </button>
          </div>
          
          {users.length > 0 ? (
            <>
              <div className="bg-white shadow rounded-lg overflow-hidden mb-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user._id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{user.role || 'user'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleEditUser(user._id)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 bg-gray-100 rounded">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 italic">No users found.</p>
          )}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your User Dashboard</h2>
          <p className="mb-6">Welcome home!</p>
          
          {users.length > 0 && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="mb-2"><strong>Email:</strong> {users[0].email}</p>
              <p><strong>ID:</strong> {users[0]._id}</p>
              {users[0].name && <p><strong>Name:</strong> {users[0].name}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
