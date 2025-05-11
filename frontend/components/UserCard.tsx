import { useRouter } from 'next/router';

const UserCard = ({ user }: { user: any }) => {
  const router = useRouter();

  const handleDelete = async () => {
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      router.reload(); // Refresh the page after deletion
    } else {
      const errorData = await response.json();
      alert(errorData.message || 'Failed to delete user');
    }
  };

  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <p>{user.role}</p>
      <button onClick={handleDelete}>Delete User</button>
    </div>
  );
};

export default UserCard;
