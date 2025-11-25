import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Clock, Calendar, Video, Play, Share2, Trash2, Download } from 'lucide-react';
import { Meeting } from '../../types';

interface MeetingCardProps {
  meeting: Meeting;
  onOpenMeeting?: (meeting: Meeting) => void;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, onOpenMeeting }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const getPlatformIcon = () => {
    // simple logic to return a color/style based on platform
    // For now just returning colors, could be specific icons if imported
    switch (meeting.platform) {
      case 'zoom': return 'bg-blue-500';
      case 'teams': return 'bg-purple-600';
      case 'google-meet': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
  };

  const handleCardClick = () => {
    if (onOpenMeeting) {
      onOpenMeeting(meeting);
    }
  };

  return (
    <div
      className="group relative bg-white rounded-[28px] overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col shadow-sm hover:shadow-md border border-gray-100"
      onDoubleClick={handleCardClick}
      onContextMenu={(e) => e.preventDefault()}
    >

      {/* Thumbnail Section */}
      <div className="relative h-40 bg-gray-100">
        {meeting.thumbnailUrl ? (
          <img src={meeting.thumbnailUrl} alt={meeting.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
            <Video size={40} />
          </div>
        )}

        <div className="absolute top-4 left-4">
            <div className={`${getPlatformIcon()} text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm`}>
                {meeting.platform}
            </div>
        </div>

        {meeting.recordingUrl && (
           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20 backdrop-blur-[2px]">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-gray-900 shadow-lg hover:scale-110 transition-transform">
                <Play size={20} className="ml-1" fill="currentColor" />
              </div>
           </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-[17px] font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
            {meeting.title}
          </h3>
          <div className="relative ml-2" ref={menuRef}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!isMenuOpen);
              }}
              className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-2 animate-in fade-in zoom-in-95"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenMeeting) {
                      onOpenMeeting(meeting);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Play size={16} /> View Meeting
                </button>
                <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Share2 size={16} /> Share</a>
                <div className="h-px bg-gray-100 my-1"></div>
                <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={16} /> Delete</a>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-5">
             <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <Calendar size={14} className="text-gray-400" />
                <span>{formatDate(meeting.startTime)}</span>
             </div>
             <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <Clock size={14} className="text-gray-400" />
                <span>{meeting.duration}</span>
             </div>
        </div>

        <div className="mt-auto pt-4 border-t border-dashed border-gray-100 flex justify-between items-center">
             <div className="flex -space-x-2">
                {meeting.participants.slice(0, 4).map((p, i) => (
                  <div key={i} className="w-7 h-7 rounded-full ring-2 ring-white bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600" title={p.name}>
                    {p.name.charAt(0)}
                  </div>
                ))}
                {meeting.participants.length > 4 && (
                    <div className="w-7 h-7 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        +{meeting.participants.length - 4}
                    </div>
                )}
            </div>
            {meeting.recordingUrl && (
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    Recorded
                </span>
            )}
        </div>
      </div>
    </div>
  );
};

export default MeetingCard;