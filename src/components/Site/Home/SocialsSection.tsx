import { motion } from "framer-motion";
import { MessageCircle, Send, Twitter, Instagram, ArrowUpRight, Zap } from "lucide-react";
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
        <section className="relative py-24 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] opacity-20" />
                <div className="absolute top-1/2 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[120px] opacity-10" />
            </div>

            <SectionPadding>
                <div className="text-center mb-16 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-6"
                    >
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        <span className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                            Stay Connected
                        </span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl lg:text-7xl font-fancy font-black text-white tracking-tighter uppercase italic mb-6 leading-[0.9]"
                    >
                        Join the <span className="text-primary">Community</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed"
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
                                whileHover={{ y: -10, scale: 1.02 }}
                                className="group relative bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl transition-all duration-500 overflow-hidden"
                            >
                                {/* Brand Color Glow on Hover */}
                                <div
                                    className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700"
                                    style={{ backgroundColor: platform.color }}
                                />

                                <div className="relative z-10">
                                    <div
                                        className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-8 transition-all duration-500 group-hover:rotate-[15deg] group-hover:scale-110 shadow-lg"
                                        style={{
                                            background: `linear-gradient(135deg, ${platform.color}20, ${platform.color}05)`,
                                            color: platform.color,
                                            border: `1px solid ${platform.color}30`
                                        }}
                                    >
                                        {platform.icon}
                                    </div>

                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-3 flex items-center gap-2">
                                        {platform.name}
                                        <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all -translate-y-1 translate-x-1 duration-300" />
                                    </h3>

                                    <p className="text-white/40 text-sm font-medium leading-relaxed mb-8 h-12 overflow-hidden line-clamp-2">
                                        {platform.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                                            {platform.stats}
                                        </span>
                                        <span
                                            className="text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300"
                                            style={{ color: platform.color }}
                                        >
                                            Join now
                                        </span>
                                    </div>
                                </div>

                                {/* Subtle Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                            </motion.a>
                        );
                    })}
                </motion.div>
            </SectionPadding>
        </section>
    );
}
