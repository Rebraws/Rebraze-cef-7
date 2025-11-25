import React, { useRef } from 'react';
import { Video } from 'lucide-react';
import { Meeting } from '../../types';

interface VideoPlayerProps {
  meeting: Meeting;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ meeting, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div
      className={`relative bg-gray-950 rounded-2xl overflow-hidden shadow-lg border border-gray-800 flex items-center justify-center group ${className}`}
    >
        {meeting.recordingUrl ? (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls
            autoPlay={false}
            playsInline
          >
            <source src={`file://${meeting.recordingUrl}`} type="video/webm" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="text-center text-white p-8">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-gray-700/50">
              <Video size={32} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-bold mb-1">No Recording</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Recording not available.
            </p>
          </div>
        )}
    </div>
  );
};

export default VideoPlayer;
