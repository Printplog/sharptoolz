import { Skeleton } from "@/components/ui/skeleton";

export default function PreviewSkeleton() {
  return (
    <div className="w-full overflow-auto p-5 bg-white/10 border border-white/20 rounded-xl">
      <div className="w-full h-[600px] bg-white/5 border border-white/10 rounded-lg relative overflow-hidden">
        {/* Animated loading bars in the middle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-end gap-1 h-10">
          {/* Bar 1 */}
          <div
            className="w-2 bg-white/20  rounded-b-none"
            style={{
              height: '30px',
              animation: 'barPulse 1.4s ease-in-out infinite',
              animationDelay: '0s',
            }}
          />
          {/* Bar 2 */}
          <div
            className="w-2 bg-white/20  rounded-b-none"
            style={{
              height: '30px',
              animation: 'barPulse 1.4s ease-in-out infinite',
              animationDelay: '0.2s',
            }}
          />
          {/* Bar 3 */}
          <div
            className="w-2 bg-white/20  rounded-b-none"
            style={{
              height: '30px',
              animation: 'barPulse 1.4s ease-in-out infinite',
              animationDelay: '0.4s',
            }}
          />
        </div>
      </div>
    </div>
  );
}

