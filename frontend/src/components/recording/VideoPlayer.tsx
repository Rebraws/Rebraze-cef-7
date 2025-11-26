import React, { useRef } from 'react';
import { Video } from 'lucide-react';
import { Meeting } from '../../types';

interface VideoPlayerProps {
  meeting: Meeting;
  isChatOpen: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ meeting, isChatOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div
      className={`flex-1 flex flex-col bg-gray-900 overflow-hidden transition-all duration-300 ${
        isChatOpen ? 'mr-0' : ''
      }`}
    >
      <div className="flex-1 flex items-center justify-center p-8">
        {meeting.recordingUrl ? (
          <video
            ref={videoRef}
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            controls
            autoPlay={false}
          >
            <source src={`file://${meeting.recordingUrl}`} type="video/webm" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="text-center text-white">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video size={40} className="text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No Recording Available</h3>
            <p className="text-gray-400 max-w-md">
              This meeting was not recorded or the recording is no longer available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
