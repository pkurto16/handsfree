'use client'

import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { useHandsFree } from "@/contexts/HandsFreeContext";

export function StatusIndicator() {
  const { isActive } = useHandsFree();

  return (
    <Badge variant={isActive ? "default" : "secondary"} className="flex items-center gap-2">
      <Eye className="w-4 h-4" />
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
