import { N8nWorkflowBlock } from "@/components/ui/n8n-workflow-block-shadcnui"

export default function Demo() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-black/90 p-4 md:p-8 rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
      <div className="w-full max-w-6xl">
        <N8nWorkflowBlock />
      </div>
    </div>
  )
}
