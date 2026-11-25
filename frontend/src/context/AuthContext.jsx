import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ambil profil (role, nama) dari tabel profiles
  const fetchProfile = async (userId) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: userData } = await supabase.auth.getUser();
        const meta = userData?.user?.user_metadata || {};
        return {
          id: userId,
          name: meta.name || 'Pengguna',
          username: meta.username || 'user',
          role: meta.role || 'kasir_wifi'
        };
      }
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const p = await fetchProfile(session.user.id);
          setProfile(p);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (usernameOrEmail, password) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

    let email = usernameOrEmail.trim();
    if (!email.includes('@')) {
      email = `${email}@bukukas.local`;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message === 'Invalid login credentials' 
        ? 'Username atau password salah.' 
        : error.message);
    }

    const p = await fetchProfile(data.user.id);
    setProfile(p);
    return data;
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  const isOwner = profile?.role === 'owner';
  const isKasir = profile?.role === 'kasir_wifi';
  const isTeknisi = profile?.role === 'teknisi';

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      login, 
      logout, 
      loading, 
      isOwner, 
      isKasir, 
      isTeknisi 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
