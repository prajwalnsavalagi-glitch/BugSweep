import React, { useEffect } from 'react';

// Replace this with your AdSense publisher ID (also update it in index.html)
const AD_CLIENT = 'ca-pub-0000000000000000';

export default function AdSlot({ slot = '', format = 'auto', className = '' }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdSense script not yet loaded
    }
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: 90 }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}