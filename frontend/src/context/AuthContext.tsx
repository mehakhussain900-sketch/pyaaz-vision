import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type UserRole = 'admin' | 'procurement_officer' | 'reviewer' | 'inspector';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  badge_number: string;
  center_name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role?: UserRole) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Demo credential profiles for offline / prototype mode
const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  'admin@pyaazvision.gov.in': {
    password: 'admin123',
    user: {
      id: 'u-admin-01',
      email: 'admin@pyaazvision.gov.in',
      full_name: 'Superintendent Priya Nair',
      role: 'admin',
      badge_number: 'MH-AGR-SUPT-001',
      center_name: 'APMC Maharashtra HQ'
    }
  },
  'officer@pyaazvision.gov.in': {
    password: 'officer123',
    user: {
      id: 'u-officer-01',
      email: 'officer@pyaazvision.gov.in',
      full_name: 'Officer Suresh Kulkarni',
      role: 'procurement_officer',
      badge_number: 'MH-AGR-PROC-087',
      center_name: 'Lasalgaon APMC Main Yard'
    }
  },
  'reviewer@pyaazvision.gov.in': {
    password: 'reviewer123',
    user: {
      id: 'u-reviewer-01',
      email: 'reviewer@pyaazvision.gov.in',
      full_name: 'Reviewer Kavita Sharma',
      role: 'reviewer',
      badge_number: 'MH-AGR-REV-034',
      center_name: 'Pimpalgaon Baswant Hub'
    }
  },
  'inspector@pyaazvision.gov.in': {
    password: 'inspect123',
    user: {
      id: 'u-insp-01',
      email: 'inspector@pyaazvision.gov.in',
      full_name: 'Inspector Anand K. Deshmukh',
      role: 'inspector',
      badge_number: 'MH-AGR-INSP-204',
      center_name: 'Lasalgaon APMC Main Yard'
    }
  }
};

const SESSION_KEY = 'pyaaz_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try real backend first
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        const loggedUser: AuthUser = {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          role: (data.role as UserRole) || 'inspector',
          badge_number: data.badge_number || 'N/A',
          center_name: data.center_name
        };
        setUser(loggedUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(loggedUser));
        return;
      }
    } catch {
      // Backend unavailable — fall through to demo credentials
    }

    // Demo credential check
    const demo = DEMO_USERS[email.toLowerCase()];
    if (demo && demo.password === password) {
      setUser(demo.user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(demo.user));
      setIsLoading(false);
      return;
    }

    // Any email with 'demo' prefix logs in as inspector (for SIH presentation)
    if (email.toLowerCase().startsWith('demo') || email === '') {
      const fallback = DEMO_USERS['inspector@pyaazvision.gov.in'].user;
      setUser(fallback);
      localStorage.setItem(SESSION_KEY, JSON.stringify(fallback));
      setIsLoading(false);
      return;
    }

    setError('Invalid credentials. Use the demo accounts listed on the login page.');
    setIsLoading(false);
  }, []);

  const demoLogin = useCallback(async (role: UserRole = 'inspector') => {
    setIsLoading(true);
    setError(null);
    const targetUser = Object.values(DEMO_USERS).find(d => d.user.role === role)?.user 
      || DEMO_USERS['inspector@pyaazvision.gov.in'].user;
    
    // Simulate brief network auth handshake
    await new Promise(resolve => setTimeout(resolve, 300));
    setUser(targetUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(targetUser));
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, demoLogin, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const DEMO_CREDENTIALS = [
  { role: 'Administrator', email: 'admin@pyaazvision.gov.in', password: 'admin123', badge: 'MH-AGR-SUPT-001' },
  { role: 'Procurement Officer', email: 'officer@pyaazvision.gov.in', password: 'officer123', badge: 'MH-AGR-PROC-087' },
  { role: 'Quality Reviewer', email: 'reviewer@pyaazvision.gov.in', password: 'reviewer123', badge: 'MH-AGR-REV-034' },
  { role: 'Inspector', email: 'inspector@pyaazvision.gov.in', password: 'inspect123', badge: 'MH-AGR-INSP-204' }
];
