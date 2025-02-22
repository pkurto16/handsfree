export interface GazeData {
  x: number;
  y: number;
  timestamp: number;
}

export interface ScrollConfig {
  enabled: boolean;
  threshold: number;
  scrollSpeed: number;
}

export interface ClickConfig {
  enabled: boolean;
  dwellTime: number;
}

export interface HandsFreeConfig {
  scroll: ScrollConfig;
  click: ClickConfig;
  kalmanFilter: boolean;
}

export type CalibrationStatus = 'notStarted' | 'inProgress' | 'completed';