'use client';

import { useEffect } from 'react';

interface AdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  fullWidth?: boolean;
}

export default function GoogleAdSense({ 
  adSlot, 
  adFormat = 'auto',
  fullWidth = true 
}: AdSenseProps) {
  useEffect(() => {
    // This will load and render the ad when the component mounts
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.log('AdSense error:', err);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{
        display: 'block',
        minWidth: '200px',
      }}
      data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidth}
    />
  );
}
