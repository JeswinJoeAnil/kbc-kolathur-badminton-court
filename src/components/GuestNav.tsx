import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, User as UserIcon, LogOut, Home } from 'lucide-react';

interface GuestNavProps {
  user: any;
  onLogout: () => void;
}

export default function GuestNav({ user, onLogout }: GuestNavProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-background border-b-2 border-foreground px-4 py-3 portal-guest">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2">
          <span className="px-2 py-0.5 brutalist-border" style={{ backgroundColor: '#BEF264' }}>KBC</span>
          <span className="hidden sm:inline">Guest</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/" className="font-medium hover:opacity-70 transition-opacity">
            <Home size={18} />
          </Link>
          {user && (
            <>
              <Link
                to="/guest/book"
                className={`font-medium transition-colors flex items-center gap-1 ${isActive('/guest/book') ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
              >
                <Calendar size={16} /> Book
              </Link>
              <Link
                to="/guest/profile"
                className={`font-medium transition-colors flex items-center gap-1 ${isActive('/guest/profile') ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
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
