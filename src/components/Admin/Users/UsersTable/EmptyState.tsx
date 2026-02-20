import { motion } from "framer-motion";
import { User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    searchQuery: string;
    onReset: () => void;
}

export default function EmptyState({ searchQuery, onReset }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 px-4 text-center"
        >
            <div className="p-6 bg-white/5 rounded-[2rem] mb-6 border border-white/10 rotate-12">
                <UserIcon className="h-12 w-12 text-white/10 -rotate-12" />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                User Search Exhausted
            </h3>
            <p className="text-white/30 text-sm max-w-[280px] mt-3 font-medium">
                We scanned our database but couldn't find matches for{" "}
                <span className="text-primary italic">"{searchQuery}"</span>.
            </p>
            <Button
                variant="outline"
                className="mt-8 rounded-full px-8 border-primary/20 text-primary hover:bg-primary hover:text-background font-black transition-all"
                onClick={onReset}
            >
                RESET FILTERS
            </Button>
        </motion.div>
    );
}
