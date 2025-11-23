
import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Folder } from '../../types';

interface FolderCardProps {
  folder: Folder;
}

const FolderCard: React.FC<FolderCardProps> = ({ folder }) => {
  return (
    <div className={`group relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 bg-gradient-to-br ${folder.gradient} border border-white/50`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-700 shadow-sm group-hover:scale-110 transition-transform">
          <FolderOpen size={20} className="text-blue-500 fill-blue-100" />
        </div>
        <span className="text-[10px] font-semibold text-gray-500 bg-white/60 px-2 py-1 rounded-full backdrop-blur-sm">{folder.size}</span>
      </div>
      <div>
        <h4 className="font-bold text-gray-800 text-sm mb-0.5">{folder.title}</h4>
        <p className="text-xs text-gray-500">{folder.subtitle} • {folder.items} files</p>
      </div>
    </div>
  );
};

export default FolderCard;
