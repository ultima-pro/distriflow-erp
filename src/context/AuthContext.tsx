import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types/erp';
import { AuthService } from '../services/AuthService';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  isSalesperson: boolean;
  login: (emailOrUsername: string, pass: string) => Promise<User>;
  quickLoginAsOwner: () => Promise<User>;
  quickLoginAsSalesperson: (username?: 'john' | 'maria') => Promise<User>;
  registerUser: (
    username: string,
    fullName: string,
    role: UserRole,
    phone?: string,
    email?: string,
    password?: string
  ) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(AuthService.getCurrentUser());

  useEffect(() => {
    const unsubscribe = AuthService.subscribe((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    isOwner: currentUser?.role === 'OWNER',
    isSalesperson: currentUser?.role === 'SALESPERSON',
    login: (u, p) => AuthService.login(u, p),
    quickLoginAsOwner: () => AuthService.quickLoginAsOwner(),
    quickLoginAsSalesperson: (u) => AuthService.quickLoginAsSalesperson(u),
    registerUser: (u, name, role, phone, email, pass) =>
      AuthService.registerUser(u, name, role, phone, email, pass),
    logout: () => AuthService.logout(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
