"use client";

import React, { useEffect, useState } from "react";

interface AestheticBackgroundProps {
  themeName: string;
}

// Using exceptionally sharp, high-focus 4K images to ensure maximum clarity (no camera blur/bokeh)
const THEME_BACKGROUNDS: Record<string, string> = {
  forestOak: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=3840&q=100",
  midnightLavender: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=3840&q=100",
  sweetSakura: "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=3840&q=100",
  princessLilac: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=3840&q=100",
  peachCream: "https://images.unsplash.com/photo-1515595967223-f9fa59af5a3b?auto=format&fit=crop&w=3840&q=100",
  inkMinimalist: "https://images.unsplash.com/photo-1501696461415-6bd6660c6742?auto=format&fit=crop&w=3840&q=100",
  gothicVelvet: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=3840&q=100",
  cozyBinder: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=3840&q=100",
};

export default function AestheticBackground({ themeName }: AestheticBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="fixed inset-0 bg-[#fdfbf7] z-[-1]" />;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden bg-[#1a1a1a]">
      {/* 
        We render ALL theme wallpapers stacked on top of each other. 
        This forces the browser to preload them in the background. 
        When the user clicks a theme, it instantly crossfades with zero delay!
      */}
      {Object.entries(THEME_BACKGROUNDS).map(([theme, url]) => (
        <img
          key={theme}
          src={url}
          alt={`${theme} Background`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
            themeName === theme ? "opacity-100" : "opacity-0"
          }`}
          // The active theme is prioritized, others load in background
          fetchPriority={themeName === theme ? "high" : "low"}
        />
      ))}
    </div>
  );
}
