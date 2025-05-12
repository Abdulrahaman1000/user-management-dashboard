import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
 // Separate type definitions
import api from '../services/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  Edit2, 
  Trash2, 
  Search, 
  LogOut 
} from 'lucide-react';
import { ApiError, ApiResponse, User } from '../types/user';

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
    router.push('/');
  };

  // Helper function to extract users data from different response formats
  const getUsersData = (data: ApiResponse | User[]): User[] => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.users)) return data.users;
    return [];
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
        pages = (data as ApiResponse).pages || Math.ceil(((data as ApiResponse).totalCount || usersData.length) / 5) || 1;
      }

      setUsers(usersData);
      setIsAdmin(usersData.some((user) => user.role === 'admin'));
      setTotalPages(pages);
      setCurrentPage(page);
      setLoading(false);
    } catch (err) {
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
    } catch (err) {
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
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-12">
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <span className="mr-3">Dashboard</span>
          </h1>
          <button 
            onClick={handleLogout} 
            className="flex items-center bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md transition"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </button>
        </div>

        {isAdmin ? (
          <div className="p-6">
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                {success}
              </div>
            )}

            {/* Users Management Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">Manage Users</h2>
              <button
                onClick={handleAddUser}
                className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add User
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search by email, ID or role..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {filteredUsers.length > 0 ? (
              <>
                {/* Responsive Table */}
                <div className="overflow-x-auto">
                  <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Profile</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                            <Image
                              src={user.profilePhoto ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.profilePhoto}?ts=${Date.now()}` : '/default-avatar.jpg'}
                              alt="Profile"
                              className="h-10 w-10 rounded-full object-cover"
                              width={40}
                              height={40}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="md:hidden mr-3">
                                <Image
                                  src={user.profilePhoto ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.profilePhoto}?ts=${Date.now()}` : '/default-avatar.jpg'}
                                  alt="Profile"
                                  className="h-8 w-8 rounded-full object-cover"
                                  width={32}
                                  height={32}
                                />
                              </div>
                              {user.email}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{user.name || 'No name'}</td>
                          <td className="px-4 py-3 text-sm hidden sm:table-cell">{user.role || 'user'}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleEditUser(user._id)}
                                className="text-yellow-500 hover:text-yellow-600 transition"
                                title="Edit"
                              >
                                <Edit2 className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingUserId(user._id);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-500 hover:text-red-600 transition"
                                title="Delete"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center mt-6 space-x-4">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="mr-1" />
                    Previous
                  </button>
                  <span className="text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="ml-1" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No users found matching your search.
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-xl text-gray-600">You do not have permission to access this page.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Confirm Deletion</h2>
            <p className="mb-6 text-gray-600">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
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