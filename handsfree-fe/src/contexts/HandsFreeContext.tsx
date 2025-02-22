'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { HandsFreeConfig, GazeData, CalibrationStatus } from '@/types';

interface HandsFreeContextType {
  config: HandsFreeConfig;
  updateConfig: (newConfig: Partial<HandsFreeConfig>) => void;
  isActive: boolean;
  toggleActive: () => void;
  lastGaze: GazeData | null;
  calibrationStatus: CalibrationStatus;
  setCalibrationStatus: (status: CalibrationStatus) => void;
}

const defaultConfig: HandsFreeConfig = {
  scroll: {
    enabled: true,
    threshold: 100,
    scrollSpeed: 1,
  },
  click: {
    enabled: true,
    dwellTime: 1000,
  },
  kalmanFilter: true,
};

const HandsFreeContext = createContext<HandsFreeContextType | undefined>(undefined);

export function HandsFreeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<HandsFreeConfig>(defaultConfig);
  const [isActive, setIsActive] = useState(false);
  const [lastGaze, setLastGaze] = useState<GazeData | null>(null);
  const [calibrationStatus, setCalibrationStatus] = useState<CalibrationStatus>('notStarted');

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' && calibrationStatus === 'completed') {
        setIsActive(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [calibrationStatus]);

  const updateConfig = (newConfig: Partial<HandsFreeConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const toggleActive = () => {
    if (calibrationStatus === 'completed') {
      setIsActive(prev => !prev);
    }
  };

  return (
    <HandsFreeContext.Provider
      value={{
        config,
        updateConfig,
        isActive,
        toggleActive,
        lastGaze,
        calibrationStatus,
        setCalibrationStatus
      }}
    >
      {children}
    </HandsFreeContext.Provider>
  );
}

export const useHandsFree = () => {
  const context = useContext(HandsFreeContext);
  if (context === undefined) {
    throw new Error('useHandsFree must be used within a HandsFreeProvider');
  }
  return context;
};