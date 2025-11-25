import React from 'react';
import { Meeting } from '../../types';
import MeetingSidebar from './MeetingSidebar';
import MaximizedMeetingExplorer from './MaximizedMeetingExplorer';

interface MeetingExplorerProps {
  meetings: Meeting[];
  currentMeeting: Meeting;
  onSelectMeeting: (meeting: Meeting) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  mode: 'sidebar' | 'maximized';
  setMode: (mode: 'sidebar' | 'maximized') => void;
}

const MeetingExplorer: React.FC<MeetingExplorerProps> = (props) => {
  if (props.mode === 'maximized') {
    return <MaximizedMeetingExplorer 
      meetings={props.meetings}
      onSelectMeeting={props.onSelectMeeting}
      setMode={props.setMode}
    />;
  }

  return <MeetingSidebar {...props} />;
};

export default MeetingExplorer;
