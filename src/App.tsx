import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Lock, Home, ArrowRight, Crown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Pages
import LandingPage from './pages/LandingPage';
import GuestPortal from './pages/GuestPortal';
import MemberPortal from './pages/MemberPortal';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Routes>
          {/* Landing page with shared nav/footer */}
          <Route path="/" element={
            <>
              <nav className="sticky top-0 z-50 bg-background border-b-2 border-foreground px-4 py-3">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                  <Link to="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2">
                    <span className="bg-accent px-2 py-0.5 brutalist-border">KBC</span>
                    <span className="hidden sm:inline">Kolathur Badminton</span>
                  </Link>
                  <div className="flex items-center gap-3">
                    <Link to="/guest">
                      <Button variant="outline" className="brutalist-border brutalist-shadow-sm text-sm">
                        Guest Login
                      </Button>
                    </Link>
                    <Link to="/member">
                      <Button className="brutalist-border brutalist-shadow-sm text-sm" style={{ backgroundColor: '#FBBF24', color: '#1A1A1A' }}>
                        <Crown size={14} className="mr-1" /> Member
                      </Button>
                    </Link>
                  </div>
                </div>
              </nav>

              <main className="flex-grow">
                <LandingPage />
              </main>

              <footer className="bg-foreground text-background p-8 mt-12">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <h3 className="text-xl font-bold mb-4">KBC Kolathur</h3>
                    <p className="opacity-80">Premium indoor badminton court for everyone. Play, compete, and stay fit.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4">Contact</h3>
                    <p className="opacity-80">Near national lp school kolathur</p>
                    <p className="opacity-80">Phone: 9846422644</p>
                    <p className="opacity-80">Email: jeswinjoeanil5@gmail.com</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4">Hours</h3>
                    <p className="opacity-80">Open 7 days a week</p>
                    <p className="opacity-80">6:00 AM - 10:00 PM</p>
                  </div>
                </div>
                <div className="max-w-7xl mx-auto border-t border-background/20 mt-8 pt-8 text-center flex flex-col items-center gap-4">
                  <span className="opacity-60 text-sm">© {new Date().getFullYear()} Kolathur Badminton Court. All rights reserved.</span>
                  <Link to="/admin" className="text-xs uppercase tracking-widest font-bold opacity-40 hover:opacity-100 flex items-center gap-2 transition-opacity">
                    <Lock size={12} /> Admin Portal
                  </Link>
                </div>
              </footer>
            </>
          } />

          {/* Guest Portal — self-contained with own nav */}
          <Route path="/guest/*" element={<GuestPortal />} />

          {/* Member Portal — self-contained with own nav */}
          <Route path="/member/*" element={<MemberPortal />} />

          {/* Admin Dashboard — self-contained with sidebar */}
          <Route path="/admin" element={<AdminDashboard profile={null} />} />
        </Routes>

        <Toaster position="top-center" />
      </div>
    </Router>
  );
}
