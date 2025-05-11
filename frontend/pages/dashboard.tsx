import { useEffect, useState, useCallback } from 'react';
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

interface ApiResponse {
  users?: User[];
  data?: User[];
  pages?: number;
  totalCount?: number;
}

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
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

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  // Helper function to extract users data from different response formats
  const getUsersData = (data: ApiResponse | User[]): User[] => {
    if (Array.isArray(data)) {
      return data; // Directly return if `data` is a User[]
    }
    if (data && Array.isArray(data.data)) {
      return data.data; // Return `data.data` if it's a User[]
    }
    if (data && Array.isArray(data.users)) {
      return data.users; // Return `data.users` if it's a User[]
    }
    return []; // Return empty array if no valid data
  };

  const fetchUsers = useCallback(async (page: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await api.get<ApiResponse | User[]>(`/users?page=${page}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { data } = res;
      const usersData = getUsersData(data);
      
      // Calculate total pages
      let pages = 1;
      if (Array.isArray(data)) {
        pages = Math.ceil(data.length / 5) || 1;
      } else if (data) {
        pages = data.pages || Math.ceil((data.totalCount || usersData.length) / 5) || 1;
      }

      setUsers(usersData);
      setIsAdmin(usersData.some((user) => user.role === 'admin'));
      setTotalPages(pages);
      setCurrentPage(page);
      setLoading(false);
    } catch (err: unknown) {
      console.error('Error fetching users:', err);
      const error = err as ApiError;
      if (error.response?.status === 401) {
        handleLogout();
      }
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  useEffect(() => {
    if (searchQuery && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, currentPage]);

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
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: unknown) {
      console.error('Error deleting user:', err);
      setLoading(false);
    }
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
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
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{user.name || 'No name provided'}</td>
                        <td className="px-6 py-4 text-sm">{user.role || 'user'}</td>
                        <td className="px-6 py-4 text-sm flex flex-col sm:flex-row gap-2">
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

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-black">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="mb-4">Are you sure you want to delete this user?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
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