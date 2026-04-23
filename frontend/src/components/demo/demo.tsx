'use client';

import ScrollExpandMedia from '@/components/blocks/scroll-expansion-hero';

import demoImage from './assets/demo.webp';

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
  src: 'https://res.cloudinary.com/douw67vte/video/upload/v1776967911/Screen_Recording_2026-04-23_at_11.40.22_PM_vvnksn.mov',
  poster:
    'https://images.pexels.com/videos/5752729/space-earth-universe-cosmos-5752729.jpeg',
  background: demoImage,
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
