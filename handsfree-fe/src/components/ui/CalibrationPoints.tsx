'use client';

import React, { useState, useEffect } from 'react';
import { useHandsFree } from '@/contexts/HandsFreeContext';
import { Target, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const CALIBRATION_POINTS = [
  { x: 10, y: 10 }, { x: 50, y: 10 }, { x: 90, y: 10 },
  { x: 10, y: 50 }, { x: 50, y: 50 }, { x: 90, y: 50 },
  { x: 10, y: 90 }, { x: 50, y: 90 }, { x: 90, y: 90 }
];

const CLICKS_PER_POINT = 5;

export function CalibrationPoints() {
  const { calibrationStatus, setCalibrationStatus } = useHandsFree();
  const [currentPoint, setCurrentPoint] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [isCalibrationComplete, setIsCalibrationComplete] = useState(false);

  // Set up WebGazer video position when calibration starts
  useEffect(() => {
    if (calibrationStatus === 'inProgress') {
      // Force the video container to center
      const videoContainer = document.getElementById('webgazerVideoContainer');
      if (videoContainer) {
        videoContainer.style.position = 'fixed';
        videoContainer.style.top = '50%';
        videoContainer.style.left = '50%';
        videoContainer.style.transform = 'translate(-50%, -50%)';
        videoContainer.style.zIndex = '1000';
      }
    }
  }, [calibrationStatus]);

  // Handle calibration completion
  useEffect(() => {
    if (isCalibrationComplete) {
      setCalibrationStatus('completed');
    }
  }, [isCalibrationComplete, setCalibrationStatus]);

  useEffect(() => {
    if (calibrationStatus === 'inProgress' && window.webgazer) {
      const handleClick = (e: MouseEvent) => {
        // Ensure WebGazer records the click for calibration
        window.webgazer.recordScreenPosition(e.clientX, e.clientY, 'click');

        // Update UI state
        setClickCount(prev => {
          const newCount = prev + 1;
          if (newCount >= CLICKS_PER_POINT) {
            setCurrentPoint(prevPoint => {
              if (prevPoint >= CALIBRATION_POINTS.length - 1) {
                setIsCalibrationComplete(true);
                return prevPoint;
              }
              setClickCount(0);
              return prevPoint + 1;
            });
            return 0;
          }
          return newCount;
        });

        setTotalClicks(prev => prev + 1);
      };

      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [calibrationStatus]);

  // Monitor WebGazer's prediction accuracy
  useEffect(() => {
    if (calibrationStatus === 'inProgress') {
      const checkAccuracy = setInterval(() => {
        if (window.webgazer) {
          window.webgazer.getTracker().getEyePatches((patches: any) => {
            if (patches) {
              const confidence = patches.confidence || 0;
              setAccuracy(confidence * 100);
            }
          });
        }
      }, 1000);

      return () => clearInterval(checkAccuracy);
    }
  }, [calibrationStatus]);

  if (calibrationStatus !== 'inProgress') return null;

  const point = CALIBRATION_POINTS[currentPoint];
  const progress = (totalClicks / (CALIBRATION_POINTS.length * CLICKS_PER_POINT)) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex flex-col items-center">
      {/* Brief instructions - Top */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 text-white text-center">
        <h2 className="text-2xl font-bold">Calibration in Progress</h2>
        <p className="text-sm mt-2">Look at and click each point {CLICKS_PER_POINT} times</p>
      </div>

      {/* Progress info - Bottom */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-white text-center max-w-xl bg-black/30 p-4 rounded-lg">
        <div className="space-y-2">
          <p className="text-sm">Progress: {Math.round(progress)}%</p>
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between text-sm mt-2">
            <span>Point {currentPoint + 1} of {CALIBRATION_POINTS.length}</span>
            <span>Clicks needed: {CLICKS_PER_POINT - clickCount}</span>
          </div>
          {accuracy > 0 && (
            <p className="text-sm">Tracking Accuracy: {Math.round(accuracy)}%</p>
          )}
        </div>
      </div>

      {/* Calibration point */}
      <div
        className="absolute"
        style={{
          left: `${point.x}%`,
          top: `${point.y}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <Target
          className="text-red-700 animate-pulse"
          size={32}
        />
      </div>

      {/* Cancel button */}
      <Button
        variant="destructive"
        className="fixed top-4 right-4"
        onClick={() => setCalibrationStatus('notStarted')}
      >
        <X className="mr-2" size={16} />
        Cancel Calibration
      </Button>
    </div>
  );
}