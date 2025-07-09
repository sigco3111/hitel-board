import React from 'react';

interface TrafficLightsProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

const TrafficLights: React.FC<TrafficLightsProps> = ({ onClose, onMinimize, onMaximize }) => {
  return (
    <div className="flex space-x-2">
      <button 
        aria-label="Close window"
        onClick={onClose} 
        className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/50">
      </button>
      <button 
        aria-label="Minimize window"
        onClick={onMinimize}
        className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500/50">
      </button>
      <button 
        aria-label="Maximize window"
        onClick={onMaximize}
        className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500/50">
      </button>
    </div>
  );
};

export default TrafficLights;
