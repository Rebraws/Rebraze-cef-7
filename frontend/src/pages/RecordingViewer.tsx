import React, { useState, useEffect } from 'react';
import { Meeting as MeetingType, ChatMessage } from '../types';
import MeetingHeader from '../components/recording/MeetingHeader';
import MeetingExplorer from '../components/recording/MeetingExplorer';
import VideoPlayer from '../components/recording/VideoPlayer';
import ChatInterface from '../components/workspace/ChatInterface';
import { generateChatResponse } from '../services/geminiService';
import { meetingService } from '../services/meetingService';

interface RecordingViewerProps {
  meeting: MeetingType;
  onBack: () => void;
}

const RecordingViewer: React.FC<RecordingViewerProps> = ({ meeting: initialMeeting, onBack }) => {
  const [currentMeeting, setCurrentMeeting] = useState<MeetingType>(initialMeeting);
  const [meetings, setMeetings] = useState<MeetingType[]>([]);
  
  // Layout State
  const [isExplorerOpen, setExplorerOpen] = useState(true);
  const [explorerMode, setExplorerMode] = useState<'sidebar' | 'maximized'>('sidebar');
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Load all meetings
  useEffect(() => {
    const allMeetings = meetingService.getAllMeetings();
    const sortedMeetings = allMeetings.sort((a, b) => 
      b.startTime.getTime() - a.startTime.getTime()
    );
    setMeetings(sortedMeetings);
  }, []);

  // Reset chat when meeting changes
  useEffect(() => {
    setMessages([
      {
        id: '1',
        sender: 'ai',
        text: `Hi! This is the recording from "${currentMeeting.title}". I can help you with questions about this meeting, summarize key points, or create action items. What would you like to know?`,
        timestamp: new Date()
      }
    ]);
  }, [currentMeeting.id, currentMeeting.title]);

  // Auto-manage chat based on explorer mode (mimicking Workspace behavior)
  useEffect(() => {
    if (explorerMode === 'maximized') {
      setIsChatOpen(false);
    } else if (explorerMode === 'sidebar') {
      setIsChatOpen(true);
    }
  }, [explorerMode]);

  const handleSend = async (input: string) => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Add loading indicator
    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: loadingId,
      sender: 'ai',
      text: '...',
      timestamp: new Date(),
      isLoading: true
    }]);
    setIsAiTyping(true);

    const aiResponseText = await generateChatResponse(input, messages);

    // Replace loading indicator with actual response
    setMessages(prev => prev.map(msg =>
      msg.id === loadingId
        ? { ...msg, text: aiResponseText, isLoading: false }
        : msg
    ));
    setIsAiTyping(false);
  };

  const handleSelectMeeting = (meeting: MeetingType) => {
    setCurrentMeeting(meeting);
    // If we were in maximized mode, we might want to switch back to sidebar to see the video?
    // Or maybe stay in maximized if the user wants to browse?
    // Let's switch to sidebar to show the content, similar to how clicking a file opens it.
    if (explorerMode === 'maximized') {
        setExplorerMode('sidebar');
    }
  };

  return (
    <div className="h-screen bg-[#FDFBF7] flex flex-col overflow-hidden">
      <MeetingHeader
        meeting={currentMeeting}
        onBack={onBack}
        isExplorerOpen={isExplorerOpen}
        setExplorerOpen={setExplorerOpen}
        explorerMode={explorerMode}
        setExplorerMode={setExplorerMode}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <MeetingExplorer
          meetings={meetings}
          currentMeeting={currentMeeting}
          onSelectMeeting={handleSelectMeeting}
          isOpen={isExplorerOpen}
          setIsOpen={setExplorerOpen}
          mode={explorerMode}
          setMode={setExplorerMode}
        />

        {(explorerMode === 'sidebar' || isChatOpen) && (
          <main className="flex-1 flex flex-col md:flex-row relative bg-[#FDFBF7] overflow-hidden">
            {explorerMode === 'sidebar' && (
              <VideoPlayer
                meeting={currentMeeting}
                isChatOpen={isChatOpen}
              />
            )}
            {isChatOpen && (
              <ChatInterface
                messages={messages}
                handleSend={handleSend}
                selectedFileCount={0}
                isAiTyping={isAiTyping}
                onClose={() => setIsChatOpen(false)}
              />
            )}
          </main>
        )}
      </div>
    </div>
  );
};

export default RecordingViewer;