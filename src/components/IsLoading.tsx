import { Skeleton } from './ui/skeleton'

export default function IsLoading() {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full'>
        {Array.from({ length: 9 }).map((_, index) => (
            <div className="relative h-[400px] rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm p-2 w-full" key={index} >
                <Skeleton className='w-full h-full bg-white/5' />
            </div>
        ))}
    </div>
  )
}
