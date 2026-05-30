# Google AdSense Setup Guide

## Step 1: Sign Up for Google AdSense

1. Go to [google.com/adsense](https://www.google.com/adsense)
2. Click "Sign Up" and follow the verification process
3. Once approved (can take 24-48 hours), you'll get your **Publisher ID** (looks like: `ca-pub-xxxxxxxxxxxxxxxx`)

## Step 2: Create Ad Units

1. In AdSense dashboard, go to **Ads → Ad units**
2. Create new ad units and note their **Ad slot numbers** (e.g., `1234567890`)
3. You can create multiple ad units for different placements

## Step 3: Add Environment Variables

Create a `.env.local` file in your project root:

```
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=your_publisher_id_here
```

Replace `your_publisher_id_here` with your actual Publisher ID (the part after `ca-pub-`).

Example:
```
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=xxxxxxxxxxxxxxxx
```

## Step 4: Add Ad Components

The ad components have been created in:
- `components/GoogleAdSense/GoogleAdSense.tsx` - For displaying individual ads
- `components/AdSenseScript/AdSenseScript.tsx` - Script loader

## Step 5: Add Ads to Pages

### For Sidebar Ads (Already set up in layout):
Ads will automatically load in the sidebar layout of your app.

### For Inline Ads (Custom placements):
```tsx
import GoogleAdSense from '@/components/GoogleAdSense/GoogleAdSense';

export default function MyPage() {
  return (
    <div>
      <h1>My Content</h1>
      <GoogleAdSense 
        adSlot="1234567890"
        adFormat="auto"
      />
    </div>
  );
}
```

## Supported Ad Formats

- `auto` - Responsive format (recommended)
- `rectangle` - 300x250px
- `vertical` - 120x600px or 160x600px
- `horizontal` - 728x90px or 970x90px

## Important Notes

- **Monetization Policy**: Ensure your site complies with Google AdSense policies
- **Environment Variable**: The app won't show ads if `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` is not set
- **Development**: Ads may show placeholder content in `localhost` - they work fully on production
- **Performance**: AdSense script is only loaded if the environment variable is set
- **Ad Blocking**: Users with ad blockers won't see ads

## Troubleshooting

If ads don't appear:
1. Verify your Publisher ID is correct (remove `ca-pub-` prefix in env var)
2. Ensure ad units are created in AdSense dashboard
3. Check browser console for errors
4. Wait 24-48 hours for AdSense approval
5. View on production domain (localhost may have limitations)

## Resources

- [Google AdSense Documentation](https://support.google.com/adsense)
- [Ad Formats Guide](https://support.google.com/adsense/answer/9274009)
- [Policies](https://support.google.com/adsense/answer/48182)
