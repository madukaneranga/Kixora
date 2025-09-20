import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const loadUserProfile = async (sessionUser: User) => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      } else {
        // fallback profile from session
        setProfile({
          id: sessionUser.id,
          email: sessionUser.email!,
          full_name: sessionUser.user_metadata?.full_name || null,
          avatar_url: sessionUser.user_metadata?.avatar_url || null,
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      // Detect if this is a new user signup
      setIsNewUser(event === 'SIGNED_UP');

      setUser(session?.user ?? null);

      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setProfile(null);
        setIsNewUser(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email: string, password: string, fullName: string) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

  const signOut = () => supabase.auth.signOut();

  const resetPassword = (email: string) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

  const updatePassword = (password: string) =>
    supabase.auth.updateUser({ password });

  const updateEmail = (email: string) =>
    supabase.auth.updateUser({ email });

  const isAdmin = profile?.role === "admin";

  return {
    user,
    profile,
    loading,
    isNewUser,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    updateEmail,
    isAdmin
  };
}
