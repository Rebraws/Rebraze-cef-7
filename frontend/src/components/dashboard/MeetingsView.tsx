import React from 'react';
import MeetingCard from './MeetingCard';
import { Meeting } from '../../types';

interface MeetingsViewProps {
  meetings: Meeting[];
}

const MeetingsView: React.FC<MeetingsViewProps> = ({ meetings }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {meetings.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} />
      ))}
    </div>
  );
};

export default MeetingsView;