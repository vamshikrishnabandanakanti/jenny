import { AnimatedFeatureCard } from "@/components/ui/feature-card-1";

import reactLogo from "./assets/react.png";
import telegramLogo from "./assets/telegram.png";
import whatsappLogo from "./assets/whatsapp.png";

// Data for the feature cards
const features = [
  {
    index: "001",
    tag: "WEB APP",
    title: "Access Jenny's multi-agent recovery system through any modern web browser.",
    imageSrc: reactLogo,
    color: "blue" as const,
  },
  {
    index: "002",
    tag: "TELEGRAM",
    title: "Connect with Jenny's panic agents directly for instant crisis support.",
    imageSrc: telegramLogo,
    color: "purple" as const,
  },
  {
    index: "003",
    tag: "WHATSAPP",
    title: "Receive emergency updates and actionable recovery plans via WhatsApp.",
    imageSrc: whatsappLogo,
    color: "orange" as const,
  },
];

export default function FeatureCardDemo() {
  return (
    <div className="flex min-h-[calc(100vh-160px)] w-full items-center justify-center py-10 bg-white">
      <div className="container mx-auto grid max-w-6xl grid-cols-1 gap-12 p-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.index} className="flex justify-center">
            <AnimatedFeatureCard
              index={feature.index}
              tag={feature.tag}
              title={feature.title}
              imageSrc={feature.imageSrc}
              color={feature.color}
              className="w-full bg-slate-50 border-black/5"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
