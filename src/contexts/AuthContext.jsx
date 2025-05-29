'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Only check session if Supabase is configured
    if (isSupabaseConfigured) {
      // Check active session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          apiService.getProfile().then(result => {
            if (result.success) {
              setUser(result.user);
            }
          });
        }
        setIsLoading(false);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const result = await apiService.getProfile();
            if (result.success) {
              setUser(result.user);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        }
      );

      return () => subscription.unsubscribe();
    } else {
      // If Supabase is not configured, just set loading to false
      setIsLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const result = await apiService.login(email, password);
    if (result.success && result.user) {
      // Manually set the user to ensure immediate update
      setUser(result.user);
      
      // Get full profile data
      const profileResult = await apiService.getProfile();
      if (profileResult.success) {
        setUser(profileResult.user);
      }
      
      await apiService.logAction('user_login');
    }
    return result;
  };

  const signup = async (formData) => {
    const result = await apiService.signup({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      profession: formData.profession,
      company: formData.company,
      interests: formData.interests,
      tierPreference: formData.tierPreference,
      referralCode: formData.referralCode
    });
    
    if (result.success) {
      await apiService.logAction('user_signup');
    }
    return result;
  };

  const logout = async () => {
    await apiService.logout();
    await apiService.logAction('user_logout');
    setUser(null);
    router.push('/');
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};