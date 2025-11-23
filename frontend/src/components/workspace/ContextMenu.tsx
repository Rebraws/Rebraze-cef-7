import React, { useRef, useEffect } from 'react';
import { Pencil, Trash2, Share2, Download } from 'lucide-react';

export interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onRename, onDelete }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  }

  return (
    <div
      ref={menuRef}
      style={{ top: y, left: x }}
      className="absolute z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-in fade-in zoom-in-95"
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={() => handleAction(onRename)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Pencil size={16} /> Rename</button>
      <button className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Share2 size={16} /> Share</button>
      <button className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Download size={16} /> Download</button>
      <div className="h-px bg-gray-100 my-1"></div>
      <button onClick={() => handleAction(onDelete)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={16} /> Delete</button>
    </div>
  );
};

export default ContextMenu;
