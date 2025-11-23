import React, { ReactNode } from 'react';
import { FileItem } from '../../types';
import { FileText, PlayCircle, Image as ImageIcon, FileCode } from 'lucide-react';

interface FileViewerProps {
  viewingFile: FileItem | null;
  isChatOpen: boolean;
}

const getFileIcon = (type: string): ReactNode => {
    switch(type) {
      case 'pdf': return <FileText size={48} className="text-red-500" />;
      case 'video': return <PlayCircle size={48} className="text-purple-500" />;
      case 'image': return <ImageIcon size={48} className="text-blue-500" />;
      default: return <FileCode size={48} className="text-gray-500" />;
    }
  };

const FileViewer: React.FC<FileViewerProps> = ({ viewingFile, isChatOpen }) => {
  return (
    <div className={`
      transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] flex flex-col border-r border-gray-200 bg-gray-100/80 backdrop-blur-md
      ${viewingFile ? `w-full ${isChatOpen ? 'md:w-1/2' : ''} opacity-100 translate-x-0` : 'w-0 opacity-0 -translate-x-10 border-none'}
    `}>
      {viewingFile && (
        <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="text-center space-y-6 relative z-10 max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto ring-4 ring-gray-50">
              {getFileIcon(viewingFile.fileType)}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">{viewingFile.name}</h3>
              <p className="text-sm text-gray-500">Preview not available in this demo.</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                Download
              </button>
              <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                Open Native
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileViewer;