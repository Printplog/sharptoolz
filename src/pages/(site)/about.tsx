import SectionPadding from "@/layouts/SectionPadding";

export default function About() {
  return (
    <SectionPadding className="py-24">
      <div className="max-w-3xl">
        <h1 className="text-5xl font-fancy font-black text-white italic tracking-tighter uppercase mb-8">
          About <span className="text-primary">Sharptoolz</span>
        </h1>
        <p className="text-white/60 text-lg leading-relaxed font-medium">
          Professional sample document generation for testing and demonstration purposes.
        </p>
      </div>
    </SectionPadding>
  )
}
