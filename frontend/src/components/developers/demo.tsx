import { CircularTestimonials } from '@/components/ui/circular-testimonials';
import vamshi from './pics/vamshi.png';
import hanuman from './pics/hanuman.jpeg';
import raman from './pics/raman.jpeg';
import mahesh from './pics/mahesh.jpeg';

const testimonials = [
  {
    quote:
      "I’m the creator behind Jenny, combining frontend and backend engineering with visual design and creativity to build immersive, human-centered digital experiences.",
    name: "Vamshi",
    designation: "Team Lead - Jenny",
    src: vamshi,
  },
  {
    quote:
      "Focused on building reliable backend systems, I design and manage APIs, data flow, and performance to ensure Jenny responds quickly and scales smoothly under real-world conditions.",
    name: "Hanuman",
    designation: "Technical Lead - Jenny",
    src: hanuman,
  },
  {
    quote:
      "A researcher behind Jenny AI, focused on studying panic situations and gathering data to improve AI-driven responses.",
    name: "Raman",
    designation: "AI Researcher - Jenny",
    src: raman,
  },
  {
    quote:
      "I support Jenny AI by coordinating efforts, conducting tests, and ensuring smooth system operations.",
    name: "Mahesh",
    designation: "Operations Lead - Jenny",
    src: mahesh,
  },
];

export const CircularTestimonialsDemo = () => (
  <section className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 md:px-8">
    {/* Light testimonials section on white background */}
    <div className="bg-slate-50/50 md:bg-slate-50 p-4 sm:p-10 md:p-20 rounded-[2rem] w-full max-w-6xl flex items-center justify-center relative overflow-hidden shadow-xl border border-slate-100">
      <div
        className="w-full max-w-7xl flex items-center justify-center relative"
      >
        <CircularTestimonials
          testimonials={testimonials}
          autoplay={false}
          colors={{
            name: "#0a0a0a",
            designation: "#454545",
            testimony: "#171717",
            arrowBackground: "#141414",
            arrowForeground: "#f1f1f7",
            arrowHoverBackground: "#00A6FB",
          }}
          fontSizes={{
            name: "clamp(14px, 3vw, 28px)",
            designation: "clamp(12px, 2vw, 20px)",
            quote: "clamp(12px, 2vw, 20px)",
          }}
        />
      </div>
    </div>
  </section>
);

export default CircularTestimonialsDemo;
