'use client';

import GoogleAdSense from '@/components/GoogleAdSense/GoogleAdSense';

interface AdSidebarProps {
  position: 'left' | 'right';
  adSlot?: string;
}

export default function AdSidebar({ position, adSlot }: AdSidebarProps) {
  const isLeft = position === 'left';

  return (
    <aside
      className={`
        hidden lg:flex flex-col
        w-[300px] bg-card-bg
        ${isLeft ? 'border-r' : 'border-l'} border-card-border
        p-4 sticky top-0 h-screen overflow-y-auto
        gap-4
      `}
    >
      {/* Ad Container */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-full min-h-[600px] bg-slate-800 rounded border border-card-border flex items-center justify-center">
          {adSlot ? (
            <GoogleAdSense
              adSlot={adSlot}
              adFormat="vertical"
              fullWidth={false}
            />
          ) : (
            <div className="text-text-secondary text-sm text-center p-4">
              Ad space - Add your adSlot to show ads
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
