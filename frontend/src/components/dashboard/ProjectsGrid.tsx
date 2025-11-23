
import React, { useState, useRef, useEffect } from 'react';
import { Grid, List, Plus, MoreHorizontal, Clock, FileText, Pencil, Archive, Share2, Trash2 } from 'lucide-react';
import { Project } from '../../types';
import ProjectCard from './ProjectCard';

interface ProjectsGridProps {
  projects: Project[];
  onOpenProject: (project: Project) => void;
}

const ProjectListItem: React.FC<{ project: Project; onOpenProject: (project: Project) => void; }> = ({ project, onOpenProject }) => {
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
    
    return (
        <div onDoubleClick={() => onOpenProject(project)} className="group flex items-center w-full bg-white p-4 rounded-2xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.gradient} flex items-center justify-center text-white shadow-sm mr-4`}>
                <project.icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 truncate">{project.title}</h4>
                <p className="text-xs text-gray-500">{project.category}</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 font-medium ml-4 shrink-0">
                <span className="hidden md:flex items-center gap-1.5"><Clock size={14} /> {project.lastEdited}</span>
                <span className="hidden lg:flex items-center gap-1.5"><FileText size={14} /> {project.fileCount} files</span>
                <div className="hidden lg:flex -space-x-2 pl-1">
                    {[...Array(Math.min(3, project.collaborators))].map((_, i) => (
                        <div key={i} className="w-7 h-7 rounded-full ring-2 ring-white bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                            {String.fromCharCode(65 + i)}
                        </div>
                    ))}
                </div>
            </div>
            <div className="relative ml-6" ref={menuRef}>
                <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(!isMenuOpen); }}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-gray-600"
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
    );
}


const ProjectsGrid: React.FC<ProjectsGridProps> = ({ projects, onOpenProject }) => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  return (
    <section>
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-2xl font-bold text-gray-900 font-serif">All Projects</h2>
        <div className="flex bg-gray-100/50 p-1 rounded-xl">
          <button 
            onClick={() => setView('grid')} 
            className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Grid size={18} />
          </button>
          <button 
            onClick={() => setView('list')} 
            className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>
      
      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} onOpenProject={onOpenProject} />
          ))}
          <div className="border-2 border-dashed border-gray-200 rounded-[28px] flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:bg-blue-50/30 hover:text-blue-600 transition-all duration-300 cursor-pointer min-h-[260px] group">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm group-hover:bg-white">
              <Plus size={32} />
            </div>
            <span className="font-bold text-lg">Create New Project</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
            {projects.map(project => (
                <ProjectListItem key={project.id} project={project} onOpenProject={onOpenProject} />
            ))}
        </div>
      )}

    </section>
  );
};

export default ProjectsGrid;