import { Clock } from "lucide-react";

export default function WaitlistPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="size-20 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <Clock className="size-10 text-yellow-500" />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
                    Waitlist <span className="text-yellow-500">Management</span>
                </h1>
                <p className="text-white/40 max-w-md mx-auto">
                    This feature is currently under development. Soon you'll be able to manage early access requests and lead generation here.
                </p>
            </div>
        </div>
    );
}
