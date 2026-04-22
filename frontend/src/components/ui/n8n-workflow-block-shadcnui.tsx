import { motion, type PanInfo } from "framer-motion";
import type React from "react";
import { useRef, useState } from "react";
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
  Plus,
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

const nodeTemplates: Omit<WorkflowNode, "id" | "position">[] = [
  {
    type: "trigger",
    title: "User Input",
    description: "New emergency request",
    icon: User,
    color: "blue",
  },
  {
    type: "action",
    title: "Manager Agent",
    description: "Orchestrate recovery",
    icon: Brain,
    color: "indigo",
  },
  {
    type: "action",
    title: "Parallel Agent",
    description: "Specialized task execution",
    icon: Cpu,
    color: "emerald",
  },
  {
    type: "action",
    title: "Resource Check",
    description: "Database lookup",
    icon: Database,
    color: "blue",
  },
  {
    type: "action",
    title: "Fallback",
    description: "Contingency logic",
    icon: RefreshCw,
    color: "amber",
  },
];

const initialNodes: WorkflowNode[] = [
  {
    id: "user-input",
    type: "trigger",
    title: "User Input",
    description: "Emergency request received",
    icon: User,
    color: "blue",
    position: { x: 430, y: 30 },
  },
  {
    id: "manager-agent",
    type: "action",
    title: "Manager Agent",
    description: "Core Intelligence",
    icon: Brain,
    color: "indigo",
    position: { x: 430, y: 135 },
  },
  // Parallel Agents Row 1
  {
    id: "agent-location",
    type: "action",
    title: "Location",
    description: "Geo-spatial analysis",
    icon: MapPin,
    color: "emerald",
    position: { x: 160, y: 240 },
  },
  {
    id: "agent-safety",
    type: "action",
    title: "Safety",
    description: "Threat assessment",
    icon: Shield,
    color: "emerald",
    position: { x: 340, y: 240 },
  },
  {
    id: "agent-transport",
    type: "action",
    title: "Transport",
    description: "Logistics & routing",
    icon: Car,
    color: "emerald",
    position: { x: 520, y: 240 },
  },
  {
    id: "agent-communication",
    type: "action",
    title: "Communication",
    description: "Network & dispatch",
    icon: MessageSquare,
    color: "emerald",
    position: { x: 700, y: 240 },
  },
  // Parallel Agents Row 2
  {
    id: "agent-context",
    type: "action",
    title: "Context",
    description: "Historical awareness",
    icon: FileText,
    color: "emerald",
    position: { x: 250, y: 345 },
  },
  {
    id: "agent-resource",
    type: "action",
    title: "Resource",
    description: "Inventory check",
    icon: Database,
    color: "emerald",
    position: { x: 430, y: 345 },
  },
  {
    id: "agent-fallback",
    type: "action",
    title: "Fallback",
    description: "Contingency planning",
    icon: RefreshCw,
    color: "emerald",
    position: { x: 610, y: 345 },
  },
  {
    id: "summarizer-agent",
    type: "condition",
    title: "Summarizer Agent",
    description: "Plan consolidation",
    icon: Layout,
    color: "purple",
    position: { x: 430, y: 450 },
  },
  {
    id: "recovery-plan",
    type: "action",
    title: "Recovery Plan",
    description: "Actionable output",
    icon: CheckCircle,
    color: "blue",
    position: { x: 430, y: 550 },
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
  emerald: "border-emerald-500/20 bg-emerald-50 text-emerald-600",
  blue: "border-blue-500/20 bg-blue-50 text-blue-600",
  amber: "border-amber-500/20 bg-amber-50 text-amber-600",
  purple: "border-purple-500/20 bg-purple-50 text-purple-600",
  indigo: "border-indigo-500/20 bg-indigo-50 text-indigo-600",
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
      opacity={0.35}
      className="text-foreground"
    />
  );
}

// Main Component
export function N8nWorkflowBlock() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [connections, setConnections] =
    useState<WorkflowConnection[]>(initialConnections);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartPosition = useRef<{ x: number; y: number } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [contentSize, setContentSize] = useState(() => {
    const maxX = Math.max(
      ...initialNodes.map((n) => n.position.x + NODE_WIDTH)
    );
    const maxY = Math.max(
      ...initialNodes.map((n) => n.position.y + NODE_HEIGHT)
    );
    return { width: maxX + 50, height: maxY + 50 };
  });

  // Drag Handlers
  const handleDragStart = (nodeId: string) => {
    setDraggingNodeId(nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      dragStartPosition.current = { x: node.position.x, y: node.position.y };
    }
  };

  const handleDrag = (nodeId: string, { offset }: PanInfo) => {
    if (draggingNodeId !== nodeId || !dragStartPosition.current) return;

    const newX = dragStartPosition.current.x + offset.x;
    const newY = dragStartPosition.current.y + offset.y;

    const constrainedX = Math.max(0, newX);
    const constrainedY = Math.max(0, newY);

    flushSync(() => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId
            ? { ...node, position: { x: constrainedX, y: constrainedY } }
            : node
        )
      );
    });

    setContentSize((prev) => ({
      width: Math.max(prev.width, constrainedX + NODE_WIDTH + 50),
      height: Math.max(prev.height, constrainedY + NODE_HEIGHT + 50),
    }));
  };

  const handleDragEnd = () => {
    setDraggingNodeId(null);
    dragStartPosition.current = null;
  };

  // Add Node Handler
  const addNode = () => {
    const template =
      nodeTemplates[Math.floor(Math.random() * nodeTemplates.length)];
    const lastNode = nodes[nodes.length - 1];
    const newPosition = lastNode
      ? { x: lastNode.position.x + 250, y: lastNode.position.y }
      : { x: 50, y: 100 };

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      ...template,
      position: newPosition,
    };

    flushSync(() => {
      setNodes((prev) => [...prev, newNode]);
      if (lastNode) {
        setConnections((prev) => [
          ...prev,
          { from: lastNode.id, to: newNode.id },
        ]);
      }
    });

    setContentSize((prev) => ({
      width: Math.max(prev.width, newPosition.x + NODE_WIDTH + 50),
      height: Math.max(prev.height, newPosition.y + NODE_HEIGHT + 50),
    }));

    // Scroll to new node
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.scrollTo({
        left: newPosition.x + NODE_WIDTH - canvas.clientWidth + 100,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-black/5 bg-white/80 backdrop-blur-xl p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="rounded-full border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400"
          >
            Active
          </Badge>
          <span className="text-xs sm:text-sm uppercase tracking-[0.25em] text-black/40 font-medium">
            Workflow Builder
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addNode}
          className="h-8 gap-2 rounded-lg text-xs uppercase tracking-[0.2em] text-foreground/70 hover:text-foreground"
          aria-label="Add new node"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Add Node</span>
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative h-[400px] w-full overflow-hidden rounded-2xl border border-black/5 bg-slate-50/50 sm:h-[500px] md:h-[620px] shadow-inner"
        style={{ minHeight: "400px" }}
        role="region"
        aria-label="Workflow canvas"
        tabIndex={0}
      >
        {/* Content Wrapper */}
        <div
          className="relative"
          style={{
            minWidth: contentSize.width,
            minHeight: contentSize.height,
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
            const isDragging = draggingNodeId === node.id;

            return (
              <motion.div
                key={node.id}
                drag
                dragMomentum={false}
                dragConstraints={canvasRef}
                onDragStart={() => handleDragStart(node.id)}
                onDrag={(_, info) => handleDrag(node.id, info)}
                onDragEnd={handleDragEnd}
                style={{
                  x: node.position.x,
                  y: node.position.y,
                  width: NODE_WIDTH,
                  transformOrigin: "center center",
                  scale: node.id === "manager-agent" ? 1.05 : 1,
                  zIndex: node.id === "manager-agent" ? 20 : 10,
                }}
                className="absolute cursor-grab"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileDrag={{ scale: 1.05, zIndex: 50, cursor: "grabbing" }}
                aria-grabbed={isDragging}
              >
                <Card
                  className={`group/node relative w-full overflow-hidden rounded-xl border ${colorClasses[node.color]} bg-white p-2 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 ${isDragging ? "shadow-xl ring-2 ring-primary/10" : ""}`}
                  role="article"
                  aria-label={`${node.type} node: ${node.title}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/node:opacity-100" />

                  <div className="relative space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${colorClasses[node.color]} bg-background/80 backdrop-blur`}
                        aria-hidden="true"
                      >
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[7px] uppercase tracking-wider text-black/30 font-bold">
                            {node.type}
                          </span>
                        </div>
                        <h3 className="truncate text-[9px] font-bold tracking-tight text-foreground leading-none">
                          {node.title}
                        </h3>
                      </div>
                    </div>
                    <p className="line-clamp-1 text-[8px] leading-tight text-foreground/50">
                      {node.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-black/30">
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
        className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/5 bg-slate-50/80 px-4 py-2.5 backdrop-blur-sm"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center gap-4 text-xs text-foreground/60">
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
        <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
          Drag nodes to reposition
        </p>
      </div>
    </div>
  );
}
