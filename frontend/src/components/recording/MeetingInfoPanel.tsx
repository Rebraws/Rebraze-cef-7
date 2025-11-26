import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, Video } from 'lucide-react';
import { Meeting } from '../../types';

interface MeetingInfoPanelProps {
  meeting: Meeting;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const MeetingInfoPanel: React.FC<MeetingInfoPanelProps> = ({ meeting, isOpen, setIsOpen }) => {
  const getPlatformColor = () => {
    switch (meeting.platform) {
      case 'zoom': return 'bg-blue-500';
      case 'google-meet': return 'bg-green-500';
      case 'teams': return 'bg-purple-600';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = () => {
    if (meeting.duration) return meeting.duration;
    if (meeting.endTime) {
      const diff = meeting.endTime.getTime() - meeting.startTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    return 'Unknown';
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-20 z-40 bg-white border border-gray-200 rounded-r-xl px-2 py-3 shadow-md hover:bg-gray-50 transition-all ${
          isOpen ? 'left-80' : 'left-0'
        }`}
        title={isOpen ? 'Hide meeting info' : 'Show meeting info'}
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Sidebar Panel */}
      <aside
        className={`h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          isOpen ? 'w-80' : 'w-0'
        } overflow-hidden`}
      >
        {isOpen && (
          <div className="flex-1 overflow-y-auto p-6">
            {/* Meeting Header */}
            <div className="mb-6">
              <div className={`${getPlatformColor()} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide inline-block mb-3`}>
                {meeting.platform}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{meeting.title}</h2>
              <p className="text-sm text-gray-500">{meeting.status === 'active' ? 'Active' : 'Ended'}</p>
            </div>

            {/* Meeting Details */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-1">Date</p>
                  <p className="text-sm text-gray-900">{formatDate(meeting.startTime)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-1">Duration</p>
                  <p className="text-sm text-gray-900">{formatDuration()}</p>
                </div>
              </div>

              {meeting.recordingUrl && (
                <div className="flex items-start gap-3">
                  <Video size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-1">Recording</p>
                    <p className="text-sm text-green-600 font-medium">Available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Participants */}
            {meeting.participants.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={18} className="text-gray-400" />
                  <h3 className="text-sm font-bold text-gray-900">
                    Participants ({meeting.participants.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {meeting.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {participant.name}
                        </p>
                        {participant.email && (
                          <p className="text-xs text-gray-500 truncate">{participant.email}</p>
                        )}
                      </div>
                      {participant.isActive ? (
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      ) : (
                        <span className="text-xs text-gray-400">Left</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting URL */}
            {meeting.meetingUrl && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-2">Meeting URL</p>
                <a
                  href={meeting.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 break-all"
                >
                  {meeting.meetingUrl}
                </a>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default MeetingInfoPanel;
