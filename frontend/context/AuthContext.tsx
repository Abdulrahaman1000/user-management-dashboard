import { createContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  user: any;
  login: (user: any) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if the user is already logged in by checking the cookie or localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch user details based on the token
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setUser(data))
        .catch(() => setUser(null));
    }
  }, []);

  const login = (user: any) => {
    setUser(user);
    localStorage.setItem('token', user.token); // Save token to localStorage
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token'); // Remove token from localStorage
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
