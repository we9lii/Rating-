import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User;
  switchUser: (userId: string) => void;
  availableUsers: User[];
}

const MOCK_USERS: User[] = [
  { id: 'emp-1', name: 'فيصل النتيفي', role: 'employee' },
  { id: 'emp-2', name: 'موظف 2', role: 'employee' },
  { id: 'admin-1', name: 'مدير النظام', role: 'admin' },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('current_user_id');
    if (saved) {
      const found = MOCK_USERS.find(u => u.id === saved);
      if (found) return found;
    }
    return MOCK_USERS[0]; // Default to first employee
  });

  const switchUser = (userId: string) => {
    const found = MOCK_USERS.find(u => u.id === userId);
    if (found) {
      setUser(found);
      localStorage.setItem('current_user_id', userId);
    }
  };

  return (
    <AuthContext.Provider value={{ user, switchUser, availableUsers: MOCK_USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
