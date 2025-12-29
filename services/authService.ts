
import { User, UserRole, PlanType } from '../types';
import { PLANS } from '../constants';
import { storageService } from './storageService';
import { auth, isFirebaseConfigured } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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

// Fixed missing properties: joinedDate, location, cuisineType
const DEMO_USERS: (User & {password: string})[] = [
  {
    id: 'demo_user_main', 
    name: 'Demo User',
    email: 'demo@bistroconnect.in',
    password: '12345678',
    role: UserRole.OWNER,
    plan: PlanType.FULL_SYSTEM,
    restaurantName: "The Golden Spoon (Demo)",
    joinedDate: '2023-01-01',
    location: 'Mumbai, IN',
    cuisineType: 'Multi-Cuisine',
    credits: 0,
    recipeQuota: 100,
    sopQuota: 50,
    setupComplete: true
  },
  {
    id: 'super_admin_amit',
    name: 'Amit (Super Admin)',
    email: 'amit@chef-hire.in',
    password: 'Bistro@2403',
    role: UserRole.SUPER_ADMIN,
    plan: PlanType.ENTERPRISE,
    restaurantName: "Bistro HQ",
    joinedDate: '2023-01-01',
    location: 'Vadodara, IN',
    cuisineType: 'Operations',
    credits: 0,
    recipeQuota: 9999,
    sopQuota: 9999,
    setupComplete: true
  },
  {
    id: 'super_admin_info',
    name: 'Bistro Admin',
    email: 'info@bistroconnect.in',
    password: 'Bistro@2403',
    role: UserRole.SUPER_ADMIN,
    plan: PlanType.ENTERPRISE,
    restaurantName: "Bistro Operations",
    joinedDate: '2023-01-01',
    location: 'Vadodara, IN',
    cuisineType: 'Operations',
    credits: 0,
    recipeQuota: 9999,
    sopQuota: 9999,
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
    
    const mockUsers = getMockUsers();
    let updated = false;
    DEMO_USERS.forEach(d => {
        if (!mockUsers[d.id] || mockUsers[d.id].password !== d.password) {
            mockUsers[d.id] = d;
            storageService.updateQuotas(d.id, d.recipeQuota, d.sopQuota);
            updated = true;
        }
    });
    if (updated) {
        localStorage.setItem(MOCK_DB_USERS_KEY, JSON.stringify(mockUsers));
    }

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
    const user = Object.values(mockUsers).find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
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

  loginWithGoogle: async (): Promise<User> => {
    if (!isFirebaseConfigured || !auth) {
        console.warn("Firebase not configured. Simulating Google Signup for testing.");
        // Fixed missing location and cuisineType
        const simulatedId = `goog_sim_${Date.now()}`;
        const simulatedUser: User = {
            id: simulatedId,
            name: 'Google User (Simulated)',
            email: 'simulated@gmail.com',
            role: UserRole.OWNER,
            plan: PlanType.FREE,
            joinedDate: new Date().toISOString().split('T')[0],
            restaurantName: '',
            location: '',
            cuisineType: '',
            credits: 50,
            recipeQuota: 10,
            sopQuota: 5,
            setupComplete: false // Force redirection to registration
        };
        saveMockUser(simulatedUser);
        storageService.updateQuotas(simulatedId, 10, 5);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(simulatedUser));
        notifyObservers(simulatedUser);
        return simulatedUser;
    }

    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        
        const mockUsers = getMockUsers();
        let user = Object.values(mockUsers).find(u => u.email.toLowerCase() === fbUser.email?.toLowerCase());

        if (!user) {
            // Fixed missing location and cuisineType
            const newUser: User = {
                id: fbUser.uid,
                name: fbUser.displayName || 'Google User',
                email: fbUser.email || '',
                role: UserRole.OWNER,
                plan: PlanType.FREE,
                joinedDate: new Date().toISOString().split('T')[0],
                restaurantName: '',
                location: '',
                cuisineType: '',
                credits: 50,
                recipeQuota: 10,
                sopQuota: 5,
                setupComplete: false // New users always land on registration
            };
            saveMockUser(newUser);
            storageService.updateQuotas(newUser.id, newUser.recipeQuota, newUser.sopQuota);
            user = newUser;
        }

        const safeUser = { ...user };
        delete (safeUser as any).password;
        
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(safeUser));
        notifyObservers(safeUser);
        return safeUser;
    } catch (error: any) {
        throw new Error(error.message || "Google Authentication failed");
    }
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
  
  signup: async (u: User, p: string) => { 
      const uid = `usr_${Date.now()}`;
      const newUser = {...u, id: uid, setupComplete: false};
      saveMockUser(newUser, p);
      storageService.updateQuotas(uid, u.recipeQuota, u.sopQuota);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));
      notifyObservers(newUser);
      return newUser;
  },
  resetPassword: async (e: string) => {},
  getAllUsers: async () => []
};
