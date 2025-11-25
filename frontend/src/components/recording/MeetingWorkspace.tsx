import React from 'react';
import { Meeting } from '../../types';
import VideoPlayer from './VideoPlayer';
import MeetingNotes from './MeetingNotes';
import { Presentation, BrainCircuit } from 'lucide-react';

interface MeetingWorkspaceProps {
  meeting: Meeting;
  activeTab: 'video' | 'notes' | 'slides' | 'mindmap';
}

const MeetingWorkspace: React.FC<MeetingWorkspaceProps> = ({ meeting, activeTab }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'video':
        return (
            <div className="w-full h-full p-4 bg-gray-50 overflow-hidden">
                 <VideoPlayer 
                    meeting={meeting} 
                    className="w-full h-full shadow-sm"
                 />
            </div>
        );
      case 'notes':
        return <MeetingNotes />;
      case 'slides':
        return (
          <div className="h-full flex items-center justify-center flex-col text-gray-400 bg-white">
             <Presentation size={48} className="mb-4 opacity-20" />
             <p>Slides Generation coming soon...</p>
             <button className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                Generate Slides with AI
             </button>
          </div>
        );
      case 'mindmap':
        return (
          <div className="h-full flex items-center justify-center flex-col text-gray-400 bg-white">
             <BrainCircuit size={48} className="mb-4 opacity-20" />
             <p>Mind Map Visualization coming soon...</p>
             <button className="mt-4 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors">
                Create Mind Map
             </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {renderContent()}
    </div>
  );
};

export default MeetingWorkspace;
