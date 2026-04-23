import { motion, type PanInfo } from "framer-motion";
import type React from "react";
import { useRef, useState, useEffect } from "react";
import { flushSync } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Brain,
  CheckCircle,
  Cpu,
  Layout,
  MessageSquare,
  Shield,
  MapPin,
  Car,
  FileText,
  Database,
  RefreshCw,
  User,
} from "lucide-react";

// Interfaces
interface WorkflowNode {
  id: string;
  type: "trigger" | "action" | "condition";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  position: { x: number; y: number };
}

interface WorkflowConnection {
  from: string;
  to: string;
}

// Constants
const NODE_WIDTH = 140;
const NODE_HEIGHT = 65;



const initialNodes: WorkflowNode[] = [
  {
    id: "user-input",
    type: "trigger",
    title: "User Input",
    description: "Emergency request received",
    icon: User,
    color: "blue",
    position: { x: 310, y: 30 },
  },
  {
    id: "manager-agent",
    type: "action",
    title: "Manager Agent",
    description: "Core Intelligence",
    icon: Brain,
    color: "indigo",
    position: { x: 310, y: 135 },
  },
  // Parallel Agents Row 1
  {
    id: "agent-location",
    type: "action",
    title: "Location",
    description: "Geo-spatial analysis",
    icon: MapPin,
    color: "emerald",
    position: { x: 40, y: 240 },
  },
  {
    id: "agent-safety",
    type: "action",
    title: "Safety",
    description: "Threat assessment",
    icon: Shield,
    color: "emerald",
    position: { x: 220, y: 240 },
  },
  {
    id: "agent-transport",
    type: "action",
    title: "Transport",
    description: "Logistics & routing",
    icon: Car,
    color: "emerald",
    position: { x: 400, y: 240 },
  },
  {
    id: "agent-communication",
    type: "action",
    title: "Communication",
    description: "Network & dispatch",
    icon: MessageSquare,
    color: "emerald",
    position: { x: 580, y: 240 },
  },
  // Parallel Agents Row 2
  {
    id: "agent-context",
    type: "action",
    title: "Context",
    description: "Historical awareness",
    icon: FileText,
    color: "emerald",
    position: { x: 130, y: 345 },
  },
  {
    id: "agent-resource",
    type: "action",
    title: "Resource",
    description: "Inventory check",
    icon: Database,
    color: "emerald",
    position: { x: 310, y: 345 },
  },
  {
    id: "agent-fallback",
    type: "action",
    title: "Fallback",
    description: "Contingency planning",
    icon: RefreshCw,
    color: "emerald",
    position: { x: 490, y: 345 },
  },
  {
    id: "summarizer-agent",
    type: "condition",
    title: "Summarizer Agent",
    description: "Plan consolidation",
    icon: Layout,
    color: "purple",
    position: { x: 310, y: 450 },
  },
  {
    id: "recovery-plan",
    type: "action",
    title: "Recovery Plan",
    description: "Actionable output",
    icon: CheckCircle,
    color: "blue",
    position: { x: 310, y: 550 },
  },
];

const initialConnections: WorkflowConnection[] = [
  // Input to Manager
  { from: "user-input", to: "manager-agent" },
  // Manager to Agents
  { from: "manager-agent", to: "agent-location" },
  { from: "manager-agent", to: "agent-safety" },
  { from: "manager-agent", to: "agent-transport" },
  { from: "manager-agent", to: "agent-communication" },
  { from: "manager-agent", to: "agent-context" },
  { from: "manager-agent", to: "agent-resource" },
  { from: "manager-agent", to: "agent-fallback" },
  // Agents to Summarizer
  { from: "agent-location", to: "summarizer-agent" },
  { from: "agent-safety", to: "summarizer-agent" },
  { from: "agent-transport", to: "summarizer-agent" },
  { from: "agent-communication", to: "summarizer-agent" },
  { from: "agent-context", to: "summarizer-agent" },
  { from: "agent-resource", to: "summarizer-agent" },
  { from: "agent-fallback", to: "summarizer-agent" },
  // Summarizer to Output
  { from: "summarizer-agent", to: "recovery-plan" },
];

const colorClasses: Record<string, string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  purple: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
};

// Connection Line Component
function WorkflowConnectionLine({
  from,
  to,
  nodes,
}: {
  from: string;
  to: string;
  nodes: WorkflowNode[];
}) {
  const fromNode = nodes.find((n) => n.id === from);
  const toNode = nodes.find((n) => n.id === to);
  if (!fromNode || !toNode) return null;

  const isVertical = Math.abs(toNode.position.x - fromNode.position.x) < NODE_WIDTH / 2;

  let startX, startY, endX, endY;

  if (isVertical) {
    startX = fromNode.position.x + NODE_WIDTH / 2;
    startY = fromNode.position.y + NODE_HEIGHT;
    endX = toNode.position.x + NODE_WIDTH / 2;
    endY = toNode.position.y;
  } else {
    startX = fromNode.position.x + NODE_WIDTH / 2;
    startY = fromNode.position.y + NODE_HEIGHT;
    endX = toNode.position.x + NODE_WIDTH / 2;
    endY = toNode.position.y;
  }

  // Adjusted paths for a more "flowing" look
  const deltaY = endY - startY;
  const cp1X = startX;
  const cp1Y = startY + deltaY * 0.5;
  const cp2X = endX;
  const cp2Y = endY - deltaY * 0.5;

  const path = `M${startX},${startY} C${cp1X},${cp1Y} ${cp2X},${cp2Y} ${endX},${endY}`;

  return (
    <path
      d={path}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeDasharray="8,6"
      strokeLinecap="round"
      opacity={0.15}
      className="text-white"
    />
  );
}

// Main Component
export function N8nWorkflowBlock() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [connections, setConnections] =
    useState<WorkflowConnection[]>(initialConnections);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [contentSize, setContentSize] = useState(() => {
    const maxX = Math.max(
      ...initialNodes.map((n) => n.position.x + NODE_WIDTH)
    );
    const maxY = Math.max(
      ...initialNodes.map((n) => n.position.y + NODE_HEIGHT)
    );
    return { width: maxX + 50, height: maxY + 50 };
  });

  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (wrapperRef.current) {
        const width = wrapperRef.current.clientWidth;
        setContainerWidth(width);
        const requiredWidth = contentSize.width;

        if (width < requiredWidth) {
          // Increase scale by 15% for better mobile visibility
          const fitScale = (width - 32) / requiredWidth;
          setScale(Math.min(1, fitScale * 1.15));
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [contentSize.width]);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/5 bg-neutral-950/40 backdrop-blur-3xl p-4 sm:p-6 shadow-2xl">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400"
          >
            Active
          </Badge>
          <span className="text-xs sm:text-sm uppercase tracking-[0.25em] text-white/40 font-medium">
            Jenny's Workflow
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={wrapperRef}
        className="relative w-full overflow-hidden rounded-2xl border border-white/5 bg-neutral-900/30 shadow-inner"
        style={{ minHeight: "400px", height: `${Math.max(400, contentSize.height * scale + 40)}px` }}
        role="region"
        aria-label="Workflow canvas"
        tabIndex={0}
      >
        {/* Content Wrapper */}
        <div
          ref={canvasRef}
          className="absolute top-0 left-0 origin-top-left"
          style={{
            width: contentSize.width,
            height: contentSize.height,
            transform: `translate(${Math.max(0, containerWidth - contentSize.width * scale) / 2}px, 20px) scale(${scale})`,
          }}
        >
          {/* SVG Connections */}
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={contentSize.width}
            height={contentSize.height}
            style={{ overflow: "visible" }}
            aria-hidden="true"
          >
            {connections.map((c) => (
              <WorkflowConnectionLine
                key={`${c.from}-${c.to}`}
                from={c.from}
                to={c.to}
                nodes={nodes}
              />
            ))}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const Icon = node.icon;

            return (
              <motion.div
                key={node.id}
                style={{
                  x: node.position.x,
                  y: node.position.y,
                  width: NODE_WIDTH,
                  transformOrigin: "center center",
                  scale: node.id === "manager-agent" ? 1.05 : 1,
                  zIndex: node.id === "manager-agent" ? 20 : 10,
                }}
                className="absolute"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card
                  className={`group/node relative w-full overflow-hidden rounded-xl border ${colorClasses[node.color]} bg-neutral-900 p-2 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-0.5`}
                  role="article"
                  aria-label={`${node.type} node: ${node.title}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/node:opacity-100" />

                  <div className="relative space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${colorClasses[node.color]} bg-neutral-950/80 backdrop-blur`}
                        aria-hidden="true"
                      >
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[7px] uppercase tracking-wider text-white/40 font-bold">
                            {node.type}
                          </span>
                        </div>
                        <h3 className="truncate text-[9px] font-bold tracking-tight text-white leading-none">
                          {node.title}
                        </h3>
                      </div>
                    </div>
                    <p className="line-clamp-1 text-[8px] leading-tight text-white/60">
                      {node.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                      <ArrowRight className="h-2.5 w-2.5" aria-hidden="true" />
                      <span className="uppercase tracking-[0.1em] font-medium">
                        Connected
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer Stats */}
      <div
        className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-neutral-900/40 px-4 py-2.5 backdrop-blur-sm"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              aria-hidden="true"
            />
            <span className="uppercase tracking-[0.15em]">
              {nodes.length} {nodes.length === 1 ? "Node" : "Nodes"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 w-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            <span className="uppercase tracking-[0.15em]">
              {connections.length}{" "}
              {connections.length === 1 ? "Connection" : "Connections"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
