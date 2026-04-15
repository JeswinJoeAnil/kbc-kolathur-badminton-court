import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, handleFirestoreError, OperationType } from '@/lib/supabase';
import { UserProfile, Booking, PortalType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User as UserIcon, Phone, Mail, Calendar, Clock, ShieldCheck, Crown } from 'lucide-react';

interface ProfilePageProps {
  user: User | null;
  profile: UserProfile | null;
  portalType?: PortalType;
}

export default function ProfilePage({ user, profile, portalType = 'guest' }: ProfilePageProps) {
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [updating, setUpdating] = useState(false);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  const isMember = portalType === 'member';
  const accentColor = isMember ? '#FBBF24' : '#BEF264';

  useEffect(() => {
    if (profile) {
      setPhoneNumber(profile.phoneNumber);
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        handleFirestoreError(error, OperationType.LIST, 'bookings');
        return;
      }

      setMyBookings(data as Booking[]);
    };

    fetchBookings();

    // Set up realtime subscription
    const subscription = supabase
      .channel('user-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${user.id}` }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ "phoneNumber": phoneNumber })
        .eq('uid', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Please Login</h1>
        <p className="text-xl opacity-60">You need to be logged in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">MY PROFILE</h1>
        <p className="text-xl opacity-80">
          {isMember ? 'Manage your membership and bookings.' : 'Manage your account and view your bookings.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Profile Info */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="brutalist-border brutalist-shadow">
            <CardHeader className="border-b-2 border-foreground" style={{ backgroundColor: accentColor }}>
              <CardTitle className="flex items-center gap-2">
                <UserIcon size={20} /> Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold brutalist-border"
                  style={{ backgroundColor: accentColor }}
                >
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{profile.displayName}</h3>
                  <Badge variant="outline" className="brutalist-border uppercase text-[10px] tracking-widest mt-1">
                    {isMember ? (
                      <span className="flex items-center gap-1"><Crown size={10} /> member</span>
                    ) : profile.role}
                  </Badge>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold opacity-60">Email Address</Label>
                  <div className="flex items-center gap-2 p-3 bg-foreground/5 brutalist-border opacity-60">
                    <Mail size={18} />
                    <span>{profile.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-bold">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                    <Input 
                      id="phone" 
                      value={phoneNumber} 
                      onChange={(e) => setPhoneNumber(e.target.value)} 
                      placeholder="98464XXXXX"
                      className="pl-10 brutalist-border h-12"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={updating}
                  className="w-full brutalist-border brutalist-shadow-sm h-12"
                  style={{ backgroundColor: accentColor, color: '#1A1A1A' }}
                >
                  {updating ? 'Updating...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Membership card */}
          <Card className="brutalist-border brutalist-shadow bg-foreground text-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isMember ? <Crown size={20} /> : <ShieldCheck size={20} />}
                {isMember ? 'Membership Status' : 'Upgrade to Member'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isMember ? (
                <div className="py-4 space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2 uppercase tracking-tighter">
                      {profile.membershipType === 'none' ? 'Pending Activation' : `${profile.membershipType} Member`}
                    </div>
                    {profile.membershipExpiry && (
                      <p className="text-sm opacity-60">Expires: {profile.membershipExpiry}</p>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-background/20 pb-2">
                      <span className="opacity-60">Annual Fee</span>
                      <span className="font-bold">1000₹</span>
                    </div>
                    <div className="flex justify-between border-b border-background/20 pb-2">
                      <span className="opacity-60">Monthly Fee</span>
                      <span className="font-bold">500₹</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Priority Slots</span>
                      <span className="font-bold">6-7AM, 4-8PM</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-3xl font-bold mb-2 uppercase tracking-tighter">
                    Not a Member Yet
                  </div>
                  <p className="opacity-60 text-sm mb-4">Become a member to get priority booking and exclusive slots.</p>
                  <div className="text-sm space-y-1 opacity-70">
                    <p>1000₹/year + 500₹/month</p>
                    <p>Priority slots: 6-7 AM, 4-8 PM</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Bookings */}
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold tracking-tight mb-6 flex items-center gap-2">
            <Calendar size={28} /> My Bookings
          </h2>

          <div className="space-y-4">
            {myBookings.length === 0 ? (
              <div className="p-12 brutalist-border bg-white text-center">
                <p className="text-xl opacity-40">You haven't made any bookings yet.</p>
                <p className="mt-2 text-sm opacity-30">Head to the booking page to reserve your first slot!</p>
              </div>
            ) : (
              myBookings.map((booking) => (
                <div key={booking.id} className="p-6 brutalist-border bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 brutalist-border" style={{ backgroundColor: accentColor }}>
                      <Clock size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-xl">{booking.timeSlot}</div>
                      <div className="opacity-60 font-medium">{booking.date}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <Badge 
                      className={`
                        brutalist-border uppercase text-[10px] tracking-widest px-3 py-1
                        ${booking.status === 'approved' ? 'bg-green-500 text-white' : ''}
                        ${booking.status === 'denied' ? 'bg-red-500 text-white' : ''}
                        ${booking.status === 'pending' ? 'bg-yellow-500 text-black' : ''}
                      `}
                    >
                      {booking.status}
                    </Badge>
                    <div className="text-right">
                      <div className="font-bold">{isMember ? 'Included' : '300₹'}</div>
                      <div className="text-[10px] uppercase opacity-40">
                        {isMember ? 'in membership' : 'Pay at court'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
