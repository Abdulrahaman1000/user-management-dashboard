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
  const [searchQuery, setSearchQuery] = useState('');
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

      // Extract pagination data
      if (res.data?.pages) {
        setTotalPages(res.data.pages);
      }
      if (res.data?.currentPage) {
        setCurrentPage(res.data.currentPage);
      }

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

      const currentUser = usersData.find(user => user.role === 'admin');
      if (currentUser) {
        setIsAdmin(true);
      } else {
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
        await fetchUsers(currentPage);
        alert('User deleted successfully');
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert(`Failed to delete user: ${err.response?.data?.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setLoading(true);
    fetchUsers(page);
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user._id.includes(searchQuery) ||
    (user.role?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <p className="text-xl">Loading...</p>
    </div>
  );

return (
  <div className="min-h-screen bg-white text-black p-12 mt-20 max-w-4xl mx-auto">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-500">Dashboard</h1>
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
          <h2 className="text-xl font-semibold text-black">Manage Users</h2>
          <button
            onClick={handleAddUser}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
          >
            Add User
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by email, ID or role..."
            className="w-full md:w-1/2 px-4 py-2 border border-gray-300 text-black placeholder-gray-500 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredUsers.length > 0 ? (
          <>
            <div className="overflow-x-auto bg-white shadow rounded-lg mb-4">
              <table className="min-w-full divide-y divide-gray-200 text-black">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-black">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user._id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{user.role || 'user'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm flex flex-col sm:flex-row gap-2">
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
                <span className="px-3 py-1 bg-gray-100 rounded text-black">
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
          <p className="text-gray-600 italic">No users found.</p>
        )}
      </div>
    ) : (
      <div className="bg-white shadow rounded-lg p-6 text-black">
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
