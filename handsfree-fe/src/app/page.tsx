'use client';

import { EyeTracker } from '@/components/EyeTracker';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { ConfigPanel } from '@/components/ui/ConfigPanel';
import { CalibrationPoints } from '@/components/ui/CalibrationPoints';
import { useHandsFree } from '@/contexts/HandsFreeContext';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { calibrationStatus, setCalibrationStatus } = useHandsFree();

  return (
    <main className="min-h-screen p-8 bg-background">
      <EyeTracker />
      <CalibrationPoints />

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">HandsFree Control</h1>
          <StatusIndicator />
        </div>

        <p className="text-lg text-muted-foreground">
          Control your computer using just your eyes. Press spacebar to toggle eye tracking.
        </p>

        {calibrationStatus === 'notStarted' && (
          <div className="flex flex-col items-center gap-4 p-8 border rounded-lg">
            <h2 className="text-2xl font-semibold">Start Calibration</h2>
            <p className="text-center text-muted-foreground">
              Before using HandsFree, we need to calibrate the eye tracker.
              This will take about 30 seconds.
            </p>
            <Button
              size="lg"
              onClick={() => setCalibrationStatus('inProgress')}
            >
              Start Calibration
            </Button>
          </div>
        )}

        {calibrationStatus === 'completed' && <ConfigPanel />}
      </div>
    </main>
  );
}