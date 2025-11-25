
import React, { useState, MouseEvent, useMemo } from 'react';
import { Project, FileItem, ChatMessage, FileSystemItem, FolderItem } from '../types';
import WorkspaceHeader from '../components/workspace/WorkspaceHeader';
import FileSystemExplorer from '../components/workspace/FileSystemExplorer';
import FileViewer from '../components/workspace/FileViewer';
import ChatInterface from '../components/workspace/ChatInterface';
import { generateChatResponse } from '../services/geminiService';
import { 
  deepClone, 
  findParentAndItem, 
  findItemById, 
  removeItemFromTree, 
  updateItemInTree 
} from '../utils/fileSystemUtils';


// --- Component ---

interface WorkspaceProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updatedProject: Project) => void;
}

const Workspace: React.FC<WorkspaceProps> = ({
  project,
  onBack,
  onUpdateProject
}) => {
  const [isExplorerOpen, setExplorerOpen] = useState(true);
  const [explorerMode, setExplorerMode] = useState<'sidebar' | 'maximized'>('sidebar');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'ai', text: `Hello! I've loaded the context for ${project.title}. How can I help you today?`, timestamp: new Date() }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const allFiles = useMemo(() => {
    const files: FileItem[] = [];
    function traverse(folder: FolderItem) {
      folder.children.forEach(item => {
        if (item.type === 'file') files.push(item);
        else traverse(item);
      });
    }
    traverse(project.fileSystem);
    return files;
  }, [project.fileSystem]);

  // Auto-manage chat based on explorer mode
  React.useEffect(() => {
    if (explorerMode === 'maximized') {
      setIsChatOpen(false);
    } else if (explorerMode === 'sidebar' && viewingFile) {
      // When switching to sidebar mode with a file open, ensure chat is visible
      setIsChatOpen(true);
    }
  }, [explorerMode, viewingFile]);
  
  const toggleFileSelection = (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    const next = new Set(selectedFileIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFileIds(next);
  };

  const handleSend = async (input: string) => {
    if (!input.trim()) return;
    
    const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    
    // Add loading indicator
    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: loadingId, sender: 'ai', text: '...', timestamp: new Date(), isLoading: true }]);
    setIsAiTyping(true);

    const aiResponseText = await generateChatResponse(input, messages);

    // Replace loading indicator with actual response
    setMessages(prev => prev.map(msg => 
      msg.id === loadingId 
        ? { ...msg, text: aiResponseText, isLoading: false } 
        : msg
    ));
    setIsAiTyping(false);
  };

  // --- File System Mutation Handlers ---

  const handleMoveItem = (itemId: string, targetFolderId: string) => {
    if (itemId === targetFolderId) return;

    let newFileSystem = deepClone(project.fileSystem);
    
    const sourceInfo = findParentAndItem(newFileSystem, itemId);
    if (!sourceInfo) return;

    const targetFolder = findItemById(newFileSystem, targetFolderId);
    if (!targetFolder || targetFolder.type !== 'folder') return;
    
    // Prevent dragging a folder into itself
    if (sourceInfo.item.type === 'folder') {
        if(findItemById(sourceInfo.item, targetFolderId)) return;
    }

    sourceInfo.parent.children = sourceInfo.parent.children.filter(c => c.id !== itemId);
    sourceInfo.item.parentId = targetFolderId;
    targetFolder.children.push(sourceInfo.item);

    onUpdateProject({ ...project, fileSystem: newFileSystem });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
        return;
    }
    const newFileSystem = removeItemFromTree(deepClone(project.fileSystem), itemId);
    onUpdateProject({ ...project, fileSystem: newFileSystem });
  };
  
  const handleRenameItem = (itemId: string, newName: string) => {
    if (!newName.trim()) return;

    const itemToUpdate = findItemById(project.fileSystem, itemId);
    if (itemToUpdate && itemToUpdate.name !== newName) {
      const newFileSystem = updateItemInTree(deepClone(project.fileSystem), { id: itemId, name: newName });
      onUpdateProject({ ...project, fileSystem: newFileSystem });
    }
  };

  const handleSetExplorerMode = (mode: 'sidebar' | 'maximized') => {
    if (explorerMode === 'maximized' && mode === 'sidebar') {
       setExplorerOpen(false);
    }
    setExplorerMode(mode);
  };

  return (
    <div className="h-screen flex flex-col bg-[#FDFBF7]">
      <WorkspaceHeader
        project={project}
        onBack={onBack}
        isExplorerOpen={isExplorerOpen}
        setExplorerOpen={setExplorerOpen}
        explorerMode={explorerMode}
        setExplorerMode={handleSetExplorerMode}
        viewingFile={viewingFile}
        setViewingFile={setViewingFile}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {explorerMode === 'maximized' ? (
           <>
              <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isChatOpen ? 'mr-[420px]' : 'mr-0'}`}>
                 <FileSystemExplorer
                   project={project}
                   isOpen={true}
                   setIsOpen={setExplorerOpen}
                   mode="maximized"
                   setMode={handleSetExplorerMode}
                   selectedFileIds={selectedFileIds}
                   toggleFileSelection={toggleFileSelection}
                   viewingFile={viewingFile}
                   setViewingFile={setViewingFile}
                   onMoveItem={handleMoveItem}
                   onDeleteItem={handleDeleteItem}
                   onRenameItem={handleRenameItem}
                 />
              </div>
              {isChatOpen && (
                 <div className="fixed top-16 right-0 bottom-0 w-[420px] bg-[#FDFBF7] border-l border-gray-100 shadow-2xl z-30 animate-in slide-in-from-right duration-500">
                     <ChatInterface
                        messages={messages}
                        handleSend={handleSend}
                        selectedFileCount={selectedFileIds.size}
                        isAiTyping={isAiTyping}
                        onClose={() => setIsChatOpen(false)}
                     />
                 </div>
              )}
           </>
        ) : (
           <>
              <FileSystemExplorer
                project={project}
                isOpen={isExplorerOpen}
                setIsOpen={setExplorerOpen}
                mode="sidebar"
                setMode={handleSetExplorerMode}
                selectedFileIds={selectedFileIds}
                toggleFileSelection={toggleFileSelection}
                viewingFile={viewingFile}
                setViewingFile={setViewingFile}
                onMoveItem={handleMoveItem}
                onDeleteItem={handleDeleteItem}
                onRenameItem={handleRenameItem}
              />

              {(viewingFile || isChatOpen) && (
                <main className="flex-1 flex flex-col md:flex-row relative bg-[#FDFBF7] overflow-hidden">
                  {viewingFile && (
                    <FileViewer
                      viewingFile={viewingFile}
                      isChatOpen={isChatOpen}
                    />
                  )}
                  {isChatOpen && (
                     <div className={`border-l border-gray-200 bg-white h-full flex flex-col ${viewingFile ? 'w-full md:w-[400px]' : 'flex-1'}`}>
                        <ChatInterface
                          messages={messages}
                          handleSend={handleSend}
                          selectedFileCount={selectedFileIds.size}
                          isAiTyping={isAiTyping}
                          onClose={() => setIsChatOpen(false)}
                        />
                     </div>
                  )}
                </main>
              )}
           </>
        )}
      </div>
    </div>
  );
};

export default Workspace;
