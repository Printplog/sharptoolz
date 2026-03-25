import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle2, User, Mail, MessageSquare, HelpCircle } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";

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
      return;
    }

    setIsSubmitting(true);
    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setSubmitted(true);
    setIsSubmitting(false);
    setFormData({ name: "", email: "", subject: "", message: "" });
    
    setTimeout(() => setSubmitted(false), 5000);
  };

  const InputWrapper = ({ label, icon: Icon, children, error }: any) => (
    <div className="space-y-2 group">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
           <Icon className="w-3 h-3 text-white/40 group-focus-within:text-primary transition-colors" />
           <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] group-focus-within:text-primary transition-colors">
            {label}
           </span>
        </div>
        {error && (
          <span className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest animate-pulse">
            {error}
          </span>
        )}
      </div>
      <div className="relative">
        {children}
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10 group-focus-within:bg-primary/50 transition-colors" />
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl overflow-hidden"
    >
      {/* Glass Reflection */}
      <div className="absolute inset-0 bg-linear-to-br from-white/[0.05] to-transparent pointer-events-none" />

      {submitted ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 flex flex-col items-center relative z-10"
        >
          <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">
             Message <span className="text-primary">Sent</span>
          </h2>
          <p className="text-white/40 text-sm font-medium max-w-xs mx-auto leading-relaxed">
            Thank you for reaching out. We will get back to you as soon as possible.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputWrapper label="Your Name" icon={User} error={errors.name}>
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-transparent border-none py-3 px-2 text-white placeholder:text-white/30 text-sm focus:outline-none transition-all"
                placeholder="Full Name"
              />
            </InputWrapper>

            <InputWrapper label="Your Email" icon={Mail} error={errors.email}>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-transparent border-none py-3 px-2 text-white placeholder:text-white/30 text-sm focus:outline-none transition-all"
                placeholder="email@example.com"
              />
            </InputWrapper>
          </div>

          <InputWrapper label="Reason for messaging" icon={HelpCircle} error={errors.subject}>
            <input
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full bg-transparent border-none py-3 px-2 text-white placeholder:text-white/30 text-sm focus:outline-none transition-all"
              placeholder="E.g Question about a tool"
            />
          </InputWrapper>

          <InputWrapper label="Your Message" icon={MessageSquare} error={errors.message}>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={4}
              className="w-full bg-transparent border-none py-3 px-2 text-white placeholder:text-white/30 text-sm focus:outline-none transition-all resize-none"
              placeholder="Tell us what you need help with..."
            />
          </InputWrapper>

          <div className="pt-4">
            <PremiumButton 
              text={isSubmitting ? "Sending..." : "Send Message"}
              icon={Send}
              className="w-full"
              isLoading={isSubmitting}
            />
          </div>
        </form>
      )}
    </motion.div>
  );
}
