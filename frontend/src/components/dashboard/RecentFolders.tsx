
import React from 'react';
import { MOCK_RECENT_FOLDERS } from '../../mocks/projects';
import FolderCard from './FolderCard';

const RecentFolders: React.FC = () => {
  return (
    <section>
       <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-xl font-bold text-gray-900 font-serif">Recent Folders</h2>
        <button className="text-sm font-semibold text-gray-400 hover:text-blue-600 transition-colors">View All</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_RECENT_FOLDERS.map(folder => (
          <FolderCard key={folder.id} folder={folder} />
        ))}
      </div>
    </section>
  );
};

export default RecentFolders;
