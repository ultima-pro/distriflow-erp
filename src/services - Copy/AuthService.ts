import { User, UserRole } from '../types/erp';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_DEMO_USERS } from '../data/demoSeedData';

type AuthListener = (user: User | null) => void;

class AuthServiceClass {
  private currentUser: User | null = null;
  private listeners: Set<AuthListener> = new Set();
  private localUsers: User[] = [...INITIAL_DEMO_USERS];

  constructor() {
    if (isSupabaseConfigured && supabase) {
      // 1. Restore existing session on startup
      supabase.auth.getSession().then(async ({ data: { session }, error }) => {
        if (!error && session?.user) {
          const profile = await this.fetchSupabaseProfile(session.user.id);
          this.currentUser = profile;
          this.notify();
        }
      });

      // 2. Listen to Supabase Auth state changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await this.fetchSupabaseProfile(session.user.id);
          this.currentUser = profile;
        } else {
          this.currentUser = null;
        }
        this.notify();
      });
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isCloudMode(): boolean {
    return isSupabaseConfigured && supabase !== null;
  }

  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }

  async fetchSupabaseProfile(userId: string): Promise<User | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: 1, // local numerical index placeholder
          cloudId: data.id,
          username: data.username,
          fullName: data.full_name,
          role: data.role as UserRole,
          phone: data.phone || '',
          isActive: data.is_active ?? true,
          createdAt: new Date(data.created_at).getTime(),
        };
      }

      // If profile row does not exist yet, fallback to user metadata from Supabase Auth
      const { data: authUserData } = await supabase.auth.getUser();
      if (authUserData?.user && authUserData.user.id === userId) {
        const meta = authUserData.user.user_metadata || {};
        const fallbackUsername = meta.username || authUserData.user.email?.split('@')[0] || 'user';
        const fallbackName = meta.full_name || meta.fullName || 'Team Member';
        const fallbackRole = (meta.role as UserRole) || 'SALESPERSON';
        const fallbackPhone = meta.phone || '';

        // Attempt to create the missing profile row in PostgreSQL
        await supabase.from('profiles').upsert([
          {
            id: userId,
            username: fallbackUsername,
            full_name: fallbackName,
            role: fallbackRole,
            phone: fallbackPhone,
            is_active: true,
          },
        ]);

        return {
          id: 1,
          cloudId: userId,
          username: fallbackUsername,
          fullName: fallbackName,
          role: fallbackRole,
          phone: fallbackPhone,
          email: authUserData.user.email,
          isActive: true,
          createdAt: new Date(authUserData.user.created_at).getTime(),
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching Supabase user profile:', err);
      return null;
    }
  }

  async login(emailOrUsername: string, password: string): Promise<User> {
    if (isSupabaseConfigured && supabase) {
      const trimmed = emailOrUsername.trim();
      let emailToUse = trimmed;

      // If user typed a username without @, check if there's a matching profile or email
      if (!trimmed.includes('@')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('username', trimmed)
          .maybeSingle();

        // Default email pattern if username was given
        emailToUse = `${trimmed}@distriflow.internal`;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Authentication failed. Please verify your Supabase credentials.');
      }

      const profile = await this.fetchSupabaseProfile(data.user.id);
      if (!profile) {
        throw new Error('Supabase Auth succeeded, but user profile could not be loaded from database.');
      }

      this.currentUser = profile;
      this.notify();
      return profile;
    } else {
      // Local development authentication (when Supabase is NOT configured)
      const user = this.localUsers.find(
        (u) =>
          (u.username.toLowerCase() === emailOrUsername.toLowerCase() ||
            u.email?.toLowerCase() === emailOrUsername.toLowerCase()) &&
          u.isActive
      );
      if (!user) {
        throw new Error('Invalid demo credentials or inactive account.');
      }
      this.currentUser = user;
      this.notify();
      return user;
    }
  }

  // Quick Demo Access — Strictly permitted ONLY when Supabase is not configured
  async quickLoginAsOwner(): Promise<User> {
    if (this.isCloudMode()) {
      throw new Error(
        'Demo quick-login is disabled because Supabase Cloud is active. Please sign in with your real Supabase account or register a new user.'
      );
    }
    return this.login('admin', 'admin123');
  }

  async quickLoginAsSalesperson(username: 'john' | 'maria' = 'john'): Promise<User> {
    if (this.isCloudMode()) {
      throw new Error(
        'Demo quick-login is disabled because Supabase Cloud is active. Please sign in with your real Supabase account or register a new user.'
      );
    }
    return this.login(username, 'sales123');
  }

  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) console.warn('Supabase logout note:', error.message);
    }
    this.currentUser = null;
    this.notify();
  }

  async registerUser(
    username: string,
    fullName: string,
    role: UserRole,
    phone: string = '',
    email: string = '',
    password?: string
  ): Promise<User> {
    const cleanUsername = username.trim();
    const cleanFullName = fullName.trim();
    const cleanPhone = phone.trim();

    if (isSupabaseConfigured && supabase) {
      if (!password || password.length < 6) {
        throw new Error('Supabase Auth requires a password of at least 6 characters.');
      }

      const emailToRegister = email.trim() || `${cleanUsername}@distriflow.internal`;

      const { data, error } = await supabase.auth.signUp({
        email: emailToRegister,
        password,
        options: {
          data: {
            username: cleanUsername,
            full_name: cleanFullName,
            role,
            phone: cleanPhone,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Supabase Auth registration failed.');
      }

      if (!data.user) {
        throw new Error('Supabase did not return a user record.');
      }

      // Upsert profile in PostgreSQL
      const { error: profileError } = await supabase.from('profiles').upsert([
        {
          id: data.user.id,
          username: cleanUsername,
          full_name: cleanFullName,
          role,
          phone: cleanPhone,
          is_active: true,
        },
      ]);

      if (profileError) {
        console.warn('Note on Supabase profile creation:', profileError.message);
      }

      const profile: User = {
        id: 1,
        cloudId: data.user.id,
        username: cleanUsername,
        fullName: cleanFullName,
        role,
        phone: cleanPhone,
        email: emailToRegister,
        isActive: true,
        createdAt: Date.now(),
      };

      this.currentUser = profile;
      this.notify();
      return profile;
    } else {
      // Local development registration
      const existing = this.localUsers.find(
        (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (existing) throw new Error(`Username '${cleanUsername}' is already in use.`);
      const newUser: User = {
        id: Math.max(0, ...this.localUsers.map((u) => u.id)) + 1,
        username: cleanUsername,
        fullName: cleanFullName,
        role,
        phone: cleanPhone,
        email: email.trim(),
        isActive: true,
        createdAt: Date.now(),
      };
      this.localUsers.push(newUser);
      this.currentUser = newUser;
      this.notify();
      return newUser;
    }
  }
}

export const AuthService = new AuthServiceClass();
