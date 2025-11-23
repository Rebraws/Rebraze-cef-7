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
    };
    onAuthTokenReceived?: (token: string) => void;
    onMeetingPageInfo?: (info: MeetingPageInfo) => void;
    onMeetingParticipants?: (participants: string[]) => void;
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
