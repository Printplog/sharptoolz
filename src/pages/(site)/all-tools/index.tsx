import ToolsList from "@/components/Dashboard/Tools/ToolsList";

import SectionPadding from "@/layouts/SectionPadding";

import SEO from "@/components/SEO";

export default function AllTools() {
  return (
    <SectionPadding>
       <SEO 
         title="Browse All Document Tools" 
         description="Explore our full library of professional sample document generators, including IDs, DLs, passports, and business forms."
         canonical="/all-tools"
       />
       <ToolsList />
    </SectionPadding>
  )
}
