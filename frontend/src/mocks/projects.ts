import { BrainCircuit, Zap, Leaf, Palette } from 'lucide-react';
import { Project, Folder, FolderItem } from '../types';

const MOCK_FILESYSTEM_1: FolderItem = {
  id: 'root-1',
  name: 'Quantum Computing',
  type: 'folder',
  parentId: null,
  children: [
    {
      id: 'folder-1-1',
      name: 'Research Papers',
      type: 'folder',
      parentId: 'root-1',
      children: [
        { id: 'f1-1', name: 'Entanglement_Theory.pdf', type: 'file', fileType: 'pdf', size: '3.1 MB', uploadDate: '1 day ago', parentId: 'folder-1-1' },
        { id: 'f1-2', name: 'Superposition_Principles.pdf', type: 'file', fileType: 'pdf', size: '1.9 MB', uploadDate: '2 days ago', parentId: 'folder-1-1' },
      ]
    },
    {
      id: 'folder-1-2',
      name: 'Simulations',
      type: 'folder',
      parentId: 'root-1',
      children: [
        { id: 'f1-3', name: 'Qubit_Simulation.mp4', type: 'file', fileType: 'video', size: '128 MB', uploadDate: '3 hrs ago', parentId: 'folder-1-2' },
      ]
    },
    { id: 'f1-4', name: 'Meeting_Notes.txt', type: 'file', fileType: 'txt', size: '15 KB', uploadDate: '1 hr ago', parentId: 'root-1' },
    { id: 'f1-5', name: 'Architecture_Diagram.png', type: 'file', fileType: 'image', size: '2.4 MB', uploadDate: '5 hrs ago', parentId: 'root-1' },
  ]
};

const MOCK_FILESYSTEM_2: FolderItem = {
  id: 'root-2',
  name: 'AI Ethics in Healthcare',
  type: 'folder',
  parentId: null,
  children: [
     { id: 'f2-1', name: 'Patient_Data_Privacy.pdf', type: 'file', fileType: 'pdf', size: '4.5 MB', uploadDate: '2 days ago', parentId: 'root-2' },
     { id: 'f2-2', name: 'Algorithmic_Bias_Report.pdf', type: 'file', fileType: 'pdf', size: '6.2 MB', uploadDate: '3 days ago', parentId: 'root-2' },
     { id: 'f2-3', name: 'Raw_Anonymized_Data.txt', type: 'file', fileType: 'txt', size: '5.8 MB', uploadDate: '4 days ago', parentId: 'root-2' },
  ]
};

const MOCK_FILESYSTEM_3: FolderItem = {
  id: 'root-3',
  name: 'Renewable Energy',
  type: 'folder',
  parentId: null,
  children: [
    { id: 'f3-1', name: 'Solar_Panel_Efficiency.pdf', type: 'file', fileType: 'pdf', size: '2.1 MB', uploadDate: '6 days ago', parentId: 'root-3' },
    { id: 'f3-2', name: 'Wind_Turbine_Footage.mp4', type: 'file', fileType: 'video', size: '256 MB', uploadDate: '1 week ago', parentId: 'root-3' },
  ]
};

const MOCK_FILESYSTEM_4: FolderItem = {
  id: 'root-4',
  name: 'Fintech App Redesign',
  type: 'folder',
  parentId: null,
  children: [
    {
      id: 'folder-4-1',
      name: 'UX Wireframes',
      type: 'folder',
      parentId: 'root-4',
      children: [
        { id: 'f4-1', name: 'Login_Flow.png', type: 'file', fileType: 'image', size: '800 KB', uploadDate: '5 hrs ago', parentId: 'folder-4-1' },
        { id: 'f4-2', name: 'Dashboard_v3.png', type: 'file', fileType: 'image', size: '1.2 MB', uploadDate: '6 hrs ago', parentId: 'folder-4-1' },
      ]
    },
    { id: 'f4-3', name: 'Design_System.pdf', type: 'file', fileType: 'pdf', size: '12.3 MB', uploadDate: '1 day ago', parentId: 'root-4' },
    { id: 'f4-4', name: 'User_Feedback.txt', type: 'file', fileType: 'txt', size: '22 KB', uploadDate: '2 days ago', parentId: 'root-4' },
  ]
};


export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Quantum Computing',
    category: 'Research',
    lastEdited: '1 day ago',
    fileCount: 5,
    collaborators: 3,
    gradient: 'from-blue-500 via-indigo-500 to-violet-600',
    shadowColor: 'shadow-indigo-200',
    icon: BrainCircuit,
    fileSystem: MOCK_FILESYSTEM_1,
    borderColor: 'indigo-200',
  },
  {
    id: '2',
    title: 'AI Ethics in Healthcare',
    category: 'Research',
    lastEdited: '2 days ago',
    fileCount: 3,
    collaborators: 5,
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    shadowColor: 'shadow-teal-200',
    icon: Zap,
    fileSystem: MOCK_FILESYSTEM_2,
    borderColor: 'teal-200',
  },
  {
    id: '3',
    title: 'Renewable Energy',
    category: 'Development',
    lastEdited: '2 days ago',
    fileCount: 2,
    collaborators: 9,
    gradient: 'from-orange-400 via-amber-500 to-yellow-500',
    shadowColor: 'shadow-orange-200',
    icon: Leaf,
    fileSystem: MOCK_FILESYSTEM_3,
    borderColor: 'orange-200',
  },
  {
    id: '4',
    title: 'Fintech App Redesign',
    category: 'Design',
    lastEdited: '5 hours ago',
    fileCount: 4,
    collaborators: 2,
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    shadowColor: 'shadow-rose-200',
    icon: Palette,
    fileSystem: MOCK_FILESYSTEM_4,
    borderColor: 'rose-200',
  }
];

export const MOCK_RECENT_FOLDERS: Folder[] = [
  { id: 'f1', title: 'Work Files', subtitle: 'Q4 Reports', items: 108, size: '1.2 GB', gradient: 'from-slate-100 to-slate-200' },
  { id: 'f2', title: 'Personal', subtitle: 'Research Data', items: 233, size: '4.5 GB', gradient: 'from-blue-50 to-indigo-50' },
  { id: 'f3', title: 'Client Docs', subtitle: 'Contracts', items: 28, size: '220 MB', gradient: 'from-orange-50 to-amber-50' },
];
