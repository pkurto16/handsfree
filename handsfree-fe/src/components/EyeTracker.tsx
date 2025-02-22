'use client';

import { useEffect, useRef, useState } from 'react';
import { useHandsFree } from '@/contexts/HandsFreeContext';

declare global {
  interface Window {
    webgazer: any;
  }
}

export function EyeTracker() {
  const { config, isActive, calibrationStatus } = useHandsFree();
  const webgazerRef = useRef<any>(null);
  const [isWebgazerReady, setIsWebgazerReady] = useState(false);
  const gazeHistoryRef = useRef<Array<{ x: number; y: number }>>([]);

  // Handle body class updates
  useEffect(() => {
    const body = document.body;

    // Update classes based on state
    if (calibrationStatus === 'inProgress') {
      body.classList.add('calibrating');
      body.classList.remove('tracking-active');
    } else if (calibrationStatus === 'completed' && isActive) {
      body.classList.add('tracking-active');
      body.classList.remove('calibrating');
    } else {
      body.classList.remove('calibrating', 'tracking-active');
    }

    return () => {
      body.classList.remove('calibrating', 'tracking-active');
    };
  }, [calibrationStatus, isActive]);

  useEffect(() => {
    const loadWebgazer = async () => {
      try {
        // Load WebGazer script
        const script = document.createElement('script');
        script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
        script.async = true;

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        webgazerRef.current = window.webgazer;

        // Initialize with hidden UI elements
        await webgazerRef.current
          .setRegression('ridge')
          .setTracker('TFFacemesh')
          .saveDataAcrossSessions(true)
          .begin();

        // Initially hide all UI elements
        webgazerRef.current.showVideo(false);
        webgazerRef.current.showFaceOverlay(false);
        webgazerRef.current.showFaceFeedbackBox(false);
        webgazerRef.current.showPredictionPoints(false);

        // Set up gaze listener
        webgazerRef.current.setGazeListener((data: any, elapsedTime: number) => {
          if (!data || !isActive || calibrationStatus !== 'completed') return;

          // Smooth the gaze data
          gazeHistoryRef.current.push({ x: data.x, y: data.y });
          if (gazeHistoryRef.current.length > 5) {
            gazeHistoryRef.current.shift();
          }

          const smoothedX = Math.round(
            gazeHistoryRef.current.reduce((sum, point) => sum + point.x, 0) /
            gazeHistoryRef.current.length
          );
          const smoothedY = Math.round(
            gazeHistoryRef.current.reduce((sum, point) => sum + point.y, 0) /
            gazeHistoryRef.current.length
          );

          // Send to the API for mouse control
          fetch('/api/gaze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x: smoothedX, y: smoothedY })
          }).catch(err => console.error('Error sending gaze data:', err));
        });

        setIsWebgazerReady(true);

      } catch (error) {
        console.error('Error initializing WebGazer:', error);
      }
    };

    loadWebgazer();

    return () => {
      if (webgazerRef.current) {
        webgazerRef.current.end();
      }
    };
  }, []);

  // Update WebGazer UI based on calibration status
  useEffect(() => {
    if (!webgazerRef.current) return;

    if (calibrationStatus === 'inProgress') {
      // Show video and face overlay during calibration
      webgazerRef.current.showVideo(true);
      webgazerRef.current.showFaceOverlay(true);
      webgazerRef.current.showFaceFeedbackBox(true);
      webgazerRef.current.showPredictionPoints(false);
    } else if (calibrationStatus === 'completed') {
      // Hide everything except prediction points when completed
      webgazerRef.current.showVideo(false);
      webgazerRef.current.showFaceOverlay(false);
      webgazerRef.current.showFaceFeedbackBox(false);
      webgazerRef.current.showPredictionPoints(isActive);
    } else {
      // Hide everything initially
      webgazerRef.current.showVideo(false);
      webgazerRef.current.showFaceOverlay(false);
      webgazerRef.current.showFaceFeedbackBox(false);
      webgazerRef.current.showPredictionPoints(false);
    }
  }, [calibrationStatus, isActive]);

  return null;
}