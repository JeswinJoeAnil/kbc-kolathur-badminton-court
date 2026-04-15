import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Clock, Users, Home, Shield } from 'lucide-react';

interface AdminNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AdminNav({ activeTab, onTabChange }: AdminNavProps) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'requests', label: 'Requests', icon: CalendarCheck },
    { id: 'slots', label: 'Manage Slots', icon: Clock },
    { id: 'members', label: 'Members', icon: Users },
  ];

  return (
    <aside className="admin-sidebar border-r-2 border-foreground bg-white hidden lg:block portal-admin">
      <div className="p-6 border-b-2 border-foreground" style={{ backgroundColor: '#EF4444' }}>
        <div className="flex items-center gap-2 text-white">
          <Shield size={24} />
          <div>
            <h2 className="text-lg font-bold tracking-tight">Admin Panel</h2>
            <p className="text-xs opacity-80">KBC Management</p>
          </div>
        </div>
      </div>

      <div className="py-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`admin-sidebar-item w-full text-left ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 w-full p-4 border-t-2 border-foreground">
        <Link to="/" className="admin-sidebar-item text-sm opacity-60 hover:opacity-100">
          <Home size={16} /> Back to Site
        </Link>
      </div>
    </aside>
  );
}
