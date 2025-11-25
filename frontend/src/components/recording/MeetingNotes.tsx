import React from 'react';

const MeetingNotes: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 space-y-4 flex-1 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Meeting Notes</h1>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p className="text-gray-500 italic">Start typing your notes here...</p>
          
          {/* Placeholder Content for visual feedback */}
          <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
             <h3 className="font-bold text-yellow-800 mb-2">Key Takeaways</h3>
             <ul className="list-disc list-inside space-y-1 text-sm text-yellow-900">
                 <li>Discussed project timeline for Q4.</li>
                 <li>Agreed on the new API structure.</li>
                 <li>Action item: Sarah to send the design specs by Friday.</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingNotes;
