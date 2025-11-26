// CEF Bridge utility for communication with the native app

export interface MeetingPageInfo {
  url: string;
  title: string;
}

declare global {
  interface Window {
    rebrazeAuth?: {
      openSystemBrowser: (url: string) => boolean;
      navigateToMeetingUrl: (url: string) => boolean;
      joinMeeting: (url: string, x: number, y: number, width: number, height: number) => boolean;
      leaveMeeting: () => boolean;
      updateMeetingBounds: (x: number, y: number, width: number, height: number) => boolean;
      getMeetingPageInfo: () => boolean;
      getMeetingParticipants: () => boolean;
      sendParticipantList: (jsonList: string) => boolean;
      startRecording: (meetingId: string) => boolean;
      stopRecording: () => boolean;
      saveRecording: (data: string, isLast: boolean) => boolean;
    };
    onAuthTokenReceived?: (token: string) => void;
    onMeetingPageInfo?: (info: MeetingPageInfo) => void;
    onMeetingParticipants?: (participants: string[]) => void;
    onScreencastFrame?: (data: string) => void;
    onRecordingSaved?: (meetingId: string, recordingPath: string) => void;
  }
}

export const isCEF = (): boolean => {
  return typeof window !== 'undefined' && typeof window.rebrazeAuth !== 'undefined';
};

export const openSystemBrowser = (url: string): boolean => {
  if (isCEF() && window.rebrazeAuth) {
    return window.rebrazeAuth.openSystemBrowser(url);
  }
  return false;
};

export const setAuthTokenCallback = (callback: (token: string) => void): void => {
  if (typeof window !== 'undefined') {
    window.onAuthTokenReceived = callback;
  }
};

export const navigateToMeetingUrl = (url: string): boolean => {
  if (isCEF() && window.rebrazeAuth) {
    return window.rebrazeAuth.navigateToMeetingUrl(url);
  }
  // If not in CEF, navigate using standard web navigation
  window.location.href = url;
  return true;
};

export const joinMeeting = (url: string, x: number, y: number, width: number, height: number): boolean => {
  if (isCEF() && window.rebrazeAuth) {
    console.log('[CEF Bridge] Joining meeting:', url, 'at', x, y, 'size', width, 'x', height);
    return window.rebrazeAuth.joinMeeting(url, x, y, width, height);
  }
  console.warn('[CEF Bridge] Not in CEF environment, cannot join meeting');
  return false;
};

export const leaveMeeting = (): boolean => {
  if (isCEF() && window.rebrazeAuth) {
    console.log('[CEF Bridge] Leaving meeting');
    return window.rebrazeAuth.leaveMeeting();
  }
  console.warn('[CEF Bridge] Not in CEF environment, cannot leave meeting');
  return false;
};

export const updateMeetingBounds = (x: number, y: number, width: number, height: number): boolean => {
  if (isCEF() && window.rebrazeAuth) {
    // console.log('[CEF Bridge] Updating meeting bounds:', x, y, width, 'x', height);
    return window.rebrazeAuth.updateMeetingBounds(x, y, width, height);
  }
  console.warn('[CEF Bridge] Not in CEF environment, cannot update meeting bounds');
  return false;
};

export const getMeetingPageInfo = (): boolean => {
  if (isCEF() && window.rebrazeAuth) {
    console.log('[CEF Bridge] Requesting meeting page info');
    return window.rebrazeAuth.getMeetingPageInfo();
  }
  console.warn('[CEF Bridge] Not in CEF environment, cannot get meeting page info');
  return false;
};

export const setMeetingPageInfoCallback = (callback: (info: MeetingPageInfo) => void): void => {
  if (typeof window !== 'undefined') {
    window.onMeetingPageInfo = callback;
  }
};

export const getMeetingParticipants = (): boolean => {
  if (isCEF() && window.rebrazeAuth) {
    console.log('[CEF Bridge] Requesting meeting participants');
    return window.rebrazeAuth.getMeetingParticipants();
  }
  console.warn('[CEF Bridge] Not in CEF environment, cannot get meeting participants');
  return false;
};

export const setMeetingParticipantsCallback = (callback: (participants: string[]) => void): void => {
  if (typeof window !== 'undefined') {
    window.onMeetingParticipants = callback;
  }
};

export const startRecording = (meetingId: string): boolean => {
  if (isCEF() && window.rebrazeAuth) {
    console.log('[CEF Bridge] Starting recording for meeting:', meetingId);
    return window.rebrazeAuth.startRecording(meetingId);
  }
  console.warn('[CEF Bridge] Not in CEF environment, cannot start recording');
  return false;
};

export const stopRecording = (): boolean => {
  if (isCEF() && window.rebrazeAuth) {
    console.log('[CEF Bridge] Stopping recording');
    return window.rebrazeAuth.stopRecording();
  }
  console.warn('[CEF Bridge] Not in CEF environment, cannot stop recording');
  return false;
};

export const saveRecording = (blob: Blob): void => {
  if (isCEF() && window.rebrazeAuth) {
    console.log('[CEF Bridge] Saving recording, size:', blob.size);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      const chunkSize = 1024 * 512; // 512KB chunks
      const totalChunks = Math.ceil(base64.length / chunkSize);
      
      for (let i = 0; i < totalChunks; i++) {
        const chunk = base64.slice(i * chunkSize, (i + 1) * chunkSize);
        const isLast = i === totalChunks - 1;
        window.rebrazeAuth!.saveRecording(chunk, isLast);
      }
    };
    reader.readAsDataURL(blob);
    return;
  }
  console.warn('[CEF Bridge] Not in CEF environment, cannot save recording');
  
  // Fallback for web dev: download the file
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recording.webm';
  a.click();
  URL.revokeObjectURL(url);
};

export const setScreencastFrameCallback = (callback: (data: string) => void): void => {
  if (typeof window !== 'undefined') {
    window.onScreencastFrame = callback;
  }
};

export const setRecordingSavedCallback = (callback: (meetingId: string, recordingPath: string) => void): void => {
  if (typeof window !== 'undefined') {
    window.onRecordingSaved = callback;
  }
};
