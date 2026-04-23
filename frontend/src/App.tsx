import { useState, useEffect, useRef } from "react"
import { IlluminatedHero } from "@/components/ui/illuminated-hero"
import Demo from "@/components/demo/demo"
import CircularTestimonialsDemo from "@/components/developers/demo"
import WorkflowDemo from "@/components/workflow/demo"
import FeatureCardDemo from "@/components/platforms/demo"
import { AnimatedAIChat } from "@/components/chat/animated-ai-chat"
import { DarkGradientBackground } from "@/components/chat/dark-gradient-background"
import { BB8Bot } from "@/components/ui/bb8-bot"
import { motion, AnimatePresence } from "framer-motion"

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isFullyUnlocked, setIsFullyUnlocked] = useState(false)
  const [showHome, setShowHome] = useState(true)
  const [activePage, setActivePage] = useState("home")
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)

  // Timeout refs to handle rapid clicking flawlessly
  const homeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isChatPage = typeof window !== 'undefined' && window.location.search.includes("page=chat");

  if (isChatPage) {
    return (
      <motion.main
        initial={{ opacity: 0, filter: "blur(10px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-screen relative bg-[#0A0A0B] text-white"
      >
        <DarkGradientBackground />
        <div className="relative z-10 h-full w-full pt-10">
          <AnimatedAIChat />
        </div>
      </motion.main>
    );
  }


  const allNavItems = [
    { id: "home", label: "Home" },
    { id: "demo", label: "Demo" },
    { id: "workflow", label: "Workflow" },
    { id: "developers", label: "Developers" },
    { id: "platforms", label: "Platforms" },
    { id: "chat", label: "Try out Jenny →" },
  ] as const

  const initialNavItems = [
    { id: "home", label: "Home" },
    { id: "demo", label: "Demo" },
    { id: "chat", label: "Try out Jenny →" },
  ] as const

  // Navbar items depend on whether we are currently on the Home page
  const navItems = activePage === "home" ? initialNavItems : allNavItems

  const scrollToSection = (id: string) => {
    isScrolling.current = true

    // Clear any pending timeouts to prevent rapid-click state corruption
    if (homeTimeoutRef.current) clearTimeout(homeTimeoutRef.current)
    if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current)
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)

    if (id === "home") {
      setShowHome(true)
      setActivePage("home")
      // Wait for slide down animation, then lock scroll
      homeTimeoutRef.current = setTimeout(() => {
        setIsUnlocked(false)
        setIsFullyUnlocked(false)
        const container = containerRef.current
        if (container) container.scrollTo(0, 0)
        isScrolling.current = false
      }, 1500)
      return
    }

    if (id === "demo" && !isUnlocked) {
      setIsUnlocked(true)
      setActivePage("demo")
      setShowHome(false)
      // Delay mounting heavy off-screen components until animation finishes
      demoTimeoutRef.current = setTimeout(() => {
        setIsFullyUnlocked(true)
        isScrolling.current = false
      }, 1500)
      return
    }

    // For other sections, ensure they are mounted immediately if clicked rapidly
    if (id !== "home" && id !== "demo") {
      setIsFullyUnlocked(true)
    }

    // Scroll mechanism with a small retry loop in case React is still mounting the element
    const attemptScroll = (retries = 0) => {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
        setActivePage(id)
        if (showHome) setShowHome(false)

        scrollTimeoutRef.current = setTimeout(() => {
          isScrolling.current = false
        }, 1000)
      } else if (retries < 10) {
        // Wait 50ms and try again to let React flush the DOM update
        scrollTimeoutRef.current = setTimeout(() => attemptScroll(retries + 1), 50)
      } else {
        isScrolling.current = false
      }
    }

    attemptScroll()
  }

  // Track active section for navbar indicator
  useEffect(() => {
    const container = containerRef.current
    if (!container || !isUnlocked || showHome) return

    const handleScroll = () => {
      if (isScrolling.current) return

      const sections = allNavItems.map(item => document.getElementById(item.id)).filter(Boolean)
      const scrollPosition = container.scrollTop + container.clientHeight / 2

      sections.forEach(section => {
        if (section && scrollPosition >= section.offsetTop && scrollPosition < section.offsetTop + section.offsetHeight) {
          if (activePage !== section.id) {
            setActivePage(section.id)
          }
        }
      })
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked, showHome, activePage])

  const springConfig = { type: "spring" as const, bounce: 0.15, duration: 0.8 };

  return (
    <div
      className={`relative h-screen w-full overflow-hidden transition-colors duration-700 ${['demo', 'workflow', 'developers', 'platforms'].includes(activePage) ? 'bg-white text-black' : 'bg-black text-white'
        }`}
    >
      {/* Premium Glassmorphism Navbar */}
      <nav className="fixed top-8 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
        <motion.div
          layout
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ layout: springConfig }}
          className="flex items-center gap-0.5 sm:gap-1 p-1 rounded-full border border-white/10 shadow-2xl backdrop-blur-xl bg-black/40 pointer-events-auto min-h-[44px] sm:min-h-[52px]"
        >
          <AnimatePresence mode="popLayout">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                layout
                initial={{ opacity: 0, filter: "blur(8px)", x: 20 }}
                animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
                exit={{ opacity: 0, filter: "blur(8px)", x: 20 }}
                transition={{ layout: springConfig, opacity: { duration: 0.5 }, filter: { duration: 0.5 }, x: { type: "spring", bounce: 0, duration: 0.7 } }}
                onClick={() => {
                  if (item.id === 'chat') {
                    window.open('/?page=chat', '_blank')
                  } else {
                    scrollToSection(item.id)
                  }
                }}
                className={`px-1 sm:px-4 py-1.5 sm:py-2 rounded-full text-[8px] min-[375px]:text-[10px] sm:text-sm font-medium transition-colors whitespace-nowrap ${activePage === item.id ? 'text-black' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                {activePage === item.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-full bg-white z-0"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 whitespace-nowrap">
                  {item.id === 'chat' ? (
                    <>
                      <span className="inline sm:hidden">Try Out Jenny →</span>
                      <span className="hidden sm:inline">Try out Jenny →</span>
                    </>
                  ) : item.id === 'developers' ? (
                    <>
                      <span className="inline sm:hidden">Devs</span>
                      <span className="hidden sm:inline">Developers</span>
                    </>
                  ) : item.id === 'platforms' ? (
                    <>
                      <span className="inline sm:hidden">Apps</span>
                      <span className="hidden sm:inline">Platforms</span>
                    </>
                  ) : item.label}
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </nav>


      {/* Home (Hero) Overlay - Slides up and down independently to avoid scroll jumping */}
      <motion.div
        initial={false}
        animate={{ y: showHome ? "0%" : "-100%" }}
        transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
        className="fixed inset-0 z-50 w-full h-screen bg-black"
      >
        <IlluminatedHero />
      </motion.div>

      {/* Main Content Areas */}
      <main
        ref={containerRef}
        className={`relative h-screen w-full overflow-x-hidden custom-scrollbar ${isUnlocked ? 'overflow-y-auto' : 'overflow-y-hidden'}`}
      >
        {/* Conditional Sections */}
        {isUnlocked && (
          <>
            {/* 1st: Demo Page (Now at the top of the scroll container) */}
            <section id="demo" className="w-full min-h-screen">
              <Demo />
            </section>

            {/* Delay heavy components until animation finishes */}
            {isFullyUnlocked && (
              <>
                {/* 2nd: Workflow Page */}
                <section id="workflow" className="w-full min-h-screen bg-white text-black flex items-center justify-center py-20 relative overflow-hidden">
                  {/* Subtle Grid Pattern for Canvas Feel */}
                  <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                    style={{
                      backgroundImage: `radial-gradient(#000 1px, transparent 1px), radial-gradient(#000 1px, transparent 1px)`,
                      backgroundSize: '40px 40px',
                      backgroundPosition: '0 0, 20px 20px'
                    }}
                  />
                  <div className="relative z-10 w-full flex items-center justify-center">
                    <WorkflowDemo />
                  </div>
                </section>

                {/* 3rd: Developers Page */}
                <section id="developers" className="w-full min-h-screen bg-white text-black flex items-center justify-center py-20">
                  <CircularTestimonialsDemo />
                </section>

                {/* 4th: Platforms Page */}
                <section id="platforms" className="w-full min-h-screen bg-white flex items-center justify-center py-20">
                  <FeatureCardDemo />
                </section>
              </>
            )}
          </>
        )}
      </main>

      <BB8Bot onClick={() => window.open('/?page=chat', '_blank')} />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

export default App
