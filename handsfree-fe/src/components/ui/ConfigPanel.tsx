'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useHandsFree } from "@/contexts/HandsFreeContext";

export function ConfigPanel() {
  const { config, updateConfig } = useHandsFree();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>HandsFree Settings</CardTitle>
        <CardDescription>Configure your hands-free experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label>Scroll Control</label>
            <Switch
              checked={config.scroll.enabled}
              onCheckedChange={(checked) =>
                updateConfig({ scroll: { ...config.scroll, enabled: checked } })
              }
            />
          </div>

          <div className="space-y-2">
            <label>Scroll Speed</label>
            <Slider
              value={[config.scroll.scrollSpeed]}
              min={0.1}
              max={2}
              step={0.1}
              onValueChange={([value]) =>
                updateConfig({ scroll: { ...config.scroll, scrollSpeed: value } })
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label>Click Control</label>
            <Switch
              checked={config.click.enabled}
              onCheckedChange={(checked) =>
                updateConfig({ click: { ...config.click, enabled: checked } })
              }
            />
          </div>

          <div className="space-y-2">
            <label>Dwell Time (ms)</label>
            <Slider
              value={[config.click.dwellTime]}
              min={500}
              max={2000}
              step={100}
              onValueChange={([value]) =>
                updateConfig({ click: { ...config.click, dwellTime: value } })
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label>Kalman Filter</label>
          <Switch
            checked={config.kalmanFilter}
            onCheckedChange={(checked) =>
              updateConfig({ kalmanFilter: checked })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}