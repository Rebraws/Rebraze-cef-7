
import React from 'react';
import { Project, FileItem } from '../../types';
import FileSidebar from './FileSidebar';
import MaximizedExplorer from './MaximizedExplorer';

export interface FileSystemExplorerProps {
  project: Project;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mode: 'sidebar' | 'maximized';
  setMode: React.Dispatch<React.SetStateAction<'sidebar' | 'maximized'>>;
  selectedFileIds: Set<string>;
  toggleFileSelection: (id: string, e?: React.MouseEvent) => void;
  viewingFile: FileItem | null;
  setViewingFile: (file: FileItem | null) => void;
  onMoveItem: (itemId: string, targetFolderId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onRenameItem: (itemId: string, newName: string) => void;
}

const FileSystemExplorer: React.FC<FileSystemExplorerProps> = (props) => {
  if (props.mode === 'maximized') {
    return <MaximizedExplorer {...props} />;
  }

  return <FileSidebar {...props} />;
};

export default FileSystemExplorer;
