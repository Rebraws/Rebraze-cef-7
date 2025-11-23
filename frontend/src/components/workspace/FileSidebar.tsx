
import React, { useState, useRef, useEffect, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { 
  Folder as FolderIcon, ChevronRight, UploadCloud, CheckCircle2, Maximize2 
} from 'lucide-react';
import { FileSystemExplorerProps } from './FileSystemExplorer';
import ContextMenu from './ContextMenu';
import { FileSystemItem } from '../../types';
import { getFileIcon } from '../../utils/fileSystemUtils';

const FileSidebar: React.FC<FileSystemExplorerProps> = (props) => {
  const { 
    project, isOpen, setMode, selectedFileIds, 
    toggleFileSelection, viewingFile, setViewingFile,
    onMoveItem, onDeleteItem, onRenameItem
  } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([project.fileSystem.id]));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileSystemItem } | null>(null);
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    if (renamingItemId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingItemId]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClickOutside, { once: true });
    }
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

  const handleContextMenu = (e: MouseEvent, item: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleRename = () => {
    if (renamingItemId && renameInputRef.current) {
      onRenameItem(renamingItemId, renameInputRef.current.value);
    }
    setRenamingItemId(null);
  };

  const handleRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRename();
    if (e.key === 'Escape') setRenamingItemId(null);
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: FileSystemItem) => {
    e.dataTransfer.setData('application/rebraze-item-id', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetItem: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedItemId = e.dataTransfer.getData('application/rebraze-item-id');
    if (draggedItemId && targetItem.type === 'folder') {
        onMoveItem(draggedItemId, targetItem.id);
    }
    setDragOverId(null);
  };

  const ItemName = ({ item }: { item: FileSystemItem }) => (
    renamingItemId === item.id ? (
      <input
        ref={renameInputRef}
        defaultValue={item.name}
        onBlur={handleRename}
        onKeyDown={handleRenameKeyDown}
        onClick={e => e.stopPropagation()}
        className="text-sm font-medium w-full bg-white border border-blue-300 rounded px-1 -ml-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    ) : (
      <span className="text-sm font-medium truncate flex-1 min-w-0">{item.name}</span>
    )
  );

  const FileSystemNode: React.FC<{ item: FileSystemItem; depth: number; }> = ({ item, depth }) => {
    const isExpanded = item.type === 'folder' && expandedFolders.has(item.id);
    const isSelected = item.type === 'file' && selectedFileIds.has(item.id);
    const isViewing = item.type === 'file' && viewingFile?.id === item.id;
    
    return (
      <>
        <div
          onClick={() => item.type === 'folder' ? toggleFolder(item.id) : setViewingFile(isViewing ? null : item)}
          onContextMenu={(e) => handleContextMenu(e, item)}
          draggable="true"
          onDragStart={(e) => handleDragStart(e, item)}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if(item.type === 'folder') setDragOverId(item.id); }}
          onDrop={(e) => handleDrop(e, item)}
          onDragLeave={() => setDragOverId(null)}
          style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
          className={`group flex items-center gap-2.5 w-full py-2 pr-3 rounded-lg cursor-pointer transition-all duration-150 relative ${isViewing ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-100 text-gray-600'} ${dragOverId === item.id ? 'bg-blue-100 ring-1 ring-blue-300' : ''}`}
        >
          {item.type === 'folder' && <ChevronRight size={16} className={`shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`} />}
          <div className="w-4 shrink-0 flex items-center justify-center">
            {item.type === 'file' && (
              <div onClick={(e) => toggleFileSelection(item.id, e)} className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 z-10 ${isSelected ? 'bg-orange-500 border-orange-500 text-white scale-100' : 'border-gray-300 text-transparent group-hover:border-orange-400 scale-90 group-hover:scale-100 bg-white'}`}>
                <CheckCircle2 size={10} strokeWidth={3} fill="currentColor" className={isSelected ? 'text-white' : 'text-transparent'} />
              </div>
            )}
          </div>
          {item.type === 'folder' ? <FolderIcon size={16} className={`shrink-0 ${isExpanded ? 'text-blue-500' : 'text-gray-400'}`} /> : getFileIcon(item.fileType)}
          <ItemName item={item} />
        </div>
        {item.type === 'folder' && isExpanded && (
          <div className="animate-in fade-in duration-200">
            {item.children.sort((a,b) => a.type === 'folder' ? -1 : 1).map(child => <FileSystemNode key={child.id} item={child} depth={depth + 1} />)}
          </div>
        )}
      </>
    );
  };

  return (
    <aside 
      className={`bg-[#FAF9F6] border-r border-gray-200 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] z-10 ${isOpen ? 'w-80 translate-x-0 opacity-100' : 'w-0 -translate-x-10 opacity-0 overflow-hidden'}`}
      onClick={() => setContextMenu(null)}
    >
      <div className="p-5 pb-2">
        <button onClick={() => fileInputRef.current?.click()} className="w-full bg-[#222] text-white rounded-xl p-3.5 flex items-center justify-center gap-2.5 shadow-lg shadow-gray-200 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all duration-200 font-semibold text-sm">
          <UploadCloud size={18} />
          Add Source
        </button>
        <input type="file" ref={fileInputRef} className="hidden" multiple />
      </div>

      <div className="px-5 py-3 flex items-center justify-between">
         <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sources</h3>
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
               {selectedFileIds.size} active
            </span>
            <button onClick={() => setMode('maximized')} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md" title="Maximize View">
              <Maximize2 size={14} />
            </button>
         </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        <FileSystemNode item={project.fileSystem} depth={0} />
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50/50">
        <div className="flex items-center gap-3">
           <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
             <div className="h-full bg-orange-400 w-3/4 rounded-full"></div>
           </div>
           <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">75% Storage</span>
        </div>
      </div>
      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y}
          onClose={() => setContextMenu(null)} 
          onRename={() => setRenamingItemId(contextMenu.item.id)}
          onDelete={() => onDeleteItem(contextMenu.item.id)}
        />
      )}
    </aside>
  );
};

export default FileSidebar;
