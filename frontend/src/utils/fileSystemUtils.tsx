
import React, { ReactNode } from 'react';
import { FileText, PlayCircle, Image as ImageIcon, FileCode } from 'lucide-react';
import { FolderItem, FileSystemItem } from '../types';

// --- UI Helpers ---

// FIX: The original function was causing multiple errors due to incorrect prop handling and undefined variables.
// It has been rewritten to be explicit about the `size` prop and to correctly construct the className string.
export const getFileIcon = (type: string, size: number = 16): ReactNode => {
  const baseClassName = "shrink-0";
  switch (type) {
    case 'pdf': return <FileText size={size} className={`${baseClassName} text-red-500`} />;
    case 'video': return <PlayCircle size={size} className={`${baseClassName} text-purple-500`} />;
    case 'image': return <ImageIcon size={size} className={`${baseClassName} text-blue-500`} />;
    default: return <FileCode size={size} className={`${baseClassName} text-gray-500`} />;
  }
};

// --- File System Traversal & Mutation ---

export const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const findItemById = (root: FolderItem, id: string): FileSystemItem | null => {
  if (root.id === id) return root;
  for (const child of root.children) {
    if (child.id === id) return child;
    if (child.type === 'folder') {
      const found = findItemById(child, id);
      if (found) return found;
    }
  }
  return null;
};

export const findParentAndItem = (root: FolderItem, itemId: string): { parent: FolderItem, item: FileSystemItem } | null => {
    for (const child of root.children) {
        if (child.id === itemId) {
            return { parent: root, item: child };
        }
        if (child.type === 'folder') {
            const found = findParentAndItem(child, itemId);
            if (found) return found;
        }
    }
    return null;
};

export const removeItemFromTree = (root: FolderItem, itemId: string): FolderItem => {
    root.children = root.children.filter(child => {
        if (child.id === itemId) return false;
        if (child.type === 'folder') {
            removeItemFromTree(child, itemId);
        }
        return true;
    });
    return root;
};

// FIX: Destructure 'type' from updatedItem to prevent changing an item's type.
// This helps TypeScript correctly infer the return type of the map function for the discriminated union.
export const updateItemInTree = (root: FolderItem, updatedItem: Partial<FileSystemItem> & { id: string }): FolderItem => {
    root.children = root.children.map(child => {
        if (child.id === updatedItem.id) {
            const { type, ...rest } = updatedItem;
            return { ...child, ...rest };
        }
        if (child.type === 'folder') {
            return updateItemInTree(child, updatedItem);
        }
        return child;
    });
    return root;
};

export const getBreadcrumbPath = (root: FolderItem, id: string): FolderItem[] => {
  const path: FolderItem[] = [];
  function findPath(current: FolderItem): boolean {
    if (current.id === id) {
      path.unshift(current);
      return true;
    }
    for (const child of current.children) {
      if (child.type === 'folder' && findPath(child)) {
        path.unshift(current);
        return true;
      }
    }
    return false;
  }
  findPath(root);
  if (path.length === 0 && root.id === id) {
    return [root];
  }
  return path;
};
