import { Meeting } from '../types';

export const mockMeetings: Meeting[] = [
  {
    id: 'm1',
    title: 'Weekly Design Sync',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    platform: 'google-meet',
    startTime: new Date('2023-10-25T10:00:00'),
    endTime: new Date('2023-10-25T11:00:00'),
    status: 'ended',
    duration: '1h 00m',
    recordingUrl: '/video/Whisk_ijzwijmwujmknwm40iyhrwytigm1qtl5ajmh1in.mp4', // Using the existing video file as a placeholder
    thumbnailUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
    participants: [
      { id: 'p1', name: 'Alice', joinedAt: new Date(), isActive: false },
      { id: 'p2', name: 'Bob', joinedAt: new Date(), isActive: false }
    ]
  },
  {
    id: 'm2',
    title: 'Project Alpha Kickoff',
    meetingUrl: 'https://zoom.us/j/123456789',
    platform: 'zoom',
    startTime: new Date('2023-10-24T14:00:00'),
    endTime: new Date('2023-10-24T15:30:00'),
    status: 'ended',
    duration: '1h 30m',
    recordingUrl: '/video/Whisk_ijzwijmwujmknwm40iyhrwytigm1qtl5ajmh1in.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80',
    participants: [
      { id: 'p3', name: 'Charlie', joinedAt: new Date(), isActive: false },
      { id: 'p4', name: 'Dave', joinedAt: new Date(), isActive: false }
    ]
  },
  {
    id: 'm3',
    title: 'Client Feedback Session',
    meetingUrl: 'https://teams.microsoft.com/l/meetup-join/19%3a...',
    platform: 'teams',
    startTime: new Date('2023-10-23T09:00:00'),
    endTime: new Date('2023-10-23T09:45:00'),
    status: 'ended',
    duration: '45m',
    recordingUrl: '/video/Whisk_ijzwijmwujmknwm40iyhrwytigm1qtl5ajmh1in.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
    participants: [
      { id: 'p5', name: 'Eve', joinedAt: new Date(), isActive: false }
    ]
  },
  {
    id: 'm4',
    title: 'Q3 Roadmap Review',
    meetingUrl: 'https://meet.google.com/xyz-abcd-efg',
    platform: 'google-meet',
    startTime: new Date('2023-10-20T13:00:00'),
    endTime: new Date('2023-10-20T14:30:00'),
    status: 'ended',
    duration: '1h 30m',
    recordingUrl: '/video/Whisk_ijzwijmwujmknwm40iyhrwytigm1qtl5ajmh1in.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80',
    participants: [
      { id: 'p1', name: 'Alice', joinedAt: new Date(), isActive: false },
      { id: 'p3', name: 'Charlie', joinedAt: new Date(), isActive: false }
    ]
  }
];
