import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, User, Mail, MessageSquare, HelpCircle, Loader2 } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { submitContactForm } from "@/api/apiEndpoints";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Enter your name";
    if (!formData.email.trim()) {
      newErrors.email = "Enter your email";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Wrong email format";
    }
    if (!formData.subject.trim()) newErrors.subject = "Tell us why you're messaging";
    if (!formData.message.trim()) newErrors.message = "Message cannot be empty";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors in the form.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitContactForm(formData);
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      toast.success("Message sent successfully!");
      // Reset submission state after a while
      setTimeout(() => setSubmitted(false), 8000);
    } catch (error: any) {
      console.error("Contact submission error:", error);
      toast.error(error?.response?.data?.error || "Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const InputWrapper = ({ label, icon: Icon, children, error, rootClassName }: any) => (
    <div className="space-y-2 group">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
           <Icon className="w-3.5 h-3.5 text-white/20 group-focus-within:text-primary transition-all group-focus-within:scale-110" />
           <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] group-focus-within:text-white transition-colors">
            {label}
           </span>
        </div>
        <AnimatePresence>
          {error && (
            <motion.span 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-[9px] font-bold text-red-500 uppercase tracking-widest"
            >
              {error}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className={cn(
        "relative overflow-hidden bg-white/2 border border-white/5 group-focus-within:border-primary/30 group-focus-within:bg-white/[0.04] transition-all duration-300",
        rootClassName || "rounded-full"
      )}>
        {children}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-primary/0 group-focus-within:bg-primary/50 transition-all scale-x-0 group-focus-within:scale-x-100 duration-500 origin-left" />
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-[#0D1117] backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 md:p-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden"
    >
      {/* Premium Background Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-16 flex flex-col items-center relative z-10"
          >
            <motion.div 
              initial={{ scale: 0.5, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center mb-10 shadow-[0_0_40px_rgba(var(--primary),0.2)]"
            >
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </motion.div>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-6 leading-none">
               Message <span className="text-primary">Transmitted</span>
            </h2>
            <p className="text-white/40 text-lg font-medium max-w-sm mx-auto leading-relaxed">
              We've received your request. Our support team will analyze and respond within 24 hours.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSubmitted(false)}
              className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-primary transition-colors cursor-pointer"
            >
              Send another message
            </motion.button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputWrapper label="Your Name" icon={User} error={errors.name}>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-none py-4 px-4 text-white placeholder:text-white/20 text-sm focus:outline-none transition-all"
                  placeholder="Official Name"
                />
              </InputWrapper>

              <InputWrapper label="Your Email" icon={Mail} error={errors.email}>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-none py-4 px-4 text-white placeholder:text-white/20 text-sm focus:outline-none transition-all"
                  placeholder="active-email@provider.com"
                />
              </InputWrapper>
            </div>

            <InputWrapper label="Inquiry Subject" icon={HelpCircle} error={errors.subject}>
              <input
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full bg-transparent border-none py-4 px-4 text-white placeholder:text-white/20 text-sm focus:outline-none transition-all"
                placeholder="What can we help you with?"
              />
            </InputWrapper>

            <InputWrapper label="Your Message" icon={MessageSquare} error={errors.message} rootClassName="rounded-3xl">
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="w-full bg-transparent border-none py-4 px-6 text-white placeholder:text-white/20 text-sm focus:outline-none transition-all resize-none"
                placeholder="Describe your request in detail..."
              />
            </InputWrapper>

            <div className="pt-2 flex justify-center">
              <PremiumButton 
                text={isSubmitting ? "Transmitting..." : "Send Request"}
                icon={isSubmitting ? Loader2 : Send}
                className={cn(
                  "w-full sm:w-auto px-12 h-14 text-sm transition-all",
                  isSubmitting && "opacity-50 grayscale"
                )}
                isLoading={isSubmitting}
              />
            </div>
            
            <p className="text-center text-[9px] font-bold uppercase tracking-[0.4em] text-white/10">
              End-to-End Encrypted Transmission
            </p>
          </form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
