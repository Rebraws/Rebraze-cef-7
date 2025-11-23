import React, { useState } from 'react';
import { X, Video, Link as LinkIcon } from 'lucide-react';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinMeeting: (title: string, meetingUrl: string) => void;
}

const MeetingModal: React.FC<MeetingModalProps> = ({ isOpen, onClose, onJoinMeeting }) => {
  const [title, setTitle] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!title.trim()) {
      setError('Please enter a meeting title');
      return;
    }

    if (!meetingUrl.trim()) {
      setError('Please enter a meeting URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(meetingUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    // Call the join meeting callback
    onJoinMeeting(title.trim(), meetingUrl.trim());

    // Reset form
    setTitle('');
    setMeetingUrl('');
    setError('');
  };

  const handleClose = () => {
    setTitle('');
    setMeetingUrl('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Video size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Join Meeting</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Meeting Title */}
          <div>
            <label htmlFor="meeting-title" className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Title
            </label>
            <input
              id="meeting-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Team Standup"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Meeting URL */}
          <div>
            <label htmlFor="meeting-url" className="block text-sm font-medium text-gray-700 mb-2">
              Meeting URL
            </label>
            <div className="relative">
              <LinkIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="meeting-url"
                type="text"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Supports Zoom, Google Meet, Microsoft Teams, and other platforms
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-[0_4px_14px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] transition-all hover:-translate-y-0.5 active:translate-y-0 font-medium"
            >
              Join Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingModal;
