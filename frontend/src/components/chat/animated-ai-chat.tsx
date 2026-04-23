"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    ImageIcon,
    LayoutTemplate,
    Monitor,
    Paperclip,
    SendIcon,
    Sparkles,
    Command,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react"

// Simple markdown renderer for Jenny responses
function renderMarkdown(text: string): React.ReactNode {
    const lines = text.split('\n');
    return lines.map((line, i) => {
        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
        return <span key={i} className="block mb-1 last:mb-0">{parts}</span>;
    });
}

function TypewriterEffect({ text, onComplete }: { text: string; onComplete?: () => void }) {
    const [displayedText, setDisplayedText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, 15); // Fast typing speed
            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [currentIndex, text, onComplete]);

    return <>{renderMarkdown(displayedText)}</>;
}


interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    containerClassName?: string;
    showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, containerClassName, showRing = true, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);

        return (
            <div className={cn(
                "relative",
                containerClassName
            )}>
                <textarea
                    className={cn(
                        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                        "transition-all duration-200 ease-in-out",
                        "placeholder:text-muted-foreground",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
                        className
                    )}
                    ref={ref}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />

                {showRing && isFocused && (
                    <motion.span
                        className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-violet-500/30"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                )}
            </div>
        )
    }
)
Textarea.displayName = "Textarea"

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    steps?: string[];
    whatsappDraft?: string;
    rideEstimates?: {
        destination_name: string;
        drop_lat: number;
        drop_lng: number;
        distance_meters: number;
        walk: { time_mins: number; cost: number };
        bike: { time_mins: number; cost: number };
        cab: { time_mins: number; cost: number };
        bus: { time_mins: number; cost: number };
    };
    actionData?: any[];
    responseType?: string;
    timestamp: Date;
}

export function AnimatedAIChat() {
    const [value, setValue] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [interactionStep, setInteractionStep] = useState(1);

    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 52,
        maxHeight: 200,
    });
    const [inputFocused, setInputFocused] = useState(false);
    const commandPaletteRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const commandSuggestions: CommandSuggestion[] = [
        {
            icon: <ImageIcon className="w-4 h-4" />,
            label: "Clone UI",
            description: "Generate a UI from a screenshot",
            prefix: "/clone"
        },
        {
            icon: <LayoutTemplate className="w-4 h-4" />,
            label: "Import Figma",
            description: "Import a design from Figma",
            prefix: "/figma"
        },
        {
            icon: <Monitor className="w-4 h-4" />,
            label: "Create Page",
            description: "Generate a new web page",
            prefix: "/page"
        },
        {
            icon: <Sparkles className="w-4 h-4" />,
            label: "Improve",
            description: "Improve existing UI design",
            prefix: "/improve"
        },
    ];

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        if (value.startsWith('/') && !value.includes(' ')) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowCommandPalette(true);
            const matchingSuggestionIndex = commandSuggestions.findIndex(
                (cmd) => cmd.prefix.startsWith(value)
            );
            if (matchingSuggestionIndex >= 0) {
                setActiveSuggestion(matchingSuggestionIndex);
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSendMessage = async (overrideText?: string, skipLocation: boolean = false) => {
        const userInput = overrideText || value.trim();
        if (!userInput || isTyping) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: userInput,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, newUserMessage]);
        setValue("");
        adjustHeight(true);
        setIsTyping(true);

        try {
            let locationInfo = null;

            if (interactionStep >= 2 && !skipLocation) {
                if (!navigator.geolocation) {
                    alert("Geolocation not supported by your browser");
                } else {
                    try {
                        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, {
                                timeout: 10000,
                                maximumAge: 0,
                                enableHighAccuracy: true
                            });
                        });
                        locationInfo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        console.log("Location captured:", locationInfo);
                    } catch (e) {
                        console.warn("Location denied or failed:", e);
                        // Fallback location to India (Hyderabad) if it fails, so it doesn't break
                        locationInfo = { lat: 17.3850, lng: 78.4867 };
                    }
                }
            }

            console.log("Sending message:", userInput);
            console.log("Sending location:", locationInfo);

            const historyPayload = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));

            const { callJennyBackend } = await import("@/lib/jenny-api");
            const jennyData = await callJennyBackend(userInput, locationInfo || undefined, interactionStep, historyPayload);

            // If we got a calm text response at step 1, or the AI explicitly requests location, escalate to step 2
            if ((jennyData.type === "text_response" && interactionStep === 1) || jennyData.type === "request_location") {
                setInteractionStep(2);
            } else if (jennyData.type === "action_response") {
                // Keep at step 2 or reset if you want
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: jennyData.message || "I don't know what to say.",
                steps: jennyData.steps,
                whatsappDraft: jennyData.whatsapp_draft,
                rideEstimates: jennyData.ride_estimates,
                actionData: Array.isArray(jennyData.data) ? jennyData.data : (jennyData.data?.places || undefined),
                responseType: jennyData.type,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("[Chat] Backend error:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "I'm having trouble connecting to my brain right now. Please check your connection or try again in a moment.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev => prev < commandSuggestions.length - 1 ? prev + 1 : 0);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev => prev > 0 ? prev - 1 : commandSuggestions.length - 1);
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand = commandSuggestions[activeSuggestion];
                    setValue(selectedCommand.prefix + ' ');
                    setShowCommandPalette(false);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleLocationAction = (action: "allow" | "deny") => {
        if (action === "allow") {
            handleSendMessage("Yes, allow location.", false);
        } else {
            handleSendMessage("No, I cannot share my location right now.", true);
        }
    };

    const handleRideEstimate = (place: any) => {
        handleSendMessage(`I need travel estimates and a ride to ${place.name}. The coordinates are lat: ${place.lat}, lng: ${place.lng}, distance: ${place.distance}m.`, false);
    };

    const handleAttachFile = () => {
        // Attachment support coming soon
        console.log("[Chat] File attachment clicked — feature pending");
    };

    return (
        <div className="flex flex-col h-full w-full bg-transparent text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
            </div>

            {/* Chat Messages Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-8 space-y-6 scrollbar-hide">
                <div className="max-w-3xl mx-auto w-full space-y-8">
                    {messages.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-20 space-y-4"
                        >
                            <h1 className="text-4xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40">
                                Hey, I’m <span className="text-violet-400 font-bold drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]">Jenny</span>. What’s going on?
                            </h1>
                            <p className="text-white/40 text-sm">Tell me what’s happening. I’m here — we’ll take this step by step.</p>
                            <div className="mt-8 flex flex-col items-center gap-3">
                                <p className="text-xs font-semibold text-white/40 tracking-widest uppercase"></p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {[
                                        "I’m feeling anxious",
                                        "Emergency help",
                                        "Travel issue",
                                        "Lost something",
                                        "Just need to talk"
                                    ].map((action, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setValue(action);
                                                setTimeout(() => {
                                                    adjustHeight();
                                                    textareaRef.current?.focus();
                                                }, 0);
                                            }}
                                            className="px-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-full text-xs text-white/60 hover:bg-white/[0.08] hover:text-white transition-all hover:border-white/20"
                                        >
                                            {action}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <AnimatePresence mode="popLayout">
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className={cn(
                                    "flex flex-col space-y-2",
                                    message.role === "user" ? "items-end" : "items-start"
                                )}
                            >
                                <div className={cn(
                                    "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                                    message.role === "user"
                                        ? "bg-violet-500/20 border border-violet-500/20 text-white shadow-lg"
                                        : "bg-white/[0.03] border border-white/[0.05] text-white/90"
                                )}>
                                    {message.role === "assistant" ? (
                                        <TypewriterEffect text={message.content} />
                                    ) : (
                                        renderMarkdown(message.content)
                                    )}
                                    {/* Recovery Plan Steps */}
                                    {message.steps && message.steps.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4, duration: 0.4 }}
                                            className="mt-4 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl w-full"
                                        >
                                            <div className="text-violet-300 font-semibold text-[13px] mb-3 flex items-center gap-2">
                                                <span>📋</span> Recovery Plan
                                            </div>
                                            <div className="space-y-2">
                                                {message.steps.map((step, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.5 + i * 0.1 }}
                                                        className="flex items-start gap-3 text-[13px] text-white/80 leading-relaxed"
                                                    >
                                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center text-[11px] font-bold mt-0.5">
                                                            {i + 1}
                                                        </span>
                                                        <span>{step}</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                    {message.actionData && message.actionData.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5, duration: 0.4 }}
                                            className="mt-4 flex flex-col gap-3 w-full"
                                        >
                                            {/* MAP PREVIEW */}
                                            <div className="w-full h-[180px] rounded-xl overflow-hidden border border-white/10 mb-2 relative">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    style={{ border: 0 }}
                                                    loading="lazy"
                                                    allowFullScreen
                                                    src={`https://www.google.com/maps?q=${message.actionData[0].lat},${message.actionData[0].lng}+(${encodeURIComponent(message.actionData[0].name)})&output=embed&z=15`}
                                                />
                                                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-xl" />
                                            </div>

                                            {message.actionData.map((place, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.6 + (i * 0.1) }}
                                                    className="bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-white/[0.06] transition-all rounded-xl p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]"
                                                >
                                                    <div className="font-medium text-white/90 text-[15px] leading-tight mb-1">{place.name}</div>
                                                    <div className="text-[13px] text-white/50 mb-3 leading-snug">{place.address}</div>

                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                                                        <div className="text-[11px] uppercase tracking-wider text-violet-300/80 font-medium bg-violet-500/10 px-2 py-1 rounded-md self-start sm:self-auto">
                                                            {place.distance}m away
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {place.phone && (
                                                                <a
                                                                    href={`tel:${place.phone}`}
                                                                    className="px-3 sm:px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition"
                                                                >
                                                                    Call
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={() => handleRideEstimate(place)}
                                                                className="px-3 sm:px-4 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg text-xs font-medium transition whitespace-nowrap"
                                                            >
                                                                Ride Estimate
                                                            </button>
                                                            <a
                                                                href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="px-3 sm:px-4 py-1.5 bg-violet-600/90 hover:bg-violet-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.3)] rounded-lg text-xs font-medium transition"
                                                            >
                                                                Navigate
                                                            </a>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                    {message.whatsappDraft && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.8, duration: 0.4 }}
                                            className="mt-4"
                                        >
                                            <a
                                                href={`https://wa.me/?text=${encodeURIComponent(message.whatsappDraft)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors shadow-lg"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                                                </svg>
                                                Send update to family via WhatsApp
                                            </a>
                                        </motion.div>
                                    )}
                                    {message.rideEstimates && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.9, duration: 0.4 }}
                                            className="mt-4 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl w-full"
                                        >
                                            <div className="text-white/90 font-medium text-[14px] mb-4 text-center">🚕 Travel Options to {message.rideEstimates.destination_name}</div>
                                            <div className="grid grid-cols-2 gap-3 mb-5">
                                                <div className="bg-white/5 rounded-lg p-3 flex flex-col gap-1 border border-white/5 items-center text-center">
                                                    <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Walk 🚶</div>
                                                    <div className="text-white font-semibold text-sm">~{message.rideEstimates.walk.time_mins} mins</div>
                                                    <div className="text-green-400 text-[11px] font-medium">Free</div>
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-3 flex flex-col gap-1 border border-white/5 items-center text-center">
                                                    <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Rapido 🏍️</div>
                                                    <div className="text-white font-semibold text-sm">~{message.rideEstimates.bike.time_mins} mins</div>
                                                    <div className="text-white/80 text-[11px]">~₹{message.rideEstimates.bike.cost}</div>
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-3 flex flex-col gap-1 border border-white/5 items-center text-center">
                                                    <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Ola/Uber 🚕</div>
                                                    <div className="text-white font-semibold text-sm">~{message.rideEstimates.cab.time_mins} mins</div>
                                                    <div className="text-white/80 text-[11px]">~₹{message.rideEstimates.cab.cost}</div>
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-3 flex flex-col gap-1 border border-white/5 items-center text-center">
                                                    <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Bus 🚌</div>
                                                    <div className="text-white font-semibold text-sm">~{message.rideEstimates.bus.time_mins} mins</div>
                                                    <div className="text-white/80 text-[11px]">~₹{message.rideEstimates.bus.cost}</div>
                                                </div>
                                            </div>
                                            {/* Booking Buttons */}
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                <a
                                                    href={`https://book.olacabs.com/?drop_lat=${message.rideEstimates.drop_lat}&drop_lng=${message.rideEstimates.drop_lng}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center justify-center gap-2 bg-[#1A8D1A] hover:bg-[#158015] text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-lg"
                                                >
                                                    🚗 Book Ola
                                                </a>
                                                <a
                                                    href={`https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${message.rideEstimates.drop_lat}&dropoff[longitude]=${message.rideEstimates.drop_lng}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-lg border border-white/10"
                                                >
                                                    🚕 Book Uber
                                                </a>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <a
                                                    href="https://www.rapido.bike/"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center justify-center gap-2 bg-[#F9C935] hover:bg-[#F9C935]/90 text-black px-3 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-lg"
                                                >
                                                    🏍️ Book Rapido
                                                </a>
                                                <a
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${message.rideEstimates.drop_lat},${message.rideEstimates.drop_lng}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-lg"
                                                >
                                                    🗺️ Google Maps
                                                </a>
                                            </div>
                                        </motion.div>
                                    )}
                                    {message.responseType === "request_location" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.8, duration: 0.4 }}
                                            className="mt-4 flex gap-3 w-full"
                                        >
                                            <button
                                                onClick={() => handleLocationAction("allow")}
                                                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg"
                                            >
                                                Allow Location
                                            </button>
                                            <button
                                                onClick={() => handleLocationAction("deny")}
                                                className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                            >
                                                Deny Location
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                                <span className="text-[10px] text-white/20 px-1">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-start gap-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
                            </div>
                            <div className="bg-white/[0.03] border border-white/[0.05] px-4 py-3 rounded-2xl flex items-center gap-3">
                                <TypingDots />
                                <span className="text-xs text-white/40">{interactionStep === 2 ? "Finding help near you..." : "Jenny is typing..."}</span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Sticky Bottom Input */}
            <div className="w-full max-w-3xl mx-auto p-4 pb-8 relative z-20">
                <motion.div
                    className="relative backdrop-blur-2xl bg-[#0A0A0B]/80 rounded-2xl border border-white/[0.05] shadow-2xl overflow-hidden"
                    layout
                >
                    <AnimatePresence>
                        {showCommandPalette && (
                            <motion.div
                                ref={commandPaletteRef}
                                className="absolute left-0 right-0 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-white/10 overflow-hidden"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                <div className="py-1">
                                    {commandSuggestions.map((suggestion, index) => (
                                        <div
                                            key={suggestion.prefix}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 text-xs transition-colors cursor-pointer",
                                                activeSuggestion === index ? "bg-white/10" : "hover:bg-white/5"
                                            )}
                                            onClick={() => {
                                                setValue(suggestion.prefix + ' ');
                                                setShowCommandPalette(false);
                                            }}
                                        >
                                            <div className="text-white/60">{suggestion.icon}</div>
                                            <div className="flex-1">
                                                <div className="font-medium text-white">{suggestion.label}</div>
                                                <div className="text-white/40 text-[10px]">{suggestion.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="p-2">
                        <Textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            placeholder="I’m here — what’s going on?"
                            className="w-full bg-transparent border-none focus:ring-0 text-sm py-3 px-4 resize-none min-h-[52px]"
                            showRing={false}
                        />
                    </div>

                    <div className="px-4 py-2 border-t border-white/[0.05] flex items-center justify-end bg-white/[0.01]">
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!value.trim()}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all",
                                value.trim() ? "bg-white text-black" : "bg-white/5 text-white/20"
                            )}
                        >
                            <SendIcon className="w-3 h-3" />
                            <span>Send</span>
                        </button>
                    </div>
                </motion.div>

                <p className="text-center text-[12px] text-white/20 mt-4">
                    Your Emergency Support Companion
                </p>
            </div>

            {/* Mouse Flow Effect */}
            {inputFocused && (
                <motion.div
                    className="fixed w-[400px] h-[400px] rounded-full pointer-events-none z-0 opacity-[0.03] bg-gradient-to-r from-violet-500 to-indigo-500 blur-[80px]"
                    animate={{
                        x: mousePosition.x - 200,
                        y: mousePosition.y - 200,
                    }}
                    transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.5 }}
                />
            )}
        </div>
    );
}

function TypingDots() {
    return (
        <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-white/40 rounded-full"
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
            ))}
        </div>
    );
}
