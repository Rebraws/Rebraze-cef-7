import { Meeting, Participant } from '../types';

class MeetingService {
  private readonly MEETINGS_KEY = 'rebraze_meetings';
  private readonly CURRENT_MEETING_KEY = 'rebraze_current_meeting';

  /**
   * Get all stored meetings
   */
  getAllMeetings(): Meeting[] {
    const meetingsJson = localStorage.getItem(this.MEETINGS_KEY);
    if (!meetingsJson) {
      return [];
    }

    try {
      const meetings = JSON.parse(meetingsJson);
      // Convert date strings back to Date objects
      return meetings.map((meeting: any) => ({
        ...meeting,
        startTime: new Date(meeting.startTime),
        endTime: meeting.endTime ? new Date(meeting.endTime) : undefined,
        participants: meeting.participants.map((p: any) => ({
          ...p,
          joinedAt: new Date(p.joinedAt),
          leftAt: p.leftAt ? new Date(p.leftAt) : undefined,
        })),
      }));
    } catch (error) {
      console.error('Failed to parse meetings from localStorage:', error);
      return [];
    }
  }

  /**
   * Get a meeting by ID
   */
  getMeetingById(id: string): Meeting | null {
    const meetings = this.getAllMeetings();
    return meetings.find(meeting => meeting.id === id) || null;
  }

  /**
   * Get the current active meeting
   */
  getCurrentMeeting(): Meeting | null {
    const currentMeetingId = localStorage.getItem(this.CURRENT_MEETING_KEY);
    if (!currentMeetingId) {
      return null;
    }
    return this.getMeetingById(currentMeetingId);
  }

  /**
   * Create and join a new meeting
   */
  createMeeting(title: string, meetingUrl: string): Meeting {
    // Detect platform from URL
    let platform: Meeting['platform'] = 'other';
    if (meetingUrl.includes('zoom.us')) {
      platform = 'zoom';
    } else if (meetingUrl.includes('meet.google.com')) {
      platform = 'google-meet';
    } else if (meetingUrl.includes('teams.microsoft.com')) {
      platform = 'teams';
    }

    const meeting: Meeting = {
      id: this.generateId(),
      title,
      meetingUrl,
      platform,
      startTime: new Date(),
      participants: [],
      status: 'active',
    };

    // Save the meeting
    const meetings = this.getAllMeetings();
    meetings.push(meeting);
    this.saveMeetings(meetings);

    // Set as current meeting
    localStorage.setItem(this.CURRENT_MEETING_KEY, meeting.id);

    return meeting;
  }

  /**
   * End a meeting
   */
  endMeeting(meetingId: string): void {
    const meetings = this.getAllMeetings();
    const meetingIndex = meetings.findIndex(m => m.id === meetingId);

    if (meetingIndex !== -1) {
      meetings[meetingIndex].status = 'ended';
      meetings[meetingIndex].endTime = new Date();

      // Calculate and store duration
      const diff = meetings[meetingIndex].endTime.getTime() - meetings[meetingIndex].startTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        meetings[meetingIndex].duration = `${hours}h ${minutes}m`;
      } else {
        meetings[meetingIndex].duration = `${minutes}m`;
      }

      // Mark all active participants as left
      meetings[meetingIndex].participants.forEach(participant => {
        if (participant.isActive) {
          participant.isActive = false;
          participant.leftAt = new Date();
        }
      });

      this.saveMeetings(meetings);

      // Clear current meeting if this was the current one
      const currentMeetingId = localStorage.getItem(this.CURRENT_MEETING_KEY);
      if (currentMeetingId === meetingId) {
        localStorage.removeItem(this.CURRENT_MEETING_KEY);
      }
    }
  }

  /**
   * Add a participant to a meeting
   */
  addParticipant(meetingId: string, name: string, email?: string): Participant {
    const participant: Participant = {
      id: this.generateId(),
      name,
      email,
      joinedAt: new Date(),
      isActive: true,
    };

    const meetings = this.getAllMeetings();
    const meetingIndex = meetings.findIndex(m => m.id === meetingId);

    if (meetingIndex !== -1) {
      meetings[meetingIndex].participants.push(participant);
      this.saveMeetings(meetings);
    }

    return participant;
  }

  /**
   * Remove a participant from a meeting
   */
  removeParticipant(meetingId: string, participantId: string): void {
    const meetings = this.getAllMeetings();
    const meetingIndex = meetings.findIndex(m => m.id === meetingId);

    if (meetingIndex !== -1) {
      const participantIndex = meetings[meetingIndex].participants.findIndex(
        p => p.id === participantId
      );

      if (participantIndex !== -1) {
        meetings[meetingIndex].participants[participantIndex].isActive = false;
        meetings[meetingIndex].participants[participantIndex].leftAt = new Date();
        this.saveMeetings(meetings);
      }
    }
  }

  /**
   * Update participant details
   */
  updateParticipant(
    meetingId: string,
    participantId: string,
    updates: Partial<Participant>
  ): void {
    const meetings = this.getAllMeetings();
    const meetingIndex = meetings.findIndex(m => m.id === meetingId);

    if (meetingIndex !== -1) {
      const participantIndex = meetings[meetingIndex].participants.findIndex(
        p => p.id === participantId
      );

      if (participantIndex !== -1) {
        meetings[meetingIndex].participants[participantIndex] = {
          ...meetings[meetingIndex].participants[participantIndex],
          ...updates,
        };
        this.saveMeetings(meetings);
      }
    }
  }

  /**
   * Get active participants for a meeting
   */
  getActiveParticipants(meetingId: string): Participant[] {
    const meeting = this.getMeetingById(meetingId);
    if (!meeting) {
      return [];
    }
    return meeting.participants.filter(p => p.isActive);
  }

  /**
   * Save recording URL to a meeting
   */
  saveRecordingUrl(meetingId: string, recordingUrl: string): void {
    const meetings = this.getAllMeetings();
    const meetingIndex = meetings.findIndex(m => m.id === meetingId);

    if (meetingIndex !== -1) {
      meetings[meetingIndex].recordingUrl = recordingUrl;
      this.saveMeetings(meetings);
      console.log('[MeetingService] Saved recording URL for meeting:', meetingId, recordingUrl);
    }
  }

  /**
   * Clear all meetings (for testing/debugging)
   */
  clearAllMeetings(): void {
    localStorage.removeItem(this.MEETINGS_KEY);
    localStorage.removeItem(this.CURRENT_MEETING_KEY);
  }

  /**
   * Save meetings to localStorage
   */
  private saveMeetings(meetings: Meeting[]): void {
    localStorage.setItem(this.MEETINGS_KEY, JSON.stringify(meetings));
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const meetingService = new MeetingService();
