import { CircularTestimonials } from '@/components/ui/circular-testimonials';
import vamshi from './pics/vamshi.png';
import hanuman from './pics/hanuman.jpeg';
import raman from './pics/raman.jpeg';
import mahesh from './pics/mahesh.jpeg';

const testimonials = [
  {
    quote:
      "Passionate about building intuitive and scalable AI-driven experiences. Focused on frontend performance and cinematic user interfaces.",
    name: "Vamshi",
    designation: "Software Engineer",
    src: vamshi,
  },
  {
    quote:
      "Expert in backend orchestration and multi-agent systems. Ensuring Jenny handles complex panic recovery scenarios with 100% reliability.",
    name: "Hanuman",
    designation: "Software Engineer",
    src: hanuman,
  },
  {
    quote:
      "Dedicated to architecting robust recovery systems and real-time response optimizations for critical user safety.",
    name: "Raman",
    designation: "Software Engineer",
    src: raman,
  },
  {
    quote:
      "Specialized in deep system integration and ensuring seamless communication between specialized AI agents.",
    name: "Mahesh",
    designation: "Software Engineer",
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
