import ToolsList from "../Tools/ToolsList";

export default function HotTools() {
  return (
    <div className="space-y-5">
        <h2 className="text-xl pb-3 border-b border-white/10 ">Hot Tools <span role="img" aria-label="fire">🔥</span></h2>
        <ToolsList hot />
    </div>
  )
}
