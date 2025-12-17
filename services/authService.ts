
import { User, UserRole, PlanType } from '../types';
import { PLANS } from '../constants';
import { storageService } from './storageService';

const STORAGE_USER_KEY = 'bistro_current_user_cache';
const MOCK_DB_USERS_KEY = 'bistro_mock_users_db';

const getMockUsers = (): Record<string, User & {password?: string}> => {
    try {
        const s = localStorage.getItem(MOCK_DB_USERS_KEY);
        return s ? JSON.parse(s) : {};
    } catch (e) { return {}; }
};

const saveMockUser = (user: User, password?: string) => {
    const users = getMockUsers();
    users[user.id] = { ...user, password };
    localStorage.setItem(MOCK_DB_USERS_KEY, JSON.stringify(users));
};

const DEMO_USERS: (User & {password: string})[] = [
  {
    id: 'demo_owner', 
    name: 'Jane Owner',
    email: 'owner@bistro.com',
    password: 'pass',
    role: UserRole.OWNER,
    plan: PlanType.FULL_SYSTEM,
    restaurantName: "The Golden Spoon",
    credits: 0,
    recipeQuota: 100, // Demo user gets high quota
    sopQuota: 50,
    setupComplete: true
  }
];

const observers: ((user: User | null) => void)[] = [];
const notifyObservers = (user: User | null) => {
    observers.forEach(cb => cb(user));
};

export const authService = {
  subscribe: (callback: (user: User | null) => void) => {
    const stored = localStorage.getItem(STORAGE_USER_KEY);
    if (stored) {
        const user = JSON.parse(stored);
        const quotas = storageService.getUserQuotas(user.id);
        user.recipeQuota = quotas.recipe;
        user.sopQuota = quotas.sop;
        callback(user);
    } else {
        callback(null);
    }
    observers.push(callback);
    
    // Seed demo users
    const mockUsers = getMockUsers();
    DEMO_USERS.forEach(d => {
        if (!mockUsers[d.id]) {
            mockUsers[d.id] = d;
            storageService.updateQuotas(d.id, d.recipeQuota, d.sopQuota);
        }
    });
    localStorage.setItem(MOCK_DB_USERS_KEY, JSON.stringify(mockUsers));

    return () => {
        const index = observers.indexOf(callback);
        if (index > -1) observers.splice(index, 1);
    };
  },

  getCurrentUser: (): User | null => {
      const stored = localStorage.getItem(STORAGE_USER_KEY);
      return stored ? JSON.parse(stored) : null;
  },

  login: async (email: string, password: string): Promise<User> => {
    const mockUsers = getMockUsers();
    const user = Object.values(mockUsers).find(u => u.email === email && u.password === password);
    if (!user) throw new Error("Invalid credentials");
    
    const safeUser = { ...user };
    delete (safeUser as any).password;
    const quotas = storageService.getUserQuotas(safeUser.id);
    safeUser.recipeQuota = quotas.recipe;
    safeUser.sopQuota = quotas.sop;
    
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(safeUser));
    notifyObservers(safeUser);
    return safeUser;
  },

  logout: async () => {
    localStorage.removeItem(STORAGE_USER_KEY);
    notifyObservers(null);
  },

  updateUser: async (updatedUser: User) => {
      const mockUsers = getMockUsers();
      if (mockUsers[updatedUser.id]) {
          mockUsers[updatedUser.id] = { ...mockUsers[updatedUser.id], ...updatedUser };
          localStorage.setItem(MOCK_DB_USERS_KEY, JSON.stringify(mockUsers));
      }
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser));
      notifyObservers(updatedUser);
  },
  
  // Minimal stubs
  signup: async (u: User, p: string) => { 
      // Reuse logic
      const uid = `usr_${Date.now()}`;
      const newUser = {...u, id: uid};
      saveMockUser(newUser, p);
      // Initialize with 0 or demo quotas
      storageService.updateQuotas(uid, u.recipeQuota, u.sopQuota);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));
      notifyObservers(newUser);
      return newUser;
  },
  resetPassword: async (e: string) => {},
  getAllUsers: async () => []
};
