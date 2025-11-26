import React, { useState } from 'react';
import { 
  Video, Maximize2, Calendar, Clock, Search 
} from 'lucide-react';
import { Meeting } from '../../types';

interface MeetingSidebarProps {
  meetings: Meeting[];
  currentMeeting: Meeting;
  onSelectMeeting: (meeting: Meeting) => void;
  isOpen: boolean;
  setMode: (mode: 'sidebar' | 'maximized') => void;
}

const MeetingSidebar: React.FC<MeetingSidebarProps> = ({
  meetings,
  currentMeeting,
  onSelectMeeting,
  isOpen,
  setMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'zoom': return 'text-blue-500 bg-blue-50';
      case 'google-meet': return 'text-green-500 bg-green-50';
      case 'teams': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <aside 
      className={`bg-[#FAF9F6] border-r border-gray-200 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] z-10 ${isOpen ? 'w-80 translate-x-0 opacity-100' : 'w-0 -translate-x-10 opacity-0 overflow-hidden'}`}
    >
      <div className="p-5 pb-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search meetings..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="px-5 py-3 flex items-center justify-between">
         <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Meetings</h3>
         <button onClick={() => setMode('maximized')} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md" title="Maximize View">
            <Maximize2 size={14} />
         </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {filteredMeetings.map(meeting => {
          const isActive = currentMeeting.id === meeting.id;
          return (
            <div
              key={meeting.id}
              onClick={() => onSelectMeeting(meeting)}
              className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                isActive 
                  ? 'bg-white border-orange-200 shadow-sm' 
                  : 'bg-transparent border-transparent hover:bg-gray-100'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getPlatformColor(meeting.platform)}`}>
                <Video size={18} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-semibold mb-1 truncate ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                  {meeting.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDate(meeting.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{formatTime(meeting.startTime)}</span>
                  </div>
                </div>
              </div>

              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2"></div>
              )}
            </div>
          );
        })}
        
        {filteredMeetings.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
                No meetings found
            </div>
        )}
      </div>
    </aside>
  );
};

export default MeetingSidebar;
