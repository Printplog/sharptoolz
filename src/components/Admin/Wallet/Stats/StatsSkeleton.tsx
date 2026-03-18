export default function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/5 rounded-lg" />
            <div className="w-12 h-4 bg-white/5 rounded" />
          </div>
          <div>
            <div className="w-24 h-3 bg-white/5 rounded mb-2" />
            <div className="w-32 h-8 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
