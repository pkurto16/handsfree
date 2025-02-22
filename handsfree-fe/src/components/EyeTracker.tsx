// src/app/EyeTracker.tsx
import React, { useEffect, useRef } from 'react';
import { useHandsFree } from '@/contexts/HandsFreeContext';
import type { GazeData } from '@/types';

const KalmanFilter = {
  create: () => {
    let x = 0;
    let p = 1;
    const q = 0.1;
    const r = 1;
    return {
      filter: (measurement: number) => {
        const xPred = x;
        const pPred = p + q;
        const k = pPred / (pPred + r);
        x = xPred + k * (measurement - xPred);
        p = (1 - k) * pPred;
        return x;
      }
    };
  }
};

export function EyeTracker() {
  const { isActive, calibrationStatus, setCalibrationStatus } = useHandsFree();

  const webgazerRef = useRef<any>(null);
  const gazeHistoryRef = useRef<{ x: number; y: number }[]>([]);
  
  // Use an environment variable for the mouse server URL.
  const serverUrl = process.env.NEXT_PUBLIC_MOUSE_SERVER_URL || 'https://localhost:3001';

  useEffect(() => {
    console.log('EyeTracker mounted. Calibration status:', calibrationStatus);
    console.log('Is active:', isActive);

    const loadWebgazer = async () => {
      try {
        console.log('Loading WebGazer...');
        const script = document.createElement('script');
        script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
        script.async = true;

        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log('WebGazer script loaded');
            resolve(null);
          };
          script.onerror = (err) => {
            console.error('Failed to load WebGazer:', err);
            reject(err);
          };
          document.head.appendChild(script);
        });

        webgazerRef.current = window.webgazer;
        console.log('WebGazer object initialized:', !!webgazerRef.current);

        await webgazerRef.current
          .setRegression('ridge')
          .setTracker('TFFacemesh')
          .saveDataAcrossSessions(true)
          .setGazeListener((data: GazeData) => {
            console.log('Gaze data received:', data);
            if (!data) {
              console.log('Skipping gaze processing due to no data');
              return;
            }

            let { x, y } = data;
            console.log('Processing gaze coordinates:', { x, y });

            // Smooth coordinates using a window of up to 10 points.
            gazeHistoryRef.current.push({ x, y });
            if (gazeHistoryRef.current.length > 10) {
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

            console.log('Sending test request...');
            // Test request to verify connectivity with the mouse server.
            fetch(`${serverUrl}/test`)
              .then((res) => res.json())
              .then((data) => console.log('Test request succeeded:', data))
              .catch((err) => console.error('Test request failed:', err));

            console.log('Sending coordinates to mouse server:', { smoothedX, smoothedY });
            // Send coordinates to mouse control server.
            fetch(`${serverUrl}/move`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
              },
              mode: 'cors',
              credentials: 'include',
              body: JSON.stringify({ x: smoothedX, y: smoothedY })
            })
              .then((response) => {
                console.log('Mouse server response:', response.status);
                return response.json();
              })
              .then((data) => {
                console.log('Mouse server data:', data);
              })
              .catch((err) => {
                console.error('Error sending gaze data:', err);
              });
          })
          .begin();

        console.log('WebGazer initialization completed');
      } catch (error: any) {
        console.error('Error in loadWebgazer:', error);
        setCalibrationStatus('notStarted');
      }
    };

    loadWebgazer();

    return () => {
      console.log('EyeTracker cleanup');
      if (webgazerRef.current) {
        webgazerRef.current.end();
      }
    };
  }, []);

  useEffect(() => {
    console.log('Status changed:', { calibrationStatus, isActive });
    if (!webgazerRef.current) return;

    if (calibrationStatus === 'inProgress') {
      webgazerRef.current.showVideo(true);
      webgazerRef.current.showFaceOverlay(true);
      webgazerRef.current.showFaceFeedbackBox(true);
      // Always disable prediction points (red dot)
      webgazerRef.current.showPredictionPoints(false);
    } else if (calibrationStatus === 'completed') {
      webgazerRef.current.showVideo(false);
      webgazerRef.current.showFaceOverlay(false);
      webgazerRef.current.showFaceFeedbackBox(false);
      // Always disable prediction points (red dot)
      webgazerRef.current.showPredictionPoints(false);
    }
  }, [calibrationStatus, isActive]);

  return null;
}