
import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Clock, FileText, Pencil, Archive, Share2, Trash2 } from 'lucide-react';
import { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onOpenProject: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onOpenProject }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);
  
  // This is a trick to help Tailwind's purger find dynamically generated classes
  // border-indigo-200 border-teal-200 border-orange-200 border-rose-200

  return (
    <div 
      onDoubleClick={() => onOpenProject(project)}
      className="group relative bg-white rounded-[28px] p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full"
    >
      <div className={`absolute inset-0 rounded-[28px] shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] group-hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] border border-gray-100 group-hover:border-2 group-hover:border-${project.borderColor} transition-all duration-300 pointer-events-none`} />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${project.gradient} flex items-center justify-center text-white shadow-lg ${project.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
            <project.icon size={26} strokeWidth={2} />
          </div>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!isMenuOpen);
              }}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>
            {isMenuOpen && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-2 animate-in fade-in zoom-in-95"
              >
                <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Pencil size={16} /> Rename</a>
                <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Share2 size={16} /> Share</a>
                <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Archive size={16} /> Archive</a>
                <div className="h-px bg-gray-100 my-1"></div>
                <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={16} /> Delete Project</a>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-[19px] font-bold text-gray-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors font-sans">
            {project.title}
          </h3>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">
            {project.category}
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md"><Clock size={13} className="text-gray-400" />{project.lastEdited}</span>
            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md"><FileText size={13} className="text-gray-400" />{project.fileCount} files</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-6 mt-2 border-t border-dashed border-gray-100">
          <div className="flex -space-x-2 pl-1">
            {[...Array(Math.min(3, project.collaborators))].map((_, i) => (
              <div key={i} className="w-7 h-7 rounded-full ring-2 ring-white bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span className="text-sm font-semibold text-blue-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1">
            Open <span className="text-lg leading-none">→</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;