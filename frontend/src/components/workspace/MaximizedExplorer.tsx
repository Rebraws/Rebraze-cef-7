
import React, { useState, useRef, useEffect, useMemo, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { 
  Folder as FolderIcon, ChevronRight, UploadCloud, FolderPlus, Grid, List,
  Minimize2, FolderSymlink, Star, Trash2, Plus, File
} from 'lucide-react';
import { FileSystemExplorerProps } from './FileSystemExplorer';
import ContextMenu from './ContextMenu';
import { FileSystemItem, FolderItem } from '../../types';
import { getFileIcon, getBreadcrumbPath, findItemById } from '../../utils/fileSystemUtils';

const MaximizedExplorer: React.FC<FileSystemExplorerProps> = (props) => {
  const { 
    project, setMode, setViewingFile, onMoveItem, onDeleteItem, onRenameItem, setIsOpen
  } = props;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [currentFolderId, setCurrentFolderId] = useState<string>(project.fileSystem.id);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileSystemItem } | null>(null);
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All Files');

  const currentFolder = useMemo(() => findItemById(project.fileSystem, currentFolderId) as FolderItem, [project.fileSystem, currentFolderId]);
  const breadcrumbs = useMemo(() => getBreadcrumbPath(project.fileSystem, currentFolderId), [project.fileSystem, currentFolderId]);
  
  // Get root folders for the sidebar
  const rootFolders = useMemo(() => {
      return project.fileSystem.children.filter(child => child.type === 'folder');
  }, [project.fileSystem]);

  const categories = [
    { id: 'All Files', icon: File, count: 0 }, // Count logic could be added
    { id: 'Favorites', icon: Star, count: 0 },
    { id: 'Trash', icon: Trash2, count: 0 },
  ];

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

  const handleItemDoubleClick = (item: FileSystemItem) => {
    if (item.type === 'folder') {
      setCurrentFolderId(item.id);
    } else {
      setViewingFile(item);
      setMode('sidebar');
      setIsOpen(false); // Collapse left panel when viewing file from maximized mode
    }
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: FileSystemItem) => {
    e.dataTransfer.setData('application/rebraze-item-id', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetItem: FileSystemItem | null) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedItemId = e.dataTransfer.getData('application/rebraze-item-id');
    const targetFolderId = targetItem?.type === 'folder' ? targetItem.id : targetItem?.parentId;
    
    if (draggedItemId && targetFolderId && draggedItemId !== targetFolderId) {
      onMoveItem(draggedItemId, targetFolderId);
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

  const ExplorerGridItem: React.FC<{ item: FileSystemItem }> = ({ item }) => (
    <div 
      onDoubleClick={() => handleItemDoubleClick(item)} 
      onContextMenu={(e) => handleContextMenu(e, item)}
      draggable="true"
      onDragStart={(e) => handleDragStart(e, item)}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if(item.type === 'folder') setDragOverId(item.id); }}
      onDrop={(e) => handleDrop(e, item)}
      onDragLeave={() => setDragOverId(null)}
      className={`group flex flex-col items-center text-center p-4 rounded-xl cursor-pointer transition-all duration-150 ${dragOverId === item.id ? 'bg-blue-100 ring-2 ring-blue-300' : 'hover:bg-gray-100'}`}
    >
      <div className="w-16 h-16 flex items-center justify-center mb-2">
        {item.type === 'folder' ? <FolderIcon size={48} className="text-blue-400 fill-blue-50" /> : getFileIcon(item.fileType, 48)}
      </div>
      <div className="text-sm font-medium text-gray-700 w-full px-2 truncate">
        <ItemName item={item} />
      </div>
      {item.type === 'file' && <p className="text-xs text-gray-400">{item.size}</p>}
    </div>
  );

  const ExplorerListItem: React.FC<{ item: FileSystemItem }> = ({ item }) => (
    <div 
      onDoubleClick={() => handleItemDoubleClick(item)} 
      onContextMenu={(e) => handleContextMenu(e, item)}
      draggable="true"
      onDragStart={(e) => handleDragStart(e, item)}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if(item.type === 'folder') setDragOverId(item.id); }}
      onDrop={(e) => handleDrop(e, item)}
      onDragLeave={() => setDragOverId(null)}
      className={`group flex items-center w-full px-4 py-2 rounded-lg cursor-pointer transition-all duration-150 ${dragOverId === item.id ? 'bg-blue-100 ring-2 ring-blue-300' : 'hover:bg-gray-100'}`}
    >
      <div className="w-8 h-8 flex items-center justify-center mr-3">
        {item.type === 'folder' ? <FolderIcon size={20} className="text-blue-500" /> : getFileIcon(item.fileType, 20)}
      </div>
      <div className="flex-1 text-sm font-medium text-gray-800 truncate pr-4 min-w-0">
         <ItemName item={item} />
      </div>
      {item.type === 'file' && <>
        <p className="text-sm text-gray-500 w-32 hidden md:block text-right">{item.uploadDate}</p>
        <p className="text-sm text-gray-500 w-24 hidden md:block text-right">{item.size}</p>
      </>}
    </div>
  );

  return (
    <div className="flex h-full bg-[#FDFBF7] animate-in fade-in duration-300" onClick={() => setContextMenu(null)} onDrop={(e) => handleDrop(e, currentFolder)} onDragOver={(e) => e.preventDefault()}>
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 p-4 flex flex-col" onContextMenu={(e) => e.preventDefault()}>
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-lg font-bold text-gray-900">Files</h2>
           <button onClick={() => setMode('sidebar')} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Collapse View">
             <Minimize2 size={18} />
           </button>
        </div>

        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 w-full bg-orange-500 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-sm mb-6">
           <Plus size={18} />
           <span>New File</span>
        </button>

        <div className="space-y-1 flex-1">
           {categories.map(cat => (
             <button
               key={cat.id}
               onClick={() => setActiveCategory(cat.id)}
               className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}
             >
               <div className="flex items-center gap-3">
                 <cat.icon size={18} className={activeCategory === cat.id ? 'text-orange-500' : 'text-gray-400'} />
                 <span>{cat.id}</span>
               </div>
               <span className="text-xs text-gray-400">{cat.count || ''}</span>
             </button>
           ))}
        </div>

        <div className="pt-4 border-t border-gray-200 mt-4">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Folders</h3>
           <div className="space-y-1">
              <button 
                 onClick={() => setCurrentFolderId(project.fileSystem.id)}
                 className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentFolderId === project.fileSystem.id ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                 <FolderIcon size={18} className="text-gray-400" />
                 <span>Root</span>
              </button>
              {rootFolders.map(folder => (
                  <button 
                     key={folder.id}
                     onClick={() => setCurrentFolderId(folder.id)}
                     className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentFolderId === folder.id ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                     <FolderIcon size={18} className="text-gray-400" />
                     <span>{folder.name}</span>
                  </button>
              ))}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#FDFBF7]" onContextMenu={(e) => e.preventDefault()}>
        <div className="p-3 flex items-center justify-between border-b border-gray-200 shrink-0 bg-[#FDFBF7]/80 backdrop-blur-sm">
            <div className="flex items-center gap-1 text-sm font-medium text-gray-500 truncate">
            {breadcrumbs.map((folder, index) => (
                <React.Fragment key={folder.id}>
                {index > 0 && <ChevronRight size={16} className="shrink-0" />}
                <button 
                    onDrop={(e) => handleDrop(e, folder)} 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverId(folder.id); }}
                    onDragLeave={() => setDragOverId(null)}
                    onClick={() => setCurrentFolderId(folder.id)} 
                    className={`px-2 py-1 rounded-md truncate ${index === breadcrumbs.length - 1 ? 'text-gray-800 font-semibold' : 'hover:bg-gray-100'} ${dragOverId === folder.id ? 'bg-blue-100' : ''}`}
                >
                    {folder.name}
                </button>
                </React.Fragment>
            ))}
            </div>
            <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"><UploadCloud size={18} /></button>
            <input type="file" ref={fileInputRef} className="hidden" multiple />
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"><FolderPlus size={18} /></button>
            <div className="h-5 w-px bg-gray-200 mx-1"></div>
            <div className="flex bg-gray-100/80 p-0.5 rounded-lg">
                <button onClick={() => setView('grid')} className={`p-1.5 rounded-md ${view === 'grid' ? 'bg-white shadow-sm' : ''}`}><Grid size={16} /></button>
                <button onClick={() => setView('list')} className={`p-1.5 rounded-md ${view === 'list' ? 'bg-white shadow-sm' : ''}`}><List size={16} /></button>
            </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
            {currentFolder.children.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FolderSymlink size={48} className="mb-4" />
                <h3 className="font-bold text-lg">This folder is empty</h3>
                <p className="text-sm">Drag and drop files here to get started.</p>
            </div>
            ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {currentFolder.children.sort((a,b) => a.type === 'folder' ? -1 : 1).map(item => <ExplorerGridItem key={item.id} item={item} />)}
            </div>
            ) : (
            <div className="flex flex-col gap-1">
                {currentFolder.children.sort((a,b) => a.type === 'folder' ? -1 : 1).map(item => <ExplorerListItem key={item.id} item={item} />)}
            </div>
            )}
        </div>
      </main>

      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y}
          onClose={() => setContextMenu(null)} 
          onRename={() => setRenamingItemId(contextMenu.item.id)}
          onDelete={() => onDeleteItem(contextMenu.item.id)}
        />
      )}
    </div>
  );
};

export default MaximizedExplorer;
