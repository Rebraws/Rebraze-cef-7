
import React, { useState } from 'react';
import { Project } from '../types';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import Toolbar from '../components/dashboard/Toolbar';
import ProjectsGrid from '../components/dashboard/ProjectsGrid';
import RecentFolders from '../components/dashboard/RecentFolders';
import GlobalAiPanel from '../components/dashboard/GlobalAiPanel';
import MeetingsView from '../components/dashboard/MeetingsView';
import { mockMeetings } from '../mocks/meetings';

interface DashboardProps {
  projects: Project[];
  onOpenProject: (project: Project) => void;
  isAiOpen: boolean;
  setIsAiOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onJoinMeetingClick?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onOpenProject,
  isAiOpen,
  setIsAiOpen,
  onJoinMeetingClick
}) => {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-sans flex flex-col overflow-hidden selection:bg-orange-100 selection:text-orange-900">

      <DashboardHeader
        isAiOpen={isAiOpen}
        setIsAiOpen={setIsAiOpen}
        onJoinMeetingClick={onJoinMeetingClick}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <main className={`flex-1 overflow-y-auto transition-all duration-500 ${isAiOpen ? 'mr-0 md:mr-[420px]' : ''}`}>
          <div className="max-w-[1440px] mx-auto p-6 md:p-10 space-y-12">
            <Toolbar />
            
            {activeTab === 'Meetings' ? (
              <MeetingsView meetings={mockMeetings} />
            ) : (
              <>
                <ProjectsGrid projects={projects} onOpenProject={onOpenProject} />
                {activeTab === 'Home' && <RecentFolders />}
              </>
            )}
          </div>
        </main>

        <GlobalAiPanel isAiOpen={isAiOpen} setIsAiOpen={setIsAiOpen} />
      </div>
    </div>
  );
};

export default Dashboard;