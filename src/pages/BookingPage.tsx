import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile, Booking, TIME_SLOTS, DEFAULT_BLOCKED_SLOTS, BlockedSlot, PortalType } from '@/types';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Clock, Calendar as CalendarIcon, User as UserIcon, Phone, Lock, Crown } from 'lucide-react';

interface BookingPageProps {
  user: User | null;
  profile: UserProfile | null;
  portalType?: PortalType;
}

export default function BookingPage({ user, profile, portalType = 'guest' }: BookingPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  
  // Form state
  const [userName, setUserName] = useState(profile?.displayName || '');
  const [userPhone, setUserPhone] = useState(profile?.phoneNumber || '');
  const [submitting, setSubmitting] = useState(false);

  const isMember = portalType === 'member';
  const accentColor = isMember ? '#FBBF24' : '#BEF264';

  useEffect(() => {
    if (profile) {
      setUserName(profile.displayName);
      setUserPhone(profile.phoneNumber);
    }
  }, [profile]);

  const loadSchedule = async (dateStr: string) => {
    const [{ data: bookedData, error: bookedError }, { data: blockedData, error: blockedError }] = await Promise.all([
      supabase.from('bookings').select('*').eq('date', dateStr).order('created_at', { ascending: true }),
      supabase.from('blockedSlots').select('*').eq('date', dateStr),
    ]);

    if (bookedError) {
      console.error(bookedError);
      toast.error('Failed to load bookings');
    } else {
      setBookings(bookedData as Booking[] ?? []);
    }

    if (blockedError) {
      console.error(blockedError);
      toast.error('Failed to load blocked slots');
    } else {
      setBlockedSlots(blockedData as BlockedSlot[] ?? []);
    }
  };

  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    loadSchedule(dateStr);
  }, [selectedDate]);

  const getSlotStatus = (slot: string) => {
    const booking = bookings.find(b => b.timeSlot === slot && b.status !== 'denied');
    if (booking) return { type: 'booked' as const, booking };

    const override = blockedSlots.find(b => b.timeSlot === slot);
    if (override) {
      return { type: override.type === 'blocked' ? 'blocked' as const : 'available' as const };
    }

    // Default blocked slots are member-only: guests see 'blocked', members see 'available'
    if (DEFAULT_BLOCKED_SLOTS.includes(slot)) {
      return { type: isMember ? 'member_slot' as const : 'blocked' as const };
    }

    return { type: 'available' as const };
  };

  const handleSlotClick = (slot: string) => {
    const status = getSlotStatus(slot);
    if (status.type === 'booked') {
      toast.error('This slot is already booked or pending approval');
      return;
    }
    if (status.type === 'blocked') {
      toast.error('This slot is reserved for members. Contact admin for availability.');
      return;
    }
    setSelectedSlot(slot);
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    if (!userName || !userPhone) {
      toast.error('Please provide your name and phone number');
      return;
    }

    setSubmitting(true);
    try {
      const tempBooking: Booking = {
        id: 'temp-' + Date.now(),
        user_id: user?.id || null,
        userName: userName,
        userPhone: userPhone,
        date: format(selectedDate, 'yyyy-MM-dd'),
        timeSlot: selectedSlot,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'cash',
        type: isMember ? 'member' : 'guest',
        createdAt: new Date().toISOString(),
      };

      // Optimistic update
      setBookings(prev => [...prev, tempBooking]);
      
      const newBooking = {
        user_id: user?.id || null,
        "userName": userName,
        "userPhone": userPhone,
        date: format(selectedDate, 'yyyy-MM-dd'),
        "timeSlot": selectedSlot,
        status: 'pending',
        "paymentStatus": 'pending',
        "paymentMethod": 'cash',
        type: isMember ? 'member' : 'guest',
      };

      const { error } = await supabase.from('bookings').insert(newBooking);
      if (error) throw error;

      toast.success('Booking request sent! Please wait for admin approval.');
      setIsBookingModalOpen(false);
      setSelectedSlot(null);
      // Wait slightly then refetch for genuine IDs
      setTimeout(() => loadSchedule(format(selectedDate, 'yyyy-MM-dd')), 1000);
    } catch (error) {
      console.error(error);
      toast.error('Failed to send booking request');
      // Revert optimistic update
      loadSchedule(format(selectedDate, 'yyyy-MM-dd'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">BOOK YOUR SLOT</h1>
        <p className="text-xl opacity-80">
          {isMember
            ? 'Priority access to all slots including member-exclusive times.'
            : 'Select a date and an available time slot below.'}
        </p>
        {isMember && (
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 brutalist-border text-sm font-bold" style={{ backgroundColor: accentColor }}>
            <Crown size={16} /> MEMBER PRIORITY ACCESS
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Date Selection */}
        <div className="lg:col-span-1">
          <Card className="brutalist-border brutalist-shadow">
            <CardHeader className="border-b-2 border-foreground" style={{ backgroundColor: accentColor }}>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon size={20} /> Select Date
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                className="rounded-md border-0"
              />
            </CardContent>
          </Card>

          <div className="mt-8 p-6 brutalist-border bg-white">
            <h3 className="font-bold text-lg mb-4">Legend</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 brutalist-border" style={{ backgroundColor: accentColor }}></div>
                <span>Available</span>
              </div>
              {isMember && (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 brutalist-border" style={{ backgroundColor: '#FBBF24', opacity: 0.6 }}></div>
                  <span>Member-Only Slot</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 brutalist-border bg-foreground/10"></div>
                <span>Booked / Pending</span>
              </div>
              {!isMember && (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 brutalist-border bg-foreground/5"></div>
                  <span>Member Only</span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing info */}
          <div className="mt-6 p-6 brutalist-border bg-foreground text-background">
            <h3 className="font-bold text-lg mb-2">
              {isMember ? 'Member Pricing' : 'Guest Pricing'}
            </h3>
            {isMember ? (
              <div>
                <p className="text-2xl font-bold">Included</p>
                <p className="text-sm opacity-60">in your monthly membership</p>
              </div>
            ) : (
              <div>
                <p className="text-2xl font-bold">300₹ <span className="text-sm font-normal opacity-60">/ hour</span></p>
                <p className="text-sm opacity-60 mt-1">Up to 6 people · Pay at court</p>
              </div>
            )}
          </div>
        </div>

        {/* Time Slots */}
        <div className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">
              {format(selectedDate, 'EEEE, MMMM do')}
            </h2>
            <div className="bg-foreground text-background px-3 py-1 brutalist-border text-sm font-bold">
              1 COURT AVAILABLE
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {TIME_SLOTS.map((slot) => {
              const status = getSlotStatus(slot);
              const isBooked = status.type === 'booked';
              const isBlocked = status.type === 'blocked';
              const isMemberSlot = status.type === 'member_slot';
              const isPending = isBooked && status.booking?.status === 'pending';

              return (
                <button
                  key={slot}
                  onClick={() => handleSlotClick(slot)}
                  disabled={isBooked || isBlocked}
                  className={`
                    p-6 brutalist-border text-lg font-bold transition-all
                    ${isBooked 
                      ? 'bg-foreground/10 cursor-not-allowed opacity-50' 
                      : isBlocked
                        ? 'bg-foreground/5 cursor-not-allowed opacity-40'
                        : isMemberSlot
                          ? 'hover:brutalist-shadow-sm hover:-translate-y-1 active:translate-y-0 active:shadow-none'
                          : 'hover:brutalist-shadow-sm hover:-translate-y-1 active:translate-y-0 active:shadow-none'
                    }
                  `}
                  style={
                    !isBooked && !isBlocked
                      ? { backgroundColor: isMemberSlot ? '#FBBF24' : accentColor }
                      : {}
                  }
                >
                  <div className="flex flex-col items-center gap-1">
                    {isBlocked ? <Lock size={20} /> : isMemberSlot ? <Crown size={20} /> : <Clock size={20} />}
                    {slot}
                    {isPending && <span className="text-[10px] uppercase tracking-widest opacity-60">Pending</span>}
                    {isBooked && !isPending && <span className="text-[10px] uppercase tracking-widest opacity-60">Booked</span>}
                    {isBlocked && <span className="text-[10px] uppercase tracking-widest opacity-60">Member Only</span>}
                    {isMemberSlot && <span className="text-[10px] uppercase tracking-widest opacity-80">Member Slot</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="brutalist-border brutalist-shadow max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Confirm Booking</DialogTitle>
            <DialogDescription className="text-lg">
              Booking for <span className="font-bold text-foreground">{selectedSlot}</span> on <span className="font-bold text-foreground">{format(selectedDate, 'MMM do')}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBookingSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-bold">Your Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <Input 
                  id="name" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                  placeholder="Enter your full name"
                  className="pl-10 brutalist-border h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-bold">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <Input 
                  id="phone" 
                  value={userPhone} 
                  onChange={(e) => setUserPhone(e.target.value)} 
                  placeholder="98464XXXXX"
                  className="pl-10 brutalist-border h-12"
                  required
                />
              </div>
            </div>

            <div className="p-4 brutalist-border text-sm" style={{ backgroundColor: `${accentColor}33` }}>
              <p className="font-bold mb-1">
                {isMember ? 'Member Booking' : 'Guest Booking'}
              </p>
              <p>
                {isMember
                  ? 'Your booking request will be sent for quick approval. No additional payment needed.'
                  : "Your booking will be sent to the admin for approval. You'll pay 300₹ at the court or via UPI after approval."}
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3">
              <Button type="button" variant="outline" onClick={() => setIsBookingModalOpen(false)} className="brutalist-border h-12 flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="brutalist-border brutalist-shadow-sm h-12 flex-1"
                style={{ backgroundColor: accentColor, color: '#1A1A1A' }}
              >
                {submitting ? 'Sending...' : 'Request Booking'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
