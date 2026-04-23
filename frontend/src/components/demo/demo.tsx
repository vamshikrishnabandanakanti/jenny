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
  title: 'See Jenny in Action',
  date: 'Multi-Agent Demo',
  scrollToExpand: 'Scroll to Explore System',
  about: {
    overview:
      'Watch how Jenny processes real-world panic situations using a multi-agent AI system. As soon as a scenario is detected, Jenny analyzes context, urgency, and constraints, then orchestrates multiple specialized agents — including safety, transport, communication, and resource management.',
    conclusion:
      'These agents work in parallel to generate actionable insights, which are then merged into a structured recovery plan. The output is optimized for clarity, speed, and real-world usability, helping users make better decisions under pressure.',
  },
};

const Content = () => {
  return (
    <div className='max-w-4xl mx-auto'>
      <h2 className='text-3xl font-bold mb-6 text-black'>
        See Jenny in Action
      </h2>
      <p className='text-lg mb-8 text-black/80'>
        {videoContent.about.overview}
      </p>
      <p className='text-lg mb-8 text-black/80'>
        {videoContent.about.conclusion}
      </p>
    </div>
  );
};

const Demo = () => {
  return (
    <div className='min-h-screen bg-white'>
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
