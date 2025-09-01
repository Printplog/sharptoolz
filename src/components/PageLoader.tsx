import Logo from "@/components/Logo";

export default function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <div className="relative size-60 flex items-center justify-center">
        <Logo  />
        <div className="absolute inset-0 border-2 border-white/10 border-r-0  border-t-0 rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
