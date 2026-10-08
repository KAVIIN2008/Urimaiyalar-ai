import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'wholesale' | 'retail' | 'customer';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  token: string | null;
  login: (role: UserRole, token?: string) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing token in localStorage
    const savedToken = localStorage.getItem('urimaiyalar_token');
    const savedRole = localStorage.getItem('urimaiyalar_role') as UserRole;
    
    if (savedToken && savedRole) {
      setToken(savedToken);
      setUserRole(savedRole);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (role: UserRole, jwtToken?: string) => {
    // Generate a mock JWT for development if none provided, otherwise use real JWT
    const effectiveToken = jwtToken || btoa(JSON.stringify({ role, exp: Date.now() + 86400000 }));
    
    localStorage.setItem('urimaiyalar_token', effectiveToken);
    localStorage.setItem('urimaiyalar_role', role);
    
    setToken(effectiveToken);
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('urimaiyalar_token');
    localStorage.removeItem('urimaiyalar_role');
    setToken(null);
    setUserRole(null);
    setIsAuthenticated(false);
  };

  const setRole = (role: UserRole) => {
    localStorage.setItem('urimaiyalar_role', role);
    setUserRole(role);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, token, login, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
