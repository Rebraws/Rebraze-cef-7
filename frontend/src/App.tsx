
import React, { useState, useMemo, useEffect } from 'react';
import { ViewState, Project, Meeting as MeetingType } from './types';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Meeting from './pages/Meeting';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import MeetingModal from './components/common/MeetingModal';
import { MOCK_PROJECTS as initialProjects } from './mocks/projects';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { meetingService } from './services/meetingService';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [currentView, setCurrentView] = useState<'dashboard' | 'workspace' | 'meeting'>('dashboard');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAuthCallback, setIsAuthCallback] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<MeetingType | null>(null);

  const { isAuthenticated, isLoading } = useAuth();

  const activeProject = useMemo(() =>
    projects.find(p => p.id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  // Check if we're on the auth callback route
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('token')) {
      setIsAuthCallback(true);
    }
  }, []);

  const handleOpenProject = (project: Project) => {
    setActiveProjectId(project.id);
    setCurrentView('workspace');
    setIsAiOpen(false); // Close global AI when opening a project
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setActiveProjectId(null);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(currentProjects =>
      currentProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  };

  const handleAuthSuccess = () => {
    setIsAuthCallback(false);
    setCurrentView('dashboard');
  };

  const handleJoinMeetingClick = () => {
    setIsMeetingModalOpen(true);
  };

  const handleJoinMeeting = (title: string, meetingUrl: string) => {
    // Create the meeting using the service
    const meeting = meetingService.createMeeting(title, meetingUrl);
    setCurrentMeeting(meeting);
    setCurrentView('meeting');
    setIsMeetingModalOpen(false);
    setIsAiOpen(false); // Close global AI when joining a meeting
  };

  const handleLeaveMeeting = () => {
    setCurrentView('dashboard');
    setCurrentMeeting(null);
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth callback page if we're handling the OAuth callback
  if (isAuthCallback) {
    return <AuthCallback onSuccess={handleAuthSuccess} />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show main app if authenticated
  return (
    <>
      {currentView === 'dashboard' && (
        <Dashboard
          projects={projects}
          onOpenProject={handleOpenProject}
          isAiOpen={isAiOpen}
          setIsAiOpen={setIsAiOpen}
          onJoinMeetingClick={handleJoinMeetingClick}
        />
      )}
      {currentView === 'workspace' && activeProject && (
        <Workspace
          key={activeProject.id}
          project={activeProject}
          onBack={handleBackToDashboard}
          onUpdateProject={handleUpdateProject}
        />
      )}
      {currentView === 'meeting' && currentMeeting && (
        <Meeting
          meeting={currentMeeting}
          onLeaveMeeting={handleLeaveMeeting}
        />
      )}

      <MeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        onJoinMeeting={handleJoinMeeting}
      />
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;