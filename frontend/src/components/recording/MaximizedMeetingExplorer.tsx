import React, { useState, useMemo } from 'react';
import { 
  Grid, List, Minimize2, Search, Video, Calendar, Clock, 
  Folder, Star, Trash2, MoreHorizontal, Plus, Film 
} from 'lucide-react';
import { Meeting } from '../../types';

interface MaximizedMeetingExplorerProps {
  meetings: Meeting[];
  onSelectMeeting: (meeting: Meeting) => void;
  setMode: (mode: 'sidebar' | 'maximized') => void;
}

const MaximizedMeetingExplorer: React.FC<MaximizedMeetingExplorerProps> = ({
  meetings,
  onSelectMeeting,
  setMode
}) => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Meetings');

  const categories = [
    { id: 'All Meetings', icon: Video, count: meetings.length },
    { id: 'Recorded', icon: Film, count: meetings.filter(m => m.recordingUrl).length },
    { id: 'Favorites', icon: Star, count: 0 },
    { id: 'Trash', icon: Trash2, count: 0 },
  ];

  const filteredMeetings = useMemo(() => {
    let filtered = meetings.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeCategory === 'Recorded') {
      filtered = filtered.filter(m => m.recordingUrl);
    }
    // Add other category filters here when implemented

    return filtered;
  }, [meetings, searchQuery, activeCategory]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    }).format(date);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'zoom': return 'text-blue-500 bg-blue-50 border-blue-100';
      case 'google-meet': return 'text-green-500 bg-green-50 border-green-100';
      case 'teams': return 'text-purple-600 bg-purple-50 border-purple-100';
      default: return 'text-gray-500 bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="flex h-full bg-[#FDFBF7] animate-in fade-in duration-300" onContextMenu={(e) => e.preventDefault()}>
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 p-4 flex flex-col" onContextMenu={(e) => e.preventDefault()}>
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-lg font-bold text-gray-900">Meetings</h2>
           <button onClick={() => setMode('sidebar')} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Collapse View">
             <Minimize2 size={18} />
           </button>
        </div>

        <button className="flex items-center gap-2 w-full bg-orange-500 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-sm mb-6">
           <Plus size={18} />
           <span>New Meeting</span>
        </button>

        <div className="space-y-1 flex-1">
           {categories.map(cat => (
             <button
               key={cat.id}
               onClick={() => setActiveCategory(cat.id)}
               className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}
             >
               <div className="flex items-center gap-3">
                 <cat.icon size={18} className={activeCategory === cat.id ? 'text-orange-500' : 'text-gray-400'} />
                 <span>{cat.id}</span>
               </div>
               <span className="text-xs text-gray-400">{cat.count}</span>
             </button>
           ))}
        </div>

        <div className="pt-4 border-t border-gray-200 mt-4">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Folders</h3>
           <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                 <Folder size={18} className="text-gray-400" />
                 <span>Project Alpha</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                 <Folder size={18} className="text-gray-400" />
                 <span>Q4 Planning</span>
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#FDFBF7] h-full" onContextMenu={(e) => e.preventDefault()}>
        {/* Header */}
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-[#FDFBF7]/80 backdrop-blur-sm sticky top-0 z-10">
           <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="hover:text-gray-800 cursor-pointer">Meetings</span>
              <span>/</span>
              <span className="font-semibold text-gray-900">{activeCategory}</span>
           </div>

           <div className="flex items-center gap-3">
              <div className="relative">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 bg-gray-100 border-transparent focus:bg-white focus:border-orange-300 rounded-lg pl-10 pr-4 py-1.5 text-sm transition-all outline-none ring-0 focus:ring-2 focus:ring-orange-100"
                 />
              </div>
              <div className="h-6 w-px bg-gray-200 mx-1"></div>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setView('grid')} className={`p-1.5 rounded-md transition-all ${view === 'grid' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}><Grid size={16} /></button>
                  <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}><List size={16} /></button>
              </div>
           </div>
        </header>

        {/* Content Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
           {filteredMeetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                 <Video size={48} className="mb-4 opacity-20" />
                 <h3 className="text-lg font-medium text-gray-600">No meetings found</h3>
                 <p className="text-sm">Try adjusting your search or category.</p>
              </div>
           ) : view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {filteredMeetings.map(meeting => (
                    <div
                      key={meeting.id}
                      onDoubleClick={() => onSelectMeeting(meeting)}
                      onContextMenu={(e) => e.preventDefault()}
                      className="group bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer flex flex-col relative"
                    >
                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${getPlatformColor(meeting.platform)}`}>
                          <Video size={20} />
                       </div>
                       <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{meeting.title}</h3>
                       <div className="mt-auto pt-3 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                             <Calendar size={12} />
                             <span>{formatDate(meeting.startTime)}</span>
                          </div>
                          {meeting.recordingUrl && <Film size={12} className="text-blue-500" />}
                       </div>
                       <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded text-gray-400 transition-all">
                          <MoreHorizontal size={16} />
                       </button>
                    </div>
                 ))}
              </div>
           ) : (
              <div className="flex flex-col gap-2">
                 {filteredMeetings.map(meeting => (
                    <div
                      key={meeting.id}
                      onDoubleClick={() => onSelectMeeting(meeting)}
                      onContextMenu={(e) => e.preventDefault()}
                      className="group flex items-center bg-white rounded-xl border border-gray-100 p-3 hover:shadow-sm transition-all cursor-pointer"
                    >
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getPlatformColor(meeting.platform)}`}>
                          <Video size={16} />
                       </div>
                       <div className="flex-1 min-w-0 mr-4">
                          <h3 className="font-semibold text-sm text-gray-800 truncate">{meeting.title}</h3>
                       </div>
                       <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5 w-32">
                             <Calendar size={14} className="text-gray-400" />
                             {formatDate(meeting.startTime)}
                          </span>
                          <span className="flex items-center gap-1.5 w-20">
                             <Clock size={14} className="text-gray-400" />
                             {meeting.duration}
                          </span>
                          <div className="w-8 flex justify-center">
                             {meeting.recordingUrl && <Film size={16} className="text-blue-500" />}
                          </div>
                          <button className="p-1 hover:bg-gray-100 rounded text-gray-400">
                             <MoreHorizontal size={16} />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default MaximizedMeetingExplorer;
