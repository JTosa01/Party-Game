export default function AdSenseScript() {
  const adSenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;

  if (!adSenseId) {
    return null;
  }

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${adSenseId}`}
      crossOrigin="anonymous"
    />
  );
}