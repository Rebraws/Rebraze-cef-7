
import React, { useState, useEffect } from 'react';
import { Project, Meeting } from '../types';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import Toolbar from '../components/dashboard/Toolbar';
import ProjectsGrid from '../components/dashboard/ProjectsGrid';
import RecentFolders from '../components/dashboard/RecentFolders';
import GlobalAiPanel from '../components/dashboard/GlobalAiPanel';
import MeetingsView from '../components/dashboard/MeetingsView';
import MaximizedMeetingExplorer from '../components/recording/MaximizedMeetingExplorer';
import { meetingService } from '../services/meetingService';
import { Maximize2 } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  onOpenProject: (project: Project) => void;
  isAiOpen: boolean;
  setIsAiOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onJoinMeetingClick?: () => void;
  onOpenMeeting?: (meeting: Meeting) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onOpenProject,
  isAiOpen,
  setIsAiOpen,
  onJoinMeetingClick,
  onOpenMeeting
}) => {
  const [activeTab, setActiveTab] = useState('Home');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isMeetingManagerOpen, setMeetingManagerOpen] = useState(false);

  // Load meetings from localStorage
  useEffect(() => {
    const loadMeetings = () => {
      const allMeetings = meetingService.getAllMeetings();
      // Sort by start time, most recent first
      const sortedMeetings = allMeetings.sort((a, b) =>
        b.startTime.getTime() - a.startTime.getTime()
      );
      setMeetings(sortedMeetings);
    };

    loadMeetings();

    // Reload when tab changes to Meetings to catch any updates
    if (activeTab === 'Meetings') {
      loadMeetings();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-sans flex flex-col overflow-hidden selection:bg-orange-100 selection:text-orange-900">

      <DashboardHeader
        isAiOpen={isAiOpen}
        setIsAiOpen={setIsAiOpen}
        onJoinMeetingClick={onJoinMeetingClick}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex overflow-hidden relative h-full">
        <main className={`flex-1 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] h-full ${isAiOpen ? 'md:mr-[420px]' : 'mr-0'}`}>
          {isMeetingManagerOpen ? (
             <div className="h-full flex flex-col">
                <MaximizedMeetingExplorer 
                  meetings={meetings}
                  onSelectMeeting={(m) => onOpenMeeting?.(m)}
                  setMode={(mode) => { if (mode === 'sidebar') setMeetingManagerOpen(false); }}
                />
             </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="max-w-[1440px] mx-auto p-6 md:p-10 space-y-12">
                <Toolbar />
                
                {activeTab === 'Meetings' ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 font-serif">Recent Meetings</h2>
                      <button 
                        onClick={() => setMeetingManagerOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Maximize2 size={16} />
                        <span>Expand View</span>
                      </button>
                    </div>
                    <MeetingsView meetings={meetings} onOpenMeeting={onOpenMeeting} />
                  </div>
                ) : (
                  <>
                    <ProjectsGrid projects={projects} onOpenProject={onOpenProject} />
                    {activeTab === 'Home' && <RecentFolders />}
                  </>
                )}
              </div>
            </div>
          )}
        </main>

        <GlobalAiPanel isAiOpen={isAiOpen} setIsAiOpen={setIsAiOpen} />
      </div>
    </div>
  );
};

export default Dashboard;