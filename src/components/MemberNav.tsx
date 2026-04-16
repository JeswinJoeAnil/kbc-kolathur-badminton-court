import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, User as UserIcon, LogOut, Home, Crown } from 'lucide-react';

interface MemberNavProps {
  user: any;
  profile: any;
  onLogout: () => void;
}

export default function MemberNav({ user, profile, onLogout }: MemberNavProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-background border-b-2 border-foreground px-4 py-3 portal-member">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2">
          <span className="px-2 py-0.5 brutalist-border" style={{ backgroundColor: '#FBBF24' }}>KBC</span>
          <span className="hidden sm:inline-flex items-center gap-1">
            <Crown size={16} /> Member
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/" className="font-medium hover:opacity-70 transition-opacity">
            <Home size={18} />
          </Link>
          {user && (
            <>
              <Link
                to="/member/book"
                className={`font-medium transition-colors flex items-center gap-1 ${isActive('/member/book') ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
              >
                <Calendar size={16} /> Book
              </Link>
              <Link
                to="/member/profile"
                className={`font-medium transition-colors flex items-center gap-1 ${isActive('/member/profile') ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
              >
                <UserIcon size={16} /> Profile
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="brutalist-border brutalist-shadow-sm"
              >
                <LogOut size={14} className="mr-1" /> Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
