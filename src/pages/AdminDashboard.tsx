import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, handleFirestoreError, OperationType } from '@/lib/supabase';
import { Booking, UserProfile, TIME_SLOTS, DEFAULT_BLOCKED_SLOTS, BlockedSlot, SLOT_BLOCK_REASONS } from '@/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Check, X, Phone, Calendar as CalendarIcon, Clock, User as UserIcon, Trash2, Lock, Unlock,
  LayoutDashboard, CalendarCheck, Users, Shield, Home, Crown, TrendingUp, AlertCircle, Mail, ArrowRight, LogOut
} from 'lucide-react';

interface AdminDashboardProps {
  profile: UserProfile | null;
}

export default function AdminDashboard({ profile }: AdminDashboardProps) {
  // Admin auth state
  const [adminUser, setAdminUser] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Check if current user is admin on mount
  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => { if (mounted) setAuthLoading(false); }, 5000);

    const init = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          if (mounted) { setAdminUser(null); setAdminProfile(null); }
        } else if (mounted) {
          // Check if this user is admin
          const { data: profileData } = await supabase.from('users').select('*').eq('uid', user.id).maybeSingle();
          if (profileData && profileData.role === 'admin') {
            setAdminUser(user);
            setAdminProfile(profileData as UserProfile);
          } else {
            setAdminUser(null);
            setAdminProfile(null);
          }
        }
      } catch {
        if (mounted) { setAdminUser(null); setAdminProfile(null); }
      } finally {
        clearTimeout(timeout);
        if (mounted) setAuthLoading(false);
      }
    };

    init();
    return () => { mounted = false; clearTimeout(timeout); };
  }, []);

  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error(error.message); return; }

      // Verify admin role
      const { data: profileData } = await supabase.from('users').select('*').eq('uid', data.user.id).maybeSingle();
      if (!profileData || profileData.role !== 'admin') {
        toast.error('Access denied. Admin credentials required.');
        await supabase.auth.signOut();
        return;
      }

      setAdminUser(data.user);
      setAdminProfile(profileData as UserProfile);
      toast.success('Welcome back, Admin!');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setAdminUser(null);
    setAdminProfile(null);
    toast.success('Logged out');
  };

  // Fetch bookings (only when authed)
  useEffect(() => {
    if (!adminUser) return;

    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        handleFirestoreError(error, OperationType.LIST, 'bookings');
        return;
      }

      setBookings(data as Booking[]);
      setLoading(false);
    };

    fetchBookings();

    const subscription = supabase
      .channel('admin-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [adminUser]);

  // Fetch blocked slots for selected date
  useEffect(() => {
    if (!adminUser) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const fetchBlockedSlots = async () => {
      const { data, error } = await supabase
        .from('blockedSlots')
        .select('*')
        .eq('date', dateStr);

      if (error) {
        handleFirestoreError(error, OperationType.LIST, 'blockedSlots');
        return;
      }

      setBlockedSlots(data as BlockedSlot[]);
    };

    fetchBlockedSlots();

    const subscription = supabase
      .channel('admin-blockedSlots')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blockedSlots' }, () => {
        fetchBlockedSlots();
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [selectedDate, adminUser]);

  // Fetch members/users
  useEffect(() => {
    if (!adminUser) return;

    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('email', { ascending: true });

      if (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
        return;
      }

      setAllUsers(data as UserProfile[]);
      setMembers((data as UserProfile[]).filter(u => u.role === 'member'));
    };

    fetchUsers();
  }, [adminUser]);

  const handleStatusUpdate = async (bookingId: string, status: 'approved' | 'denied') => {
    // Optimistic update
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
      toast.success(`Booking ${status} successfully`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update booking status');
      // Revert optimistic update on error by refetching
      const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (data) setBookings(data as Booking[]);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    
    // Optimistic update
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
      if (error) throw error;
      toast.success('Booking deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete booking');
      // Revert on error
      const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (data) setBookings(data as Booking[]);
    }
  };

  const toggleSlotOverride = async (slot: string) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existing = blockedSlots.find(b => b.timeSlot === slot);
    const isDefaultBlocked = DEFAULT_BLOCKED_SLOTS.includes(slot);
    const newType = isDefaultBlocked ? 'available' : 'blocked';

    try {
      if (existing) {
        // Optimistic update
        setBlockedSlots(prev => prev.filter(b => b.timeSlot !== slot));
        
        const { error } = await supabase
          .from('blockedSlots')
          .delete()
          .eq('date', dateStr)
          .eq('timeSlot', slot);

        if (error) throw error;
        toast.success('Slot reset to default');
      } else {
        // Optimistic update
        setBlockedSlots(prev => [...prev, { id: 'temp-' + Date.now(), date: dateStr, timeSlot: slot, type: newType }]);
        
        const { error } = await supabase
          .from('blockedSlots')
          .insert({ date: dateStr, timeSlot: slot, type: newType });

        if (error) throw error;
        toast.success(`Slot marked as ${newType}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update slot');
      // Revert on error
      const { data } = await supabase.from('blockedSlots').select('*').eq('date', dateStr);
      if (data) setBlockedSlots(data as BlockedSlot[]);
    }
  };

  const handleRoleChange = async (uid: string, newRole: 'member' | 'guest') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole, membershipType: newRole === 'member' ? 'monthly' : 'none' })
        .eq('uid', uid);

      if (error) throw error;
      toast.success(`User updated to ${newRole}`);

      // Refresh users
      const { data } = await supabase.from('users').select('*').order('email', { ascending: true });
      if (data) {
        setAllUsers(data as UserProfile[]);
        setMembers((data as UserProfile[]).filter(u => u.role === 'member'));
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update user role');
    }
  };

  // ——— AUTH LOADING SCREEN ———
  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-foreground/20 border-t-foreground rounded-full animate-spin"></div>
      </div>
    );
  }

  // ——— ADMIN LOGIN SCREEN ———
  if (!adminUser) {
    return (
      <div className="portal-admin min-h-screen bg-background">
        <nav className="sticky top-0 z-50 bg-red-500 text-white border-b-2 border-foreground px-4 py-3">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
              <Shield size={24} />
              <span>Admin Portal</span>
            </div>
            <Link to="/" className="font-medium hover:opacity-70 transition-opacity">
              <Home size={18} />
            </Link>
          </div>
        </nav>

        <div className="max-w-md mx-auto px-4 py-16 portal-fade-in">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-2 brutalist-border brutalist-shadow mb-6 bg-red-500 text-white">
              <span className="text-3xl font-black tracking-tighter flex items-center gap-2">
                <Shield size={24} /> ADMIN
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter mb-2">Admin Login</h1>
            <p className="opacity-60">Authorized access only</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-5 p-8 brutalist-border brutalist-shadow bg-white">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-sm uppercase tracking-wider">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <Input id="email" name="email" type="email" placeholder="admin@kbc.com" className="pl-10 brutalist-border h-12" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-sm uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-10 brutalist-border h-12" required />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginLoading}
              className="w-full h-14 text-lg font-bold brutalist-border brutalist-shadow-sm bg-red-500 hover:bg-red-600 text-white"
            >
              {loginLoading ? 'Authenticating...' : 'Login to Admin'}
              {!loginLoading && <ArrowRight className="ml-2" size={18} />}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm opacity-60 hover:opacity-100 underline">
              ← Back to main site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ——— AUTHENTICATED ADMIN DASHBOARD ———

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const approvedBookings = bookings.filter(b => b.status === 'approved');
  const deniedBookings = bookings.filter(b => b.status === 'denied');
  const todayBookings = bookings.filter(b => b.date === format(new Date(), 'yyyy-MM-dd'));

  const sidebarTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'requests', label: 'Requests', icon: CalendarCheck, badge: pendingBookings.length },
    { id: 'slots', label: 'Manage Slots', icon: Clock },
    { id: 'members', label: 'Members', icon: Users, badge: members.length },
  ];

  return (
    <div className="portal-admin min-h-screen bg-background flex">
      {/* Sidebar — desktop */}
      <aside className="admin-sidebar border-r-2 border-foreground bg-white hidden lg:flex flex-col">
        <div className="p-6 border-b-2 border-foreground bg-red-500 text-white">
          <div className="flex items-center gap-2">
            <Shield size={24} />
            <div>
              <h2 className="text-lg font-bold tracking-tight">Admin Panel</h2>
              <p className="text-xs opacity-80">KBC Management</p>
            </div>
          </div>
        </div>

        <div className="py-4 flex-grow">
          {sidebarTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`admin-sidebar-item w-full text-left ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon size={18} />
              <span className="flex-grow">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t-2 border-foreground space-y-1">
          <button onClick={handleAdminLogout} className="admin-sidebar-item w-full text-left text-sm opacity-60 hover:opacity-100 text-red-500">
            <LogOut size={16} /> Logout
          </button>
          <Link to="/" className="admin-sidebar-item text-sm opacity-60 hover:opacity-100">
            <Home size={16} /> Back to Site
          </Link>
        </div>
      </aside>

      {/* Mobile tab strip */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-foreground flex">
        {sidebarTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              activeTab === tab.id ? 'bg-red-500 text-white' : 'opacity-60'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-grow p-6 lg:p-10 pb-24 lg:pb-10 min-h-screen portal-fade-in">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-2">Dashboard</h1>
            <p className="text-lg opacity-60 mb-10">Welcome back, {adminProfile?.displayName || 'Admin'}.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="stat-card">
                <div className="text-sm font-bold uppercase tracking-widest opacity-40 mb-2">Pending</div>
                <div className="text-4xl font-bold">{pendingBookings.length}</div>
                <div className="text-sm opacity-50 mt-1">requests awaiting</div>
              </div>
              <div className="stat-card">
                <div className="text-sm font-bold uppercase tracking-widest opacity-40 mb-2">Today</div>
                <div className="text-4xl font-bold">{todayBookings.length}</div>
                <div className="text-sm opacity-50 mt-1">bookings today</div>
              </div>
              <div className="stat-card">
                <div className="text-sm font-bold uppercase tracking-widest opacity-40 mb-2">Members</div>
                <div className="text-4xl font-bold">{members.length}</div>
                <div className="text-sm opacity-50 mt-1">active members</div>
              </div>
              <div className="stat-card">
                <div className="text-sm font-bold uppercase tracking-widest opacity-40 mb-2">Total</div>
                <div className="text-4xl font-bold">{bookings.length}</div>
                <div className="text-sm opacity-50 mt-1">all-time bookings</div>
              </div>
            </div>

            {/* Pending requests quick view */}
            {pendingBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-500" /> Pending Requests
                </h2>
                <div className="space-y-3">
                  {pendingBookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="p-4 brutalist-border bg-white flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <span className="font-bold">{b.userName}</span>
                        <span className="mx-2 opacity-30">·</span>
                        <span className="opacity-60">{b.date} · {b.timeSlot}</span>
                        <Badge variant="outline" className="ml-2 brutalist-border text-[10px] uppercase">
                          {b.type}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleStatusUpdate(b.id, 'approved')} className="bg-green-500 hover:bg-green-600 text-white brutalist-border">
                          <Check size={14} className="mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(b.id, 'denied')} className="brutalist-border">
                          <X size={14} className="mr-1" /> Deny
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingBookings.length > 5 && (
                    <button onClick={() => setActiveTab('requests')} className="text-sm font-bold underline opacity-60 hover:opacity-100">
                      View all {pendingBookings.length} pending requests →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Booking Requests */}
        {activeTab === 'requests' && (
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-2">Booking Requests</h1>
            <p className="text-lg opacity-60 mb-10">Manage all court booking requests.</p>

            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="bg-background border-2 border-foreground p-1 h-auto mb-8 flex-wrap">
                <TabsTrigger value="pending" className="text-base px-4 py-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:brutalist-border">
                  Pending ({pendingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-base px-4 py-2 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:brutalist-border">
                  Approved ({approvedBookings.length})
                </TabsTrigger>
                <TabsTrigger value="denied" className="text-base px-4 py-2 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:brutalist-border">
                  Denied ({deniedBookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <BookingTable bookings={pendingBookings} onAccept={(id) => handleStatusUpdate(id, 'approved')} onDeny={(id) => handleStatusUpdate(id, 'denied')} onDelete={handleDelete} />
              </TabsContent>
              <TabsContent value="approved">
                <BookingTable bookings={approvedBookings} onDeny={(id) => handleStatusUpdate(id, 'denied')} onDelete={handleDelete} />
              </TabsContent>
              <TabsContent value="denied">
                <BookingTable bookings={deniedBookings} onAccept={(id) => handleStatusUpdate(id, 'approved')} onDelete={handleDelete} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Slot Management */}
        {activeTab === 'slots' && (
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-2">Manage Slots</h1>
            <p className="text-lg opacity-60 mb-10">Control court availability by date and time.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <div className="brutalist-border brutalist-shadow bg-white p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border-0"
                  />
                </div>
                <div className="mt-6 p-6 brutalist-border bg-red-500/10">
                  <h3 className="font-bold mb-2">Slot Management</h3>
                  <p className="text-sm opacity-70">
                    Click a slot to toggle its availability. 
                    Default member slots (6-7 AM, 4-8 PM) can be unblocked to allow guests.
                    Override slots show a ring indicator.
                  </p>
                </div>
                <div className="mt-4 p-6 brutalist-border bg-white">
                  <h3 className="font-bold mb-3 text-sm uppercase tracking-wider">Legend</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500/20 brutalist-border"></div> Blocked</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500/30 brutalist-border"></div> Available</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 ring-2 ring-foreground ring-offset-2 brutalist-border"></div> Override</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{format(selectedDate, 'EEEE, MMMM do')}</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {TIME_SLOTS.map((slot) => {
                    const override = blockedSlots.find(b => b.timeSlot === slot);
                    const isDefaultBlocked = DEFAULT_BLOCKED_SLOTS.includes(slot);
                    const isCurrentlyBlocked = override ? override.type === 'blocked' : isDefaultBlocked;
                    const booking = bookings.find(b => b.date === format(selectedDate, 'yyyy-MM-dd') && b.timeSlot === slot && b.status !== 'denied');

                    // Count bookings for this slot across next 7 days for traffic indicator
                    const slotBookingCount = bookings.filter(b => b.timeSlot === slot && b.status !== 'denied').length;
                    const trafficLevel = slotBookingCount > 5 ? 'high' : slotBookingCount > 2 ? 'medium' : 'low';

                    return (
                      <button
                        key={slot}
                        onClick={() => toggleSlotOverride(slot)}
                        className={`
                          p-4 brutalist-border flex flex-col items-center gap-2 transition-all
                          ${isCurrentlyBlocked ? 'bg-red-500/10' : 'bg-green-500/20'}
                          ${override ? 'ring-2 ring-foreground ring-offset-2' : ''}
                        `}
                      >
                        <div className="font-bold text-lg">{slot}</div>
                        {isCurrentlyBlocked ? <Lock size={16} /> : <Unlock size={16} />}
                        <span className="text-[10px] uppercase tracking-widest font-bold">
                          {isCurrentlyBlocked ? 'Blocked' : 'Available'}
                        </span>
                        {booking && (
                          <div className="mt-1 text-[10px] bg-foreground text-background px-2 py-0.5 rounded font-bold">
                            BOOKED: {booking.userName}
                          </div>
                        )}
                        {/* Traffic indicator */}
                        <div className={`mt-1 text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${
                          trafficLevel === 'high' ? 'bg-red-100 text-red-700' :
                          trafficLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          <TrendingUp size={10} className="inline mr-1" />
                          {trafficLevel} demand
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Member Management */}
        {activeTab === 'members' && (
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-2">Member Management</h1>
            <p className="text-lg opacity-60 mb-10">View and manage all registered users.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="stat-card">
                <div className="text-sm font-bold uppercase tracking-widest opacity-40 mb-2">Members</div>
                <div className="text-4xl font-bold flex items-center gap-2"><Crown size={28} /> {members.length}</div>
              </div>
              <div className="stat-card">
                <div className="text-sm font-bold uppercase tracking-widest opacity-40 mb-2">Guests</div>
                <div className="text-4xl font-bold">{allUsers.filter(u => u.role === 'guest').length}</div>
              </div>
              <div className="stat-card">
                <div className="text-sm font-bold uppercase tracking-widest opacity-40 mb-2">Total Users</div>
                <div className="text-4xl font-bold">{allUsers.length}</div>
              </div>
            </div>

            <div className="brutalist-border bg-white overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader className="bg-foreground text-background">
                  <TableRow className="hover:bg-foreground">
                    <TableHead className="text-background font-bold">User</TableHead>
                    <TableHead className="text-background font-bold">Email</TableHead>
                    <TableHead className="text-background font-bold">Phone</TableHead>
                    <TableHead className="text-background font-bold">Role</TableHead>
                    <TableHead className="text-background font-bold">Membership</TableHead>
                    <TableHead className="text-background font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.filter(u => u.role !== 'admin').map((u) => (
                    <TableRow key={u.uid} className="border-b-2 border-foreground/10 hover:bg-red-500/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold brutalist-border ${
                            u.role === 'member' ? 'bg-amber-400' : 'bg-lime-300'
                          }`}>
                            {u.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold">{u.displayName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm opacity-70">{u.email}</TableCell>
                      <TableCell className="text-sm opacity-70">{u.phoneNumber || '—'}</TableCell>
                      <TableCell>
                        <Badge className={`brutalist-border text-[10px] uppercase tracking-widest ${
                          u.role === 'member' ? 'bg-amber-400 text-black' : 'bg-background'
                        }`}>
                          {u.role === 'member' && <Crown size={10} className="mr-1" />}
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{u.membershipType === 'none' ? '—' : u.membershipType}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {u.role === 'guest' ? (
                          <Button
                            size="sm"
                            onClick={() => handleRoleChange(u.uid, 'member')}
                            className="bg-amber-400 hover:bg-amber-500 text-black brutalist-border brutalist-shadow-sm"
                          >
                            <Crown size={14} className="mr-1" /> Make Member
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleChange(u.uid, 'guest')}
                            className="brutalist-border brutalist-shadow-sm"
                          >
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {allUsers.filter(u => u.role !== 'admin').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 opacity-40">
                        No registered users yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ——— Booking Table Component ———

interface BookingTableProps {
  bookings: Booking[];
  onAccept?: (id: string) => void;
  onDeny?: (id: string) => void;
  onDelete: (id: string) => void;
}

function BookingTable({ bookings, onAccept, onDeny, onDelete }: BookingTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="p-12 brutalist-border bg-white text-center">
        <p className="text-xl opacity-40">No bookings found in this category.</p>
      </div>
    );
  }

  return (
    <div className="brutalist-border bg-white overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader className="bg-foreground text-background">
          <TableRow className="hover:bg-foreground">
            <TableHead className="text-background font-bold">Customer</TableHead>
            <TableHead className="text-background font-bold">Date & Time</TableHead>
            <TableHead className="text-background font-bold">Type</TableHead>
            <TableHead className="text-background font-bold">Status</TableHead>
            <TableHead className="text-background font-bold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id} className="border-b-2 border-foreground/10 hover:bg-red-500/5">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-lg">{booking.userName}</span>
                  <a href={`tel:${booking.userPhone}`} className="text-sm opacity-60 flex items-center gap-1 hover:text-red-500">
                    <Phone size={14} /> {booking.userPhone}
                  </a>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium flex items-center gap-1"><CalendarIcon size={14} /> {booking.date}</span>
                  <span className="text-sm opacity-60 flex items-center gap-1"><Clock size={14} /> {booking.timeSlot}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={booking.type === 'member' ? 'default' : 'outline'} className={`brutalist-border uppercase text-[10px] tracking-widest ${
                  booking.type === 'member' ? 'bg-amber-400 text-black' : ''
                }`}>
                  {booking.type === 'member' && <Crown size={10} className="mr-1" />}
                  {booking.type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  className={`
                    brutalist-border uppercase text-[10px] tracking-widest
                    ${booking.status === 'approved' ? 'bg-green-500 text-white' : ''}
                    ${booking.status === 'denied' ? 'bg-red-500 text-white' : ''}
                    ${booking.status === 'pending' ? 'bg-yellow-500 text-black' : ''}
                  `}
                >
                  {booking.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {onAccept && (
                    <Button size="sm" onClick={() => onAccept(booking.id)} className="bg-green-500 hover:bg-green-600 text-white brutalist-border brutalist-shadow-sm">
                      <Check size={16} />
                    </Button>
                  )}
                  {onDeny && (
                    <Button size="sm" onClick={() => onDeny(booking.id)} variant="destructive" className="brutalist-border brutalist-shadow-sm">
                      <X size={16} />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => onDelete(booking.id)} className="brutalist-border brutalist-shadow-sm">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
