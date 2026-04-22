import { N8nWorkflowBlock } from "@/components/ui/n8n-workflow-block-shadcnui"

export default function Demo() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] w-full items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <N8nWorkflowBlock />
      </div>
    </div>
  )
}
