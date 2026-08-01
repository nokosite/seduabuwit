import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function HorizontalNavbar({ userRole, userName, onLogout }) {
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Get user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name[0];
  };

  // Navigation items based on role
  const getNavItems = () => {
    if (userRole === 'admin') {
      return [
        { path: '/admin', label: 'Dashboard', icon: 'ph-fill ph-gauge' },
        { path: '/admin/datamaster', label: 'Data Master', icon: 'ph-fill ph-database' },
        { path: '/admin/laporan', label: 'Laporan', icon: 'ph-fill ph-file-text' },
        { path: '/admin/pengaturan', label: 'Pengaturan', icon: 'ph-fill ph-gear' },
      ];
    } else {
      return [
        { path: '/parent', label: 'Dashboard', icon: 'ph-fill ph-house' },
        { path: '/parent/riwayat', label: 'Riwayat', icon: 'ph-fill ph-clock-counter-clockwise' },
      ];
    }
  };

  const navItems = getNavItems();

  const isActive = (path) => {
    if (path === '/admin' || path === '/parent') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="horizontal-navbar fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ph-fill ph-graduation-cap text-white text-2xl"></i>
            </div>
            <div className="hidden lg:flex flex-col leading-tight">
              <span className="text-white/85 text-xs font-medium">Sistem Pembayaran</span>
              <span className="text-white text-base font-bold">SDN 2 Buwit</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  flex items-center gap-2
                  ${
                    isActive(item.path)
                      ? 'text-white bg-white/20'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <i className={`ph ${item.icon} text-lg`}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <i className="ph-fill ph-bell text-lg"></i>
              </Button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h6 className="font-semibold text-sm">Notifikasi</h6>
                  </div>
                  <div className="p-4 text-center text-gray-500 text-sm">
                    <i className="ph-fill ph-bell-slash text-2xl block mb-2 opacity-50"></i>
                    Belum ada notifikasi
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <i className="ph-fill ph-user text-lg"></i>
              </Button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 avatar-gradient">
                        <AvatarFallback className="text-white font-bold text-lg">
                          {getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{userName}</p>
                        <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={onLogout}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                    >
                      <i className="ph-fill ph-sign-out text-lg"></i>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-white/10">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-around py-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all
                  ${
                    isActive(item.path)
                      ? 'text-white bg-white/20'
                      : 'text-white/80'
                  }
                `}
              >
                <i className={`ph ${item.icon} text-xl`}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default HorizontalNavbar;
