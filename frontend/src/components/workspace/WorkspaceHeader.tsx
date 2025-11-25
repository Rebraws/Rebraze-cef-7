import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, ChevronLeft, Download, ExternalLink, X, Share2, FileText, PlayCircle, Image as ImageIcon, FileCode, User, Settings, LogOut, Sparkles, Folder, Layout, Grid } from 'lucide-react';
import { Project, FileItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface WorkspaceHeaderProps {
  project: Project;
  onBack: () => void;
  isExplorerOpen: boolean;
  setExplorerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  explorerMode: 'sidebar' | 'maximized';
  setExplorerMode: React.Dispatch<React.SetStateAction<'sidebar' | 'maximized'>>;
  viewingFile: FileItem | null;
  setViewingFile: React.Dispatch<React.SetStateAction<FileItem | null>>;
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: 'files' | 'board' | 'overview';
  setActiveTab: (tab: 'files' | 'board' | 'overview') => void;
}

const getFileIcon = (type: string): ReactNode => {
  switch(type) {
    case 'pdf': return <FileText size={18} className="text-red-500" />;
    case 'video': return <PlayCircle size={18} className="text-purple-500" />;
    case 'image': return <ImageIcon size={18} className="text-blue-500" />;
    default: return <FileCode size={18} className="text-gray-500" />;
  }
};

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  project,
  onBack,
  isExplorerOpen,
  setExplorerOpen,
  explorerMode,
  setExplorerMode,
  viewingFile,
  setViewingFile,
  isChatOpen,
  setIsChatOpen,
  activeTab,
  setActiveTab
}) => {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

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

  const handleToggleClick = () => {
    if (explorerMode === 'maximized') {
      setExplorerMode('sidebar');
    } else {
      setExplorerOpen(!isExplorerOpen);
    }
  };

  const tabs = [
    { id: 'files', label: 'Files', icon: Folder },
    { id: 'board', label: 'Board', icon: Layout },
    { id: 'overview', label: 'Overview', icon: Grid },
  ] as const;

  return (
    <header className="h-16 border-b border-gray-200 bg-white/90 backdrop-blur-sm flex items-center justify-between px-4 pl-20 shrink-0 z-20">
      {/* Left: Navigation & Title */}
      <div className="flex items-center gap-4 min-w-[300px]">
          <div className="flex items-center gap-2">
             <button 
               onClick={handleToggleClick}
               className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
               title={isExplorerOpen ? "Collapse Sidebar" : "Expand Sidebar"}
             >
               {isExplorerOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
             </button>
             
             <div className="h-6 w-px bg-gray-200 mx-1 hidden md:block"></div>
             
             <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors group">
                <div className="p-1.5 rounded-md group-hover:bg-gray-100">
                  <ChevronLeft size={18} />
                </div>
             </button>
          </div>

          <div className="flex items-center gap-2 opacity-100 transition-opacity">
              <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${project.gradient}`} />
              <h1 className="text-base font-bold text-gray-800 tracking-tight">{project.title}</h1>
          </div>
      </div>

      {/* Center: Tabs */}
      <div className="flex-1 flex justify-center h-full items-end px-4">
        {explorerMode !== 'maximized' && (
         <div className="flex items-center space-x-1 h-full animate-in fade-in zoom-in-95 duration-300">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative group flex items-center gap-2 px-4 h-[calc(100%-12px)] text-sm font-medium transition-colors rounded-lg my-1.5
                  ${isActive ? 'text-gray-900 bg-gray-100/80' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                `}
              >
                <Icon size={16} className={isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'} />
                <span>{tab.label}</span>
                {isActive && (
                   <div className="absolute bottom-[-6px] left-0 right-0 h-[3px] bg-gradient-to-r from-orange-400 to-pink-500 rounded-t-full mx-2" />
                )}
              </button>
            );
          })}
        </div>
        )}
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-4 min-w-[200px] justify-end">
         {!isChatOpen && (
           <button
             onClick={() => setIsChatOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full shadow-[0_4px_14px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)] transition-all hover:-translate-y-0.5 active:translate-y-0"
           >
             <Sparkles size={16} fill="currentColor" className="text-white/90" />
             <span className="font-bold text-sm tracking-wide">Ask AI</span>
           </button>
         )}
         <button className="text-gray-400 hover:text-gray-600"><Share2 size={20} /></button>
         <div className="relative" ref={profileMenuRef}>
            <button onClick={() => setProfileMenuOpen(!isProfileMenuOpen)} className="w-9 h-9 rounded-full ring-2 ring-white shadow-sm overflow-hidden cursor-pointer hover:ring-gray-200 transition-all ml-1">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
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

export default WorkspaceHeader;