import { PosTerminal } from "@/components/pos/pos-terminal"
import { PosViewport } from "@/components/pos/pos-viewport"

export default function PosPage() {
  return (
    <PosViewport>
      <PosTerminal />
    </PosViewport>
  )
}
