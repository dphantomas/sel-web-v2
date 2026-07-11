import React from "react";

interface ResponsiveMockupProps {
  children: React.ReactNode;
  device?: "mobile" | "tablet" | "desktop";
  className?: string;
}

export function ResponsiveMockup({ children, device = "desktop", className = "" }: ResponsiveMockupProps) {
  const aspectRatios = {
    desktop: "aspect-video max-w-5xl",
    tablet: "aspect-[3/4] max-w-2xl",
    mobile: "aspect-[9/16] max-w-sm",
  };

  return (
    <div className={`relative mx-auto w-full overflow-hidden rounded-xl border border-black/10 dark:border-white/10 shadow-2xl bg-background ${aspectRatios[device]} ${className}`}>
      {/* Mockup Top Bar */}
      {device === "desktop" && (
        <div className="flex h-10 w-full items-center gap-1.5 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>
      )}
      <div className="h-full w-full overflow-auto">
        {children}
      </div>
    </div>
  );
}
