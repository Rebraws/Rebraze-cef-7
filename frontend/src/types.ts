// FIX: Add React import to resolve 'React' namespace error.
import * as React from 'react';

export type ViewState = 'dashboard' | 'workspace';

// DEPRECATED: Replaced by the new hierarchical structure
export interface ProjectFile {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'txt' | 'image';
  size: string;
  uploadDate: string;
}

// --- New Hierarchical File System Types ---

export type FileSystemItem = FileItem | FolderItem;

export interface BaseItem {
  id: string;
  name: string;
  parentId: string | null;
}

export interface FileItem extends BaseItem {
  type: 'file';
  fileType: 'pdf' | 'video' | 'txt' | 'image';
  size: string;
  uploadDate: string;
}

export interface FolderItem extends BaseItem {
  type: 'folder';
  children: FileSystemItem[];
}


export interface Project {
  id: string;
  title: string;
  category: 'Research' | 'Development' | 'Design' | 'Marketing';
  lastEdited: string;
  fileCount: number;
  collaborators: number;
  gradient: string; 
  shadowColor: string;
  icon: React.ElementType;
  fileSystem: FolderItem; // Root of the project's file system
  borderColor: string;
}

export interface Folder {
  id: string;
  title: string;
  subtitle: string;
  items: number;
  size: string;
  gradient: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
}

// Meeting-related types
export interface Participant {
  id: string;
  name: string;
  email?: string;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  meetingUrl: string;
  platform: 'zoom' | 'google-meet' | 'teams' | 'other';
  startTime: Date;
  endTime?: Date;
  participants: Participant[];
  status: 'active' | 'ended';
  recordingUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
}

export type MeetingViewState = ViewState | 'meeting';