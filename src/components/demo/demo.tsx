'use client';

import ScrollExpandMedia from '@/components/blocks/scroll-expansion-hero';

interface MediaAbout {
  overview: string;
  conclusion: string;
}

interface MediaContent {
  src: string;
  poster?: string;
  background: string;
  title: string;
  date: string;
  scrollToExpand: string;
  about: MediaAbout;
}

const videoContent: MediaContent = {
  src: 'https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYuZ5R8ahEEZ4aQK56LizRdfBSqeDMsmUIrJN1',
  poster:
    'https://images.pexels.com/videos/5752729/space-earth-universe-cosmos-5752729.jpeg',
  background:
    'https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYMNjMlBUYHaeYpxduXPVNwf8mnFA61L7rkcoS',
  title: 'Immersive Video Experience',
  date: 'Cosmic Journey',
  scrollToExpand: 'Scroll to Expand Demo',
  about: {
    overview:
      'This is a demonstration of the ScrollExpandMedia component with a video. As you scroll, the video expands to fill more of the screen, creating an immersive experience. This component is perfect for showcasing video content in a modern, interactive way.',
    conclusion:
      'The ScrollExpandMedia component provides a unique way to engage users with your content through interactive scrolling.',
  },
};

const Content = () => {
  return (
    <div className='max-w-4xl mx-auto'>
      <h2 className='text-3xl font-bold mb-6 text-white'>
        About This Component
      </h2>
      <p className='text-lg mb-8 text-white/80'>
        {videoContent.about.overview}
      </p>
      <p className='text-lg mb-8 text-white/80'>
        {videoContent.about.conclusion}
      </p>
    </div>
  );
};

const Demo = () => {
  return (
    <div className='min-h-screen bg-black'>
      <ScrollExpandMedia
        mediaType="video"
        mediaSrc={videoContent.src}
        posterSrc={videoContent.poster}
        bgImageSrc={videoContent.background}
        title={videoContent.title}
        date={videoContent.date}
        scrollToExpand={videoContent.scrollToExpand}
      >
        <Content />
      </ScrollExpandMedia>
    </div>
  );
};

export default Demo;
