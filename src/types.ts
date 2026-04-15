export type UserRole = 'admin' | 'member' | 'guest';
export type MembershipType = 'none' | 'monthly' | 'annual';
export type BookingStatus = 'pending' | 'approved' | 'denied';
export type PaymentStatus = 'pending' | 'paid';
export type PaymentMethod = 'online' | 'cash';
export type PortalType = 'guest' | 'member';
export type TrafficLevel = 'low' | 'medium' | 'high';
export type SlotBlockReason = 'maintenance' | 'tournament' | 'weather' | 'high_traffic' | 'private_event' | 'custom';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  role: UserRole;
  membershipType: MembershipType;
  membershipExpiry?: string;
}

export interface Booking {
  id: string;
  userId?: string;
  userName: string;
  userPhone: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g., "06-07"
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  type: 'guest' | 'member';
  createdAt: string;
}

export interface AppSettings {
  hourlyRate: number;
  membershipFeeAnnual: number;
  membershipFeeMonthly: number;
}

export interface BlockedSlot {
  id: string;
  date: string;
  timeSlot: string;
  type: 'blocked' | 'available';
  reason?: SlotBlockReason;
  customReason?: string;
}

export const TIME_SLOTS = [
  "06-07", "07-08", "08-09", "09-10", "10-11", "11-12",
  "12-13", "13-14", "14-15", "15-16", "16-17", "17-18",
  "18-19", "19-20", "20-21", "21-22"
];

export const DEFAULT_BLOCKED_SLOTS = [
  "06-07", "16-17", "17-18", "18-19", "19-20"
];

export const SLOT_BLOCK_REASONS: { value: SlotBlockReason; label: string }[] = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'weather', label: 'Weather Issue' },
  { value: 'high_traffic', label: 'High Traffic' },
  { value: 'private_event', label: 'Private Event' },
  { value: 'custom', label: 'Custom Reason' },
];
