import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Video, Clock, Sparkles, Send, Mic, MicOff, VideoOff, Pause, Play, Circle, Square, X } from 'lucide-react';
import { Meeting as MeetingType, ChatMessage } from '../types';
import { meetingService } from '../services/meetingService';
import { joinMeeting, leaveMeeting, updateMeetingBounds, isCEF, getMeetingPageInfo, setMeetingPageInfoCallback, MeetingPageInfo, getMeetingParticipants, setMeetingParticipantsCallback, startRecording, stopRecording, saveRecording, setScreencastFrameCallback, setRecordingSavedCallback } from '../utils/cefBridge';
import { generateChatResponse } from '../services/geminiService';

interface MeetingProps {
  meeting: MeetingType;
  onLeaveMeeting: () => void;
}

const Meeting: React.FC<MeetingProps> = ({ meeting, onLeaveMeeting }) => {
  const [currentMeeting, setCurrentMeeting] = useState<MeetingType>(meeting);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  
  // Meeting controls state
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // AI Chat state
  const [isAiOpen, setIsAiOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hi! I'm your AI assistant for this meeting. I can help you take notes, track action items, or answer questions. How can I help?`,
      timestamp: new Date()
    }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [meetingPageInfo, setMeetingPageInfo] = useState<MeetingPageInfo | null>(null);
  const [meetingParticipants, setMeetingParticipants] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reference to the meeting content area for positioning the native browser
  const contentAreaRef = useRef<HTMLDivElement>(null);
  
  // Ref to track last bounds to avoid redundant updates
  const lastBoundsRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Ref to track if we have already initiated leaving the meeting to prevent race conditions
  const meetingLeftRef = useRef(false);

  // Recording refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const updateBoundsIfNeeded = () => {
    if (meetingLeftRef.current) return;
    if (!contentAreaRef.current) return;
    
    const rect = contentAreaRef.current.getBoundingClientRect();
    const x = Math.round(rect.left);
    const y = Math.round(rect.top);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    // Ignore invalid dimensions
    if (w <= 0 || h <= 0) return;

    // Check if changed
    if (
      x === lastBoundsRef.current.x &&
      y === lastBoundsRef.current.y &&
      w === lastBoundsRef.current.w &&
      h === lastBoundsRef.current.h
    ) {
      return;
    }

    // Update
    lastBoundsRef.current = { x, y, w, h };
    updateMeetingBounds(x, y, w, h);
  };

  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - currentMeeting.startTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [currentMeeting.startTime]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up meeting page info and participants callbacks
  useEffect(() => {
    if (!isCEF()) return;

    setMeetingPageInfoCallback((info) => {
      console.log('[Meeting] Received page info:', info);
      setMeetingPageInfo(info);
    });

    setMeetingParticipantsCallback((participants) => {
      console.log('[Meeting] Received participants:', participants);
      setMeetingParticipants(participants);
    });

    setScreencastFrameCallback((data) => {
      if (!canvasRef.current) return;

      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;

        // Set canvas dimensions to match image (first frame only effectively)
        if (canvasRef.current.width !== img.width || canvasRef.current.height !== img.height) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
        }

        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }

        // Start recording on first frame if enabled
        if (isRecording && !mediaRecorderRef.current) {
           const stream = canvasRef.current.captureStream(30); // 30 FPS
           const options = { mimeType: 'video/webm;codecs=vp9' };

           try {
             mediaRecorderRef.current = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);
           } catch (e) {
             console.warn('VP9 not supported, falling back to default');
             mediaRecorderRef.current = new MediaRecorder(stream);
           }

           mediaRecorderRef.current.ondataavailable = (event) => {
             if (event.data && event.data.size > 0) {
               recordedChunksRef.current.push(event.data);
             }
           };

           mediaRecorderRef.current.onstop = () => {
             const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
             saveRecording(blob);
             recordedChunksRef.current = [];
             mediaRecorderRef.current = null;
           };

           mediaRecorderRef.current.start(1000); // Collect chunks every second
        }
      };
      img.src = 'data:image/jpeg;base64,' + data;
    });

    setRecordingSavedCallback((meetingId, recordingPath) => {
      console.log('[Meeting] Recording saved:', meetingId, recordingPath);
      meetingService.saveRecordingUrl(meetingId, recordingPath);

      // Update current meeting state if this is the current meeting
      if (meetingId === currentMeeting.id) {
        setCurrentMeeting(prev => ({
          ...prev,
          recordingUrl: recordingPath
        }));
      }
    });

    // Request page info and sync bounds periodically to keep it updated/visible
    const interval = setInterval(() => {
      if (meetingLeftRef.current) return;
      getMeetingPageInfo();
      updateBoundsIfNeeded();
    }, 3000);

    // Initial request
    setTimeout(() => {
      getMeetingPageInfo();
      updateBoundsIfNeeded();
    }, 1000);

    return () => {
      clearInterval(interval);
      setMeetingPageInfoCallback(() => {});
      setMeetingParticipantsCallback(() => {});
      setScreencastFrameCallback(() => {});
      setRecordingSavedCallback(() => {});
    };
  }, [isRecording, currentMeeting.id]);

  // Handle recording toggle
  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop
      stopRecording();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start
      startRecording(currentMeeting.id);
      setIsRecording(true);
      // MediaRecorder will start on first frame
    }
  };

  // Initialize native meeting view in CEF and handle resizing
  useEffect(() => {
    if (!isCEF()) {
      console.log('[Meeting] Not in CEF environment, using fallback mode');
      return;
    }

    const initializeMeetingView = () => {
      if (!contentAreaRef.current) {
        console.warn('[Meeting] Content area ref not ready');
        return;
      }

      const rect = contentAreaRef.current.getBoundingClientRect();
      console.log('[Meeting] Content area bounds:', rect);

      // Join the meeting with the native browser view
      const success = joinMeeting(
        currentMeeting.meetingUrl,
        Math.round(rect.left),
        Math.round(rect.top),
        Math.round(rect.width),
        Math.round(rect.height)
      );

      if (success) {
        console.log('[Meeting] Native meeting view initialized successfully');
        // Force initial bounds update
        updateBoundsIfNeeded();
      } else {
        console.error('[Meeting] Failed to initialize native meeting view');
      }
    };

    // Wait a bit for the layout to stabilize
    const timer = setTimeout(initializeMeetingView, 100);

    // Use ResizeObserver to handle all size changes (window resize, sidebar toggle, etc.)
    const resizeObserver = new ResizeObserver(() => {
      if (!meetingLeftRef.current) {
        updateBoundsIfNeeded();
      }
    });

    if (contentAreaRef.current) {
      resizeObserver.observe(contentAreaRef.current);
    }

    // Cleanup: leave the meeting when component unmounts
    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      if (!meetingLeftRef.current) {
        leaveMeeting();
      }
      console.log('[Meeting] Native meeting view cleaned up');
    };
  }, [currentMeeting.meetingUrl]);

  // Handle sending chat message
  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text || isAiTyping) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setChatInput('');

    // Add loading indicator
    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: loadingId,
      sender: 'ai',
      text: '',
      timestamp: new Date(),
      isLoading: true
    }]);
    setIsAiTyping(true);

    // Check if user is asking about the meeting page
    const lowerText = text.toLowerCase();
    const isMeetingQuery = lowerText.includes('site') ||
                          lowerText.includes('page') ||
                          lowerText.includes('title') ||
                          lowerText.includes('url') ||
                          lowerText.includes('what meeting') ||
                          lowerText.includes('which meeting') ||
                          lowerText.includes('where am i');

    const isParticipantQuery = lowerText.includes('participant') ||
                               lowerText.includes('who') ||
                               lowerText.includes('people') ||
                               lowerText.includes('attendee') ||
                               lowerText.includes('member');

    let response: string;

    if (isParticipantQuery && isCEF()) {
      // Request participants from the content browser and wait for response
      const participants = await new Promise<string[]>((resolve) => {
        const timeout = setTimeout(() => resolve([]), 2000); // Timeout after 2s

        setMeetingParticipantsCallback((result) => {
          clearTimeout(timeout);
          setMeetingParticipants(result);
          resolve(result);
        });

        getMeetingParticipants();
      });

      if (participants.length > 0) {
        const participantList = participants
          .map((name, i) => `${i + 1}. ${name}`)
          .join('\n');

        response = `**Participants in this meeting (${participants.length}):**\n\n${participantList}`;
      } else {
        response = "I couldn't find any participants. This could mean:\n\n" +
                   "• The participant list isn't currently visible\n" +
                   "• The meeting platform's HTML structure has changed\n" +
                   "• You might need to open the participants panel first\n\n" +
                   "Try opening the participants list in your meeting and ask again.";
      }
    } else if (isMeetingQuery && meetingPageInfo) {
      // Provide meeting page info
      const title = meetingPageInfo.title || 'Unknown';
      const url = meetingPageInfo.url || 'Unknown';

      // Extract domain from URL
      let domain = 'Unknown';
      try {
        domain = new URL(url).hostname;
      } catch {}

      response = `You're currently in a meeting on **${title}**.\n\n` +
                 `**Platform:** ${domain}\n` +
                 `**URL:** ${url}\n\n` +
                 `Is there anything specific you'd like to know about this meeting?`;
    } else if (isMeetingQuery && !meetingPageInfo) {
      response = "I'm still loading the meeting information. Please try again in a moment.";
    } else {
      // Get AI response for other queries
      response = await generateChatResponse(text, messages);
    }

    // Replace loading with actual response
    setMessages(prev => prev.map(msg =>
      msg.id === loadingId
        ? { ...msg, text: response, isLoading: false }
        : msg
    ));
    setIsAiTyping(false);
  };

  const handleEndMeeting = () => {
    if (meetingLeftRef.current) return;
    meetingLeftRef.current = true;

    // Leave the native meeting view first if in CEF
    if (isCEF()) {
      leaveMeeting();
    }

    meetingService.endMeeting(currentMeeting.id);
    onLeaveMeeting();
  };

  const getPlatformColor = () => {
    switch (currentMeeting.platform) {
      case 'zoom':
        return 'from-blue-500 to-blue-600';
      case 'google-meet':
        return 'from-green-500 to-green-600';
      case 'teams':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFBF7] overflow-hidden relative">
      {/* Hidden Canvas for Recording */}
      <canvas ref={canvasRef} style={{ position: 'absolute', top: -9999, left: -9999, visibility: 'hidden' }} />
      
      {/* Main Meeting Area */}
      <div className={`flex-1 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isAiOpen ? 'mr-96' : 'mr-0'}`}>
        {/* Meeting Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${getPlatformColor()} rounded-xl flex items-center justify-center`}>
                <Video size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{currentMeeting.title}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={14} />
                  <span>{elapsedTime}</span>
                  <span className="mx-2">•</span>
                  <span className="capitalize">{currentMeeting.platform.replace('-', ' ')}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Mic Toggle */}
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-3 rounded-xl transition-all ${isMicOn ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              {/* Camera Toggle */}
              <button
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={`p-3 rounded-xl transition-all ${isCameraOn ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
              >
                {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>

              <div className="w-px h-8 bg-gray-200 mx-1"></div>

              {/* Pause Button */}
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`p-3 rounded-xl transition-all flex items-center gap-2 ${isPaused ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                title={isPaused ? "Resume Meeting" : "Pause Meeting"}
              >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
              </button>

              {/* Record Button */}
              <button
                onClick={handleToggleRecording}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${isRecording ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {isRecording ? (
                  <>
                    <Square size={18} className="fill-current" />
                    <span className="font-medium">Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Circle size={18} className="fill-current" />
                    <span className="font-medium">Record</span>
                  </>
                )}
              </button>

              <div className="w-px h-8 bg-gray-200 mx-1"></div>


              {/* AI Toggle Button (only visible when closed, or always valid toggle) */}
               <button
                onClick={() => setIsAiOpen(!isAiOpen)}
                className={`p-3 rounded-xl transition-all ${isAiOpen ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                title={isAiOpen ? "Close AI Assistant" : "Open AI Assistant"}
              >
                <Sparkles size={20} />
              </button>

              <button
                onClick={handleEndMeeting}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <LogOut size={18} />
                <span className="font-medium">End</span>
              </button>
            </div>
          </div>
        </div>

        {/* Meeting Content Area - Native browser will be positioned here in CEF */}
        <div
          ref={contentAreaRef}
          className="flex-1 bg-gray-900 relative"
        >
          {!isCEF() && (
            /* Fallback iframe for non-CEF environments */
            <iframe
              src={currentMeeting.meetingUrl}
              className="w-full h-full"
              allow="camera; microphone; fullscreen; display-capture"
              title={currentMeeting.title}
            />
          )}
          {isCEF() && (
            /* Placeholder for native meeting view in CEF */
            <div className="w-full h-full flex items-center justify-center text-white text-sm">
              {/* The native meeting browser will appear here */}
            </div>
          )}
        </div>
      </div>

      {/* AI Chat Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-[#FDFBF7] shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-50 border-l border-gray-200 flex flex-col ${isAiOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-md flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-100">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Rebraze AI</h2>
              <p className="text-xs text-gray-500">Meeting Assistant</p>
            </div>
          </div>
          <button onClick={() => setIsAiOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {msg.sender === 'ai' && (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles size={10} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] p-3 text-sm leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-[#222] text-white rounded-2xl rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm'}`}
              >
                {msg.isLoading ? (
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
              {msg.sender === 'user' && (
                <div className="w-6 h-6 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden mt-1">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                    alt="User"
                    className="w-full h-full"
                  />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-3 bg-white border-t border-gray-200">
          <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask AI..."
              className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-20 min-h-[36px] py-1.5 px-2"
              disabled={isAiTyping}
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isAiTyping}
              className={`p-2 rounded-xl transition-all ${chatInput.trim() && !isAiTyping ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meeting;