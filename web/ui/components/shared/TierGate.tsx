"use client";

import { Lock } from "lucide-react";
import { EmptyState } from "./EmptyState";

interface TierGateProps {
  requiredTier: number;
  currentTier: number;
  children: React.ReactNode;
}

export function TierGate({ requiredTier, currentTier, children }: TierGateProps) {
  if (currentTier >= requiredTier) {
    return <>{children}</>;
  }

  const tierNames = ["Discovery", "Standard", "Premium", "Enterprise"];
  const requiredName = tierNames[requiredTier - 1] || `Tier ${requiredTier}`;

  return (
    <EmptyState
      icon={Lock}
      title="Feature Locked"
      description={`This feature requires ${requiredName} tier. Your current tier: ${tierNames[currentTier - 1] || `Tier ${currentTier}`}`}
    />
  );
}
