import React from 'react';
import MeetingCard from './MeetingCard';
import { Meeting } from '../../types';

interface MeetingsViewProps {
  meetings: Meeting[];
  onOpenMeeting?: (meeting: Meeting) => void;
}

const MeetingsView: React.FC<MeetingsViewProps> = ({ meetings, onOpenMeeting }) => {
  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No meetings yet</h3>
        <p className="text-gray-500">Your meeting history will appear here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {meetings.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          meeting={meeting}
          onOpenMeeting={onOpenMeeting}
        />
      ))}
    </div>
  );
};

export default MeetingsView;