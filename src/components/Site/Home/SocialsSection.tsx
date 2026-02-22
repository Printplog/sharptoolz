import { motion } from "framer-motion";
import { MessageCircle, Send, Twitter, Instagram, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/api/apiEndpoints";
import type { SiteSettings } from "@/types";
import SectionPadding from "@/layouts/SectionPadding";

const socialPlatforms = [
    {
        name: "WhatsApp",
        key: "whatsapp_community_link",
        icon: <MessageCircle className="w-8 h-8" />,
        color: "#25D366",
        description: "Join our vibrant community for instant updates and support.",
        stats: "2.4k+ Members",
        delay: 0.1,
    },
    {
        name: "Telegram",
        key: "telegram_link",
        icon: <Send className="w-8 h-8" />,
        color: "#0088cc",
        description: "Cloud-based messaging for our power users and developers.",
        stats: "1.8k+ Subscribers",
        delay: 0.2,
    },
    {
        name: "Twitter (X)",
        key: "twitter_link",
        icon: <Twitter className="w-8 h-8" />,
        color: "#1DA1F2",
        description: "Follow us for the latest news, features, and platform status.",
        stats: "5.2k+ Followers",
        delay: 0.3,
    },
    {
        name: "Instagram",
        key: "instagram_link",
        icon: <Instagram className="w-8 h-8" />,
        color: "#E1306C",
        description: "Behind the scenes, tutorials, and visual platform updates.",
        stats: "3.1k+ Followers",
        delay: 0.4,
    },
];

export default function SocialsSection() {
    const { data: settings } = useQuery<SiteSettings>({
        queryKey: ["siteSettings"],
        queryFn: getSiteSettings,
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 12,
            },
        },
    };

    return (
        <section className="relative py-24 overflow-hidden bg-[#F9F9F9]">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50" />
                <div className="absolute top-1/2 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-30" />
            </div>

            <SectionPadding>
                <div className="text-center mb-16 relative z-10">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-primary font-black uppercase tracking-[0.2em] text-xs mb-4 block"
                    >
                        Stay Connected
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-black text-secondary tracking-tighter italic uppercase mb-6"
                    >
                        Join the <span className="text-primary">Community</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-secondary/60 max-w-2xl mx-auto text-lg leading-relaxed"
                    >
                        Be part of our fast-growing ecosystem. Get exclusive access to tools,
                        tutorials, and real-time support directly from our community channels.
                    </motion.p>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10"
                >
                    {socialPlatforms.map((platform) => {
                        const link = settings?.[platform.key as keyof SiteSettings] as string;

                        return (link || settings?.whatsapp_community_link) && (
                            <motion.a
                                key={platform.name}
                                href={link || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                variants={cardVariants}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="group relative bg-white border border-secondary/5 p-8 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden"
                            >
                                {/* Brand Color Glow on Hover */}
                                <div
                                    className="absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                                    style={{ backgroundColor: platform.color }}
                                />

                                <div className="relative z-10">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:rotate-12"
                                        style={{ backgroundColor: `${platform.color}15`, color: platform.color }}
                                    >
                                        {platform.icon}
                                    </div>

                                    <h3 className="text-xl font-black text-secondary uppercase italic tracking-tighter mb-2 flex items-center gap-2">
                                        {platform.name}
                                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-y-1 translate-x-1" />
                                    </h3>

                                    <p className="text-secondary/50 text-sm leading-relaxed mb-6 h-12 overflow-hidden line-clamp-2">
                                        {platform.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-6 border-t border-secondary/5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary/30">
                                            {platform.stats}
                                        </span>
                                        <span
                                            className="text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ color: platform.color }}
                                        >
                                            Join Now
                                        </span>
                                    </div>
                                </div>
                            </motion.a>
                        );
                    })}
                </motion.div>
            </SectionPadding>
        </section>
    );
}
