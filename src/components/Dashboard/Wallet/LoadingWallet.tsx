import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingWallet() {
  return (
    <div className='space-y-6'>
        <div className="flex justify-between items-center">
            <Skeleton className="bg-white/5 border border-white/10 h-8 w-[80px]" />
            <Skeleton className="bg-white/5 border border-white/10 h-10 w-[100px]" />
        </div>
        <Skeleton className="bg-white/5 border border-white/10 h-30" />
        <div className="space-y-4 bg-white/5 border border-white/10 p-4 rounded-lg">
            {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="bg-white/10 border border-white/20 h-12" />
            ))}
        </div>
    </div>
  )
}
