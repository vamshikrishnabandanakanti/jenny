import { AnimatedFeatureCard } from "@/components/ui/feature-card-1";

// Data for the feature cards
const features = [
  {
    index: "001",
    tag: "HEALTHIFY",
    title: "Eat better to boost your gut health by 30s.",
    imageSrc: "https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-79XLKwCuOZGHdVcOlEApISx6x2nVd2.png&w=1000&q=75",
    color: "orange" as const,
  },
  {
    index: "002",
    tag: "DETANE",
    title: "Avoid Chemicals to have a longer lifespan.",
    imageSrc: "https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-DtOMYxIaV2eptIhXTkorEzdNzhlgXK.png&w=1000&q=75",
    color: "purple" as const,
  },
  {
    index: "003",
    tag: "MEDITATE",
    title: "Quick Calm Sessions that unlock your potential.",
    imageSrc: "https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-eDCSln4vQRsBBiP3mWirJOXYDyFO6q.png&w=1000&q=75",
    color: "blue" as const,
  },
];

export default function FeatureCardDemo() {
  return (
    <div className="flex min-h-[calc(100vh-160px)] w-full items-center justify-center py-10 bg-black">
      <div className="container mx-auto grid max-w-6xl grid-cols-1 gap-12 p-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.index} className="flex justify-center">
            <AnimatedFeatureCard
              index={feature.index}
              tag={feature.tag}
              title={feature.title}
              imageSrc={feature.imageSrc}
              color={feature.color}
              className="w-full bg-neutral-900 border-white/5"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
