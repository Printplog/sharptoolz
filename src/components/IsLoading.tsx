import ToolCardSkeleton from "./Admin/Tools/ToolCardSkeleton";

export default function IsLoading() {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full'>
      {Array.from({ length: 6 }).map((_, index) => (
        <ToolCardSkeleton key={index} />
      ))}
    </div>
  )
}
