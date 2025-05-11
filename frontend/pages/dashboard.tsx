import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../services/api';
import Image from 'next/image';

interface User {
  _id: string;
  email: string;
  role?: string;
  name?: string;
  profilePhoto?: string;
}

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [success, setSuccess] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchUsers(1);
  }, []);

  useEffect(() => {
    if (searchQuery && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery]);

  const fetchUsers = async (page: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await api.get(`/users?page=${page}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.pages) {
        setTotalPages(res.data.pages);
      } else {
        const totalCount = res.data?.totalCount || 0;
        const limit = 5;
        const calculatedPages = Math.ceil(totalCount / limit) || 1;
        setTotalPages(calculatedPages);
      }

      setCurrentPage(page);

      let usersData: User[] = [];
      if (Array.isArray(res.data?.data)) {
        usersData = res.data.data;
      } else if (Array.isArray(res.data)) {
        usersData = res.data;
      } else if (Array.isArray(res.data?.users)) {
        usersData = res.data.users;
      }

      const currentUser = usersData.find(user => user.role === 'admin');
      setIsAdmin(currentUser ? true : false);

      setUsers(usersData);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      if (err.response?.status === 401) handleLogout();
      setLoading(false);
    }
  };

  const handleAddUser = () => router.push('/users/add');
  const handleEditUser = (userId: string) => router.push(`/users/${userId}`);

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;

    setSuccess('');
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await api.delete(`/users/${deletingUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200 || res.status === 204) {
        await fetchUsers(currentPage);
        setShowDeleteModal(false);
        setSuccess('User deleted successfully!');
        setTimeout(() => setSuccess(''), 3000); // Hide the alert after 3 seconds
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
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
    setCurrentPage(page);
    fetchUsers(page);
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user._id.includes(searchQuery) ||
    (user.role?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-12 mt-20 max-w-4xl mx-auto">
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          {success}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-500">Dashboard</h1>
        <button onClick={handleLogout} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Profile</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Image
                            src={user.profilePhoto ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.profilePhoto}?ts=${Date.now()}` : '/default-avatar.jpg'}
                            alt="Profile"
                            className="h-10 w-10 rounded-full object-cover"
                            width={40}
                            height={40}
                          />
                        </td>
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
                            onClick={() => {
                              setDeletingUserId(user._id);
                              setShowDeleteModal(true);
                            }}
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
            </>
          ) : (
            <p>No users found.</p>
          )}
        </div>
      ) : (
        <p className="text-xl text-center">You do not have permission to access this page.</p>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold">Are you sure you want to delete this user?</h3>
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
