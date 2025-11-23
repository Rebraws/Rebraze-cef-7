
import React from 'react';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick 
}) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center px-6 py-2.5 rounded-2xl transition-all duration-300 group
      ${isActive 
        ? 'bg-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] text-blue-600 scale-105' 
        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
      }
    `}
  >
    <Icon 
      size={22} 
      strokeWidth={isActive ? 2.5 : 2}
      className="mb-1"
    />
    <span className={`text-[11px] font-medium tracking-wide ${isActive ? 'font-semibold' : ''}`}>
      {label}
    </span>
  </button>
);

export default NavItem;
