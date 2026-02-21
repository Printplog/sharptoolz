import ToolsList from '@/components/Dashboard/Tools/ToolsList'

export default function Tools() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold text-white tracking-tighter uppercase italic">
          All <span className="text-primary">Tools</span>
        </h1>
      </div>
      <ToolsList />
    </div>
  )
}
