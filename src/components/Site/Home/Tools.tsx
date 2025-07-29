import ToolsListHorizontal from '@/components/Dashboard/Tools/ToolsListHorizontal'
import SectionPadding from '@/layouts/SectionPadding'

export default function Tools() {
  return (
    <SectionPadding className='space-y-10 mt-[50px]'>
        <h2 className="text-center text-4xl">Featured Tools 🔥</h2>
        <ToolsListHorizontal />
    </SectionPadding>
  )
}
