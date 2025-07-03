import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingWallet() {
  return (
    <div className='space-y-6'>
        <Skeleton className="bg-white/5 border border-white/10" />
    </div>
  )
}
