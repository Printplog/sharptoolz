import ToolsListHorizontal from '@/components/Dashboard/Tools/ToolsListHorizontal'
import SectionPadding from '@/layouts/SectionPadding'

export default function Tools() {
  return (
    <SectionPadding className='space-y-16 mt-20 md:mt-32'>
        <h2 className="text-4xl md:text-5xl lg:text-7xl font-fancy font-black text-white tracking-tighter uppercase italic leading-[0.9] text-center">
          Featured <span className="text-primary">Tools</span>
        </h2>
        <ToolsListHorizontal />
    </SectionPadding>
  )
}
