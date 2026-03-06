import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function TermsAgreementDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    useEffect(() => {
        const isPermanentlyHidden = localStorage.getItem("sharptoolz_terms_accepted_permanent") === "true";
        if (isPermanentlyHidden) {
            return;
        }

        const lastAcceptedDate = localStorage.getItem("sharptoolz_terms_accepted_date");
        const today = new Date().toDateString();

        if (lastAcceptedDate !== today) {
            setIsOpen(true);
        }
    }, []);

    const handleAccept = () => {
        if (dontShowAgain) {
            localStorage.setItem("sharptoolz_terms_accepted_permanent", "true");
        } else {
            localStorage.setItem("sharptoolz_terms_accepted_date", new Date().toDateString());
        }
        setIsOpen(false);
    };

    const handleReject = () => {
        // If they click No, redirect to google
        window.location.href = "https://www.google.com";
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            // Prevent closing by clicking outside or pressing escape
            if (!open) return;
            setIsOpen(open);
        }}>
            <DialogContent
                className="max-w-4xl bg-background border-white/10 p-8 rounded-xl shadow-2xl"
                showCloseButton={false}
            >
                <div className="flex flex-col items-center text-center space-y-6">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Attention!</h2>

                    <p className="text-base md:text-xl text-white/70 font-medium leading-relaxed max-w-3xl">
                        We strictly respect the laws, rules, and regulations of all jurisdictions, including the United States, United Kingdom, and Canada.
                        Please be advised that our templates are exclusively intended for use in TV shows, surveys, media productions, and other legitimate presentation purposes.
                        Using these materials for fraudulent activities, illegal transactions, or any dishonest purposes is strictly prohibited. We do not manufacture or ship physical PVC cards; we strictly provide digital files and documents. Do you agree to our Terms and Conditions?
                    </p>

                    <div className="flex w-full sm:w-auto items-center justify-center space-x-3 pt-4 pb-6">
                        <Checkbox
                            id="dont-show"
                            className="w-5 h-5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            checked={dontShowAgain}
                            onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
                        />
                        <label
                            htmlFor="dont-show"
                            className="text-base font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white/90"
                        >
                            Don't show this again
                        </label>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full mt-4">
                        <Button
                            onClick={handleAccept}
                            className="w-full sm:w-48 bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wider py-6 text-base rounded-md uppercase transition-colors"
                        >
                            YES, I AM
                        </Button>
                        <Button
                            onClick={handleReject}
                            variant="destructive"
                            className="w-full sm:w-48 font-bold tracking-wider py-6 text-base rounded-md uppercase transition-colors"
                        >
                            NO, I AM NOT
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
