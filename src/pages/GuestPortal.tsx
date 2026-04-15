import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, User as UserIcon, Phone, ArrowRight } from 'lucide-react';
import GuestNav from '@/components/GuestNav';
import BookingPage from './BookingPage';
import ProfilePage from './ProfilePage';

export default function GuestPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const navigate = useNavigate();

  const loadProfile = async (u: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', u.id)
        .maybeSingle();

      if (error) {
        console.error('Profile load error:', error);
        return;
      }

      if (data) {
        setProfile(data as UserProfile);
        return;
      }

      // Create guest profile
      const newProfile: UserProfile = {
        uid: u.id,
        email: u.email || '',
        displayName: u.user_metadata?.full_name as string || u.email || 'Guest',
        phoneNumber: u.user_metadata?.phone_number as string || '',
        role: 'guest',
        membershipType: 'none',
      };

      const { error: insertError } = await supabase.from('users').insert(newProfile);
      if (insertError) console.error('Profile insert error:', insertError);
      setProfile(newProfile);
    } catch (err) {
      console.error('loadProfile exception:', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => { if (mounted) setLoading(false); }, 5000);

    const init = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        if (error || !currentUser) {
          await supabase.auth.signOut().catch(() => {});
          if (mounted) { setUser(null); setProfile(null); }
        } else if (mounted) {
          setUser(currentUser);
          await loadProfile(currentUser);
        }
      } catch {
        if (mounted) { setUser(null); setProfile(null); }
      } finally {
        clearTimeout(timeout);
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) await loadProfile(u);
      else setProfile(null);
    });

    return () => { mounted = false; clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;

    try {
      if (isSignUp) {
        const name = fd.get('name') as string;
        const phone = fd.get('phone') as string;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, phone_number: phone } },
        });
        if (error) { toast.error(error.message); return; }
        toast.success('Account created! Welcome to KBC.');
        navigate('/guest/book');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error(error.message); return; }
        toast.success('Welcome back!');
        navigate('/guest/book');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setProfile(null);
    toast.success('Logged out');
    supabase.auth.signOut().catch(console.error);
    navigate('/guest');
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-foreground/20 border-t-foreground rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not logged in — show auth form
  if (!user) {
    return (
      <div className="portal-guest min-h-screen bg-background">
        <GuestNav user={null} onLogout={() => {}} />
        <div className="max-w-md mx-auto px-4 py-16 portal-fade-in">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-2 brutalist-border brutalist-shadow mb-6" style={{ backgroundColor: '#BEF264' }}>
              <span className="text-3xl font-black tracking-tighter">GUEST</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="opacity-60">
              {isSignUp ? 'Sign up to book courts at 300₹/hour' : 'Login to manage your bookings'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5 p-8 brutalist-border brutalist-shadow bg-white">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-bold text-sm uppercase tracking-wider">Full Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                    <Input id="name" name="name" type="text" placeholder="Your full name" className="pl-10 brutalist-border h-12" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-bold text-sm uppercase tracking-wider">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                    <Input id="phone" name="phone" type="tel" placeholder="98464XXXXX" className="pl-10 brutalist-border h-12" required />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-sm uppercase tracking-wider">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <Input id="email" name="email" type="email" placeholder="email@example.com" className="pl-10 brutalist-border h-12" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-sm uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-10 brutalist-border h-12" required minLength={6} />
              </div>
            </div>

            <Button
              type="submit"
              disabled={authLoading}
              className="w-full h-14 text-lg font-bold brutalist-border brutalist-shadow-sm"
              style={{ backgroundColor: '#BEF264', color: '#1A1A1A' }}
            >
              {authLoading ? 'Please wait...' : (isSignUp ? 'Create Guest Account' : 'Login')}
              {!authLoading && <ArrowRight className="ml-2" size={18} />}
            </Button>

            <div className="text-center pt-2">
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-sm underline opacity-60 hover:opacity-100">
                {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>

          <div className="mt-8 p-6 brutalist-border bg-white">
            <h3 className="font-bold mb-3">Guest Benefits</h3>
            <ul className="space-y-2 text-sm opacity-70">
              <li className="flex items-center gap-2">✓ Book courts at 300₹/hour</li>
              <li className="flex items-center gap-2">✓ Up to 6 players per slot</li>
              <li className="flex items-center gap-2">✓ Access all facilities</li>
              <li className="flex items-center gap-2">✓ Pay at court or via UPI</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Logged in — show portal with routes
  return (
    <div className="portal-guest min-h-screen bg-background flex flex-col">
      <GuestNav user={user} onLogout={handleLogout} />
      <main className="flex-grow portal-fade-in">
        <Routes>
          <Route path="book" element={<BookingPage user={user} profile={profile} portalType="guest" />} />
          <Route path="profile" element={<ProfilePage user={user} profile={profile} portalType="guest" />} />
          <Route path="*" element={<Navigate to="/guest/book" replace />} />
        </Routes>
      </main>
    </div>
  );
}
