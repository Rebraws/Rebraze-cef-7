import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Filter, Plus } from 'lucide-react';

const Toolbar: React.FC = () => {
  const [sortOption, setSortOption] = useState('Last Edited');
  const [isSortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sortMenuRef]);

  const handleNewProjectClick = () => {
    fileInputRef.current?.click();
  };

  const sortOptions = ["Last Edited", "Date Created", "Name"];

  return (
    <div className="bg-white p-2.5 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-100/50">
      <div className="flex-1 w-full flex items-center px-5 gap-4">
        <Search className="text-gray-400" size={22} />
        <input 
          type="text" 
          placeholder="Search for projects, documents, or folders..." 
          className="w-full py-3 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-[15px] font-medium"
        />
      </div>

      <div className="hidden md:block w-px h-8 bg-gray-100"></div>

      <div className="flex items-center gap-2 w-full md:w-auto pr-2">
        <div className="relative" ref={sortMenuRef}>
          <button 
            onClick={() => setSortMenuOpen(!isSortMenuOpen)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
          >
            <span className="text-gray-400 font-medium">Sort by:</span>
            <span>{sortOption}</span>
            <ChevronDown size={16} />
          </button>
          {isSortMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-2 animate-in fade-in zoom-in-95">
              {sortOptions.map(option => (
                <button 
                  key={option}
                  onClick={() => {
                    setSortOption(option);
                    setSortMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="p-2.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors">
          <Filter size={20} />
        </button>
        <input type="file" ref={fileInputRef} className="hidden" multiple />
        <button 
          onClick={handleNewProjectClick}
          className="flex items-center gap-2 bg-[#111] text-white px-6 py-3 rounded-xl hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ml-2"
        >
          <Plus size={18} />
          <span className="font-bold text-sm">New Project</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;