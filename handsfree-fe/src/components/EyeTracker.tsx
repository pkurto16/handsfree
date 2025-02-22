'use client';

import { useEffect, useRef } from 'react';
import { useHandsFree } from '@/contexts/HandsFreeContext';

declare global {
  interface Window {
    webgazer: any;
  }
}

export function EyeTracker() {
  const { config, isActive, calibrationStatus } = useHandsFree();
  const webgazerRef = useRef<any>(null);
  const gazeHistoryRef = useRef<Array<{ x: number; y: number }>>([]);

  // Handle body class updates
  useEffect(() => {
    const body = document.body;
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

        // Initialize WebGazer with optimized settings
        await webgazerRef.current
          .setRegression('ridge')
          .setTracker('TFFacemesh')
          .saveDataAcrossSessions(true)
          .setGazeListener((data: any) => {
            if (!data) return;
            if (!isActive || calibrationStatus !== 'completed') return;

            // Add to gaze history for smoothing
            gazeHistoryRef.current.push({ x: data.x, y: data.y });
            if (gazeHistoryRef.current.length > 5) {
              gazeHistoryRef.current.shift();
            }

            // Calculate smoothed coordinates
            const smoothedX = Math.round(
              gazeHistoryRef.current.reduce((sum, point) => sum + point.x, 0) /
              gazeHistoryRef.current.length
            );
            const smoothedY = Math.round(
              gazeHistoryRef.current.reduce((sum, point) => sum + point.y, 0) /
              gazeHistoryRef.current.length
            );

            // Send coordinates to mouse control server
            fetch('http://localhost:3001/move', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                x: smoothedX,
                y: smoothedY
              })
            }).catch(err => console.error('Error sending gaze data:', err));

            // Update WebGazer prediction point
            if (webgazerRef.current.params.showPredictionPoints) {
              const predictionPoint = document.querySelector('.webgazerGazeDot');
              if (predictionPoint) {
                predictionPoint.style.left = `${smoothedX}px`;
                predictionPoint.style.top = `${smoothedY}px`;
              }
            }
          })
          .begin();

        // Initially hide WebGazer UI elements
        webgazerRef.current.showVideo(false);
        webgazerRef.current.showFaceOverlay(false);
        webgazerRef.current.showFaceFeedbackBox(false);
        webgazerRef.current.showPredictionPoints(false);

        // Set smaller video size
        webgazerRef.current.params.videoViewerWidth = 160;
        webgazerRef.current.params.videoViewerHeight = 120;

        console.log('WebGazer initialized successfully');

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
      webgazerRef.current.showVideo(true);
      webgazerRef.current.showFaceOverlay(true);
      webgazerRef.current.showFaceFeedbackBox(true);
      webgazerRef.current.showPredictionPoints(false);
    } else if (calibrationStatus === 'completed') {
      webgazerRef.current.showVideo(false);
      webgazerRef.current.showFaceOverlay(false);
      webgazerRef.current.showFaceFeedbackBox(false);
      webgazerRef.current.showPredictionPoints(isActive);
    } else {
      webgazerRef.current.showVideo(false);
      webgazerRef.current.showFaceOverlay(false);
      webgazerRef.current.showFaceFeedbackBox(false);
      webgazerRef.current.showPredictionPoints(false);
    }
  }, [calibrationStatus, isActive]);

  return null;
}