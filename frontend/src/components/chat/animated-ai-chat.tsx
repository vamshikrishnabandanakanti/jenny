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
        return <span key={i}>{parts}{i < lines.length - 1 ? <br /> : null}</span>;
    });
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
    timestamp: Date;
}

export function AnimatedAIChat() {
    const [value, setValue] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);

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

    const handleSendMessage = async () => {
        if (!value.trim() || isTyping) return;

        const userInput = value.trim();
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
            const { callJennyBackend } = await import("@/lib/jenny-api");
            const jennyData = await callJennyBackend(userInput);

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: jennyData.recoveryPlan,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("[Chat] Backend error:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "I'm having trouble connecting right now. Please check that the backend server is running on port 3001 and try again.",
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

    const handleAttachFile = () => {
        // Attachment support coming soon
        console.log("[Chat] File attachment clicked — feature pending");
    };

    return (
        <div className="flex flex-col h-screen w-full bg-transparent text-white relative overflow-hidden">
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
                                How can I help today?
                            </h1>
                            <p className="text-white/40 text-sm">Start a conversation or use / for commands</p>
                            <div className="flex flex-wrap justify-center gap-2 mt-8">
                                {commandSuggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setValue(s.prefix + " ")}
                                        className="px-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-full text-xs text-white/60 hover:bg-white/[0.08] transition-all"
                                    >
                                        {s.label}
                                    </button>
                                ))}
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
                                    {renderMarkdown(message.content)}
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
                            <div className="bg-white/[0.03] border border-white/[0.05] px-4 py-3 rounded-2xl">
                                <TypingDots />
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
                            placeholder="Type a message or / for commands..."
                            className="w-full bg-transparent border-none focus:ring-0 text-sm py-3 px-4 resize-none min-h-[52px]"
                            showRing={false}
                        />
                    </div>

                    <div className="px-4 py-2 border-t border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-2">
                            <button onClick={handleAttachFile} className="p-2 text-white/40 hover:text-white transition-colors">
                                <Paperclip className="w-4 h-4" />
                            </button>
                            <button onClick={() => setShowCommandPalette(!showCommandPalette)} className="p-2 text-white/40 hover:text-white transition-colors">
                                <Command className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={handleSendMessage}
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

                <p className="text-center text-[10px] text-white/20 mt-4">
                    AI can make mistakes. Verify important info.
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
