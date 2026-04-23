"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface Testimonial {
  quote: string;
  name: string;
  designation: string;
  src: string;
}
interface Colors {
  name?: string;
  designation?: string;
  testimony?: string;
  arrowBackground?: string;
  arrowForeground?: string;
  arrowHoverBackground?: string;
}
interface FontSizes {
  name?: string;
  designation?: string;
  quote?: string;
}
interface CircularTestimonialsProps {
  testimonials: Testimonial[];
  autoplay?: boolean;
  colors?: Colors;
  fontSizes?: FontSizes;
}

function calculateGap(width: number) {
  // Responsive gap for very small mobile containers
  if (width < 300) return width * 0.15; 
  if (width < 640) return width * 0.1;
  
  const minWidth = 1024;
  const maxWidth = 1456;
  const minGap = 60;
  const maxGap = 86;
  if (width <= minWidth) return minGap;
  if (width >= maxWidth)
    return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));
  return minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth));
}

export const CircularTestimonials = ({
  testimonials,
  autoplay = true,
  colors = {},
  fontSizes = {},
}: CircularTestimonialsProps) => {
  // Color & font config
  const colorName = colors.name ?? "#000";
  const colorDesignation = colors.designation ?? "#6b7280";
  const colorTestimony = colors.testimony ?? "#4b5563";
  const colorArrowBg = colors.arrowBackground ?? "#141414";
  const colorArrowFg = colors.arrowForeground ?? "#f1f1f7";
  const colorArrowHoverBg = colors.arrowHoverBackground ?? "#00a6fb";
  const fontSizeName = fontSizes.name ?? "1.5rem";
  const fontSizeDesignation = fontSizes.designation ?? "0.925rem";
  const fontSizeQuote = fontSizes.quote ?? "1.125rem";

  // State
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const autoplayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const testimonialsLength = useMemo(() => testimonials.length, [testimonials]);
  const activeTestimonial = useMemo(
    () => testimonials[activeIndex],
    [activeIndex, testimonials]
  );

  // Responsive gap calculation
  useEffect(() => {
    function handleResize() {
      if (imageContainerRef.current) {
        setContainerWidth(imageContainerRef.current.offsetWidth);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Autoplay
  useEffect(() => {
    if (autoplay) {
      autoplayIntervalRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % testimonialsLength);
      }, 5000);
    }
    return () => {
      if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
    };
  }, [autoplay, testimonialsLength]);

  // Navigation handlers
  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonialsLength);
    if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonialsLength) % testimonialsLength);
    if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, testimonialsLength]);

  // Compute transforms for each image (always show 3: left, center, right)
  function getImageStyle(index: number): React.CSSProperties {
    const isActive = index === activeIndex;
    
    // Calculate relative position in the circular array
    let distance = (index - activeIndex + testimonialsLength) % testimonialsLength;
    // We want to show a few items behind the active one
    // Let's say we show up to 3 items in the stack
    
    if (isActive) {
      return {
        zIndex: 20,
        opacity: 1,
        pointerEvents: "auto",
        transform: `translateX(0) translateY(0) scale(1) rotate(0deg)`,
        filter: "blur(0px)",
        transition: "all 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
      };
    }

    // Items in the "back stack" (we'll treat 1, 2, 3 items before as the stack)
    // To get items "before", we look at large distance values (e.g., length-1, length-2)
    const stackPos = testimonialsLength - distance;
    
    if (stackPos >= 1 && stackPos <= 3) {
      return {
        zIndex: 20 - stackPos,
        opacity: Math.max(0.1, 0.7 - stackPos * 0.2),
        filter: `blur(${stackPos * 1.5}px)`,
        // Offset each layer slightly to the top-left to create depth
        transform: `translateX(-${stackPos * 25}px) translateY(-${stackPos * 25}px) rotate(-${stackPos * 2}deg) scale(${1 - stackPos * 0.04})`,
        transition: "all 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: "none",
      };
    }

    // Default: Hidden
    return {
      zIndex: 1,
      opacity: 0,
      filter: "blur(10px)",
      transform: `translateX(50px) translateY(50px) scale(0.8)`,
      transition: "all 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
      pointerEvents: "none",
    };
  }

  // Framer Motion variants for quote
  const quoteVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="testimonial-container w-full max-w-4xl p-2 sm:p-8">
      <div className="testimonial-grid grid gap-4 sm:gap-10 md:gap-20 grid-cols-[40%_1fr] md:grid-cols-2 items-center">
        {/* Images */}
        <div className="image-container relative w-full h-32 sm:h-64 md:h-96 perspective-[1000px]" ref={imageContainerRef}>
          {testimonials.map((testimonial, index) => (
            <img
              key={testimonial.src}
              src={testimonial.src}
              alt={testimonial.name}
              className="testimonial-image absolute w-full h-full object-cover rounded-[1.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
              data-index={index}
              style={getImageStyle(index)}
            />
          ))}
        </div>
        {/* Content */}
        <div className="testimonial-content flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              variants={quoteVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h3
                className="name font-bold mb-1"
                style={{ color: colorName, fontSize: fontSizeName }}
              >
                {activeTestimonial.name}
              </h3>
              <p
                className="designation mb-2 sm:mb-8"
                style={{ color: colorDesignation, fontSize: fontSizeDesignation }}
              >
                {activeTestimonial.designation}
              </p>
              <motion.p
                className="quote leading-relaxed"
                style={{ color: colorTestimony, fontSize: fontSizeQuote }}
              >
                {activeTestimonial.quote.split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{
                      filter: "blur(10px)",
                      opacity: 0,
                      y: 5,
                    }}
                    animate={{
                      filter: "blur(0px)",
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.22,
                      ease: "easeInOut",
                      delay: 0.025 * i,
                    }}
                    style={{ display: "inline-block" }}
                  >
                    {word}&nbsp;
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>
          </AnimatePresence>
          <div className="arrow-buttons flex justify-start gap-3 sm:gap-6 pt-10 sm:pt-16">
            <button
              className="arrow-button w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors border-none"
              onClick={handlePrev}
              style={{
                backgroundColor: hoverPrev ? colorArrowHoverBg : colorArrowBg,
              }}
              onMouseEnter={() => setHoverPrev(true)}
              onMouseLeave={() => setHoverPrev(false)}
              aria-label="Previous testimonial"
            >
              <FaArrowLeft size={24} color={colorArrowFg} />
            </button>
            <button
              className="arrow-button w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors border-none"
              onClick={handleNext}
              style={{
                backgroundColor: hoverNext ? colorArrowHoverBg : colorArrowBg,
              }}
              onMouseEnter={() => setHoverNext(true)}
              onMouseLeave={() => setHoverNext(false)}
              aria-label="Next testimonial"
            >
              <FaArrowRight size={24} color={colorArrowFg} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircularTestimonials;
