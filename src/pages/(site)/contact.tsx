import { useState } from "react";
import SectionPadding from "@/layouts/SectionPadding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, CheckCircle2 } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Form submission (can be connected to backend API later)
    setSubmitted(true);
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
    setErrors({});
    
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <SectionPadding>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Have a question, feedback, or partnership inquiry? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Contact Form */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 lg:p-8">
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Message Sent!</h2>
                <p className="text-white/70">
                  Thank you for contacting us. We'll get back to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white/90">
                    Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    placeholder="Your name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-400">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/90">
                    Email <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    placeholder="your.email@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-400">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-white/90">
                    Subject <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    placeholder="What's this about?"
                  />
                  {errors.subject && (
                    <p className="text-sm text-red-400">{errors.subject}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white/90">
                    Message <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                  {errors.message && (
                    <p className="text-sm text-red-400">{errors.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-background font-semibold py-6"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            )}
          </div>

          {/* Image Section */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md">
              <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border border-white/10 p-8 flex items-center justify-center">
                <Mail className="w-32 h-32 text-primary/30" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
              <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
            </div>
            <div className="mt-8 text-center space-y-4">
              <h3 className="text-xl font-semibold">We're Here to Help</h3>
              <p className="text-white/70 max-w-sm">
                Whether you have a question about our tools, need support, or want to collaborate, 
                we're ready to assist you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionPadding>
  );
}

