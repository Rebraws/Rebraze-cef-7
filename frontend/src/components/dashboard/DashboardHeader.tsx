import React, { useState, useRef, useEffect } from 'react';
import { Home, LayoutGrid, FolderOpen, Users, Archive, Bell, Sparkles, User, Settings, LogOut, Video } from 'lucide-react';
import NavItem from '../common/NavItem';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardHeaderProps {
  isAiOpen: boolean;
  setIsAiOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onJoinMeetingClick?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ isAiOpen, setIsAiOpen, onJoinMeetingClick, activeTab, setActiveTab }) => {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'Home', icon: Home }, 
    { id: 'Projects', icon: LayoutGrid },
    { id: 'Meetings', icon: Video },
    { id: 'Workspace', icon: FolderOpen }, 
    { id: 'Shared', icon: Users }, 
    { id: 'Archive', icon: Archive }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);

  return (
    <header className="px-8 py-4 sticky top-0 z-40 flex items-center justify-between bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-transparent hover:border-gray-100 transition-colors">
      <div className="flex items-center gap-3 min-w-[160px]">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg">
          <span className="font-bold text-xl italic font-serif tracking-tight">R</span>
        </div>
        <span className="font-bold text-xl tracking-tight text-gray-900 font-serif">Rebraze</span>
      </div>

      <nav className="hidden md:flex items-center gap-2">
        {navItems.map((tab) => (
          <NavItem 
            key={tab.id}
            icon={tab.icon} 
            label={tab.id} 
            isActive={activeTab === tab.id} 
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </nav>

      <div className="flex items-center gap-5 min-w-[160px] justify-end">
        <button className="text-gray-400 hover:text-gray-600 relative transition-colors">
          <Bell size={22} />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-[#FDFBF7]"></span>
        </button>

        <button
          onClick={onJoinMeetingClick}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-[0_4px_14px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Video size={18} className="text-white/90" />
          <span className="font-bold text-sm tracking-wide">Join Meeting</span>
        </button>

        <button
          onClick={() => setIsAiOpen(!isAiOpen)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full shadow-[0_4px_14px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)] transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Sparkles size={18} fill="currentColor" className="text-white/90" />
          <span className="font-bold text-sm tracking-wide">Ask AI</span>
        </button>

        <div className="relative" ref={profileMenuRef}>
          <button onClick={() => setProfileMenuOpen(!isProfileMenuOpen)} className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm overflow-hidden cursor-pointer hover:ring-gray-200 transition-all">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.name || 'User'} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </button>
          {isProfileMenuOpen && (
             <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-2 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-bold text-sm text-gray-800">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="py-1">
                    <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><User size={16} /> Your Profile</a>
                    <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Settings size={16} /> Settings</a>
                </div>
                <div className="h-px bg-gray-100 my-1"></div>
                <button
                  onClick={async () => {
                    setProfileMenuOpen(false);
                    await logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;