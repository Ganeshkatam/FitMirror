'use client'

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getLiveActivityStream, ActivityItem } from "@/lib/service/activity-stream";

const TickerItem = ({ text }: { text: string }) => (
    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 mx-4">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium text-slate-300 whitespace-nowrap">{text}</span>
    </div>
);

export function QuantumHero() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    // Mouse tilt effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ clientX, clientY, currentTarget }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        mouseX.set((clientX - left) / width - 0.5);
        mouseY.set((clientY - top) / height - 0.5);
    }

    // Live Activity Stream
    const [activities, setActivities] = useState<string[]>([
        "Community is active right now",
        "New styles are being tried on",
        "Join 100+ users online"
    ]);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const stream = await getLiveActivityStream();
                if (stream && stream.length > 0) {
                    const messages = stream.map(s => {
                        if (s.type === 'purchase') return `${s.user_location} just purchased ${s.product_name}`;
                        if (s.type === 'try_on') return `${s.user_location} just tried on ${s.product_name}`;
                        return `${s.user_location} is viewing ${s.product_name}`;
                    });
                    setActivities(messages);
                }
            } catch (e) {
                console.error("Failed to fetch live activity", e);
            }
        };

        fetchActivity();
        // Poll every 30 seconds for new "live" feel without websocket overkill for public page
        const interval = setInterval(fetchActivity, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section ref={ref} className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden bg-[#0f172a] text-white" onMouseMove={handleMouseMove}>
            {/* Dynamic Background - Deep Indigo Theme */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0f172a] to-[#0b1021]" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            {/* Floating Elements (3D Parallax) */}
            <FloatingElements mouseX={mouseX} mouseY={mouseY} />

            {/* Main Content */}
            <motion.div style={{ y, opacity }} className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-[-10vh]">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-6">
                    <Sparkles className="w-4 h-4" />
                    <span>Next-Gen Virtual Try-On 2.0</span>
                </motion.div>

                <h1 className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-indigo-200/50 mb-6 font-serif">
                    Fashion from the <br /> <span className="text-indigo-400">Future.</span>
                </h1>

                <p className="text-lg md:text-xl text-indigo-200/60 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Experience the world's most advanced virtual fitting room.
                    Upload a photo and see yourself in our collection instantly.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link href="/shop">
                        <Button size="lg" className="h-14 px-8 rounded-full bg-white text-[#0f172a] hover:bg-indigo-50 text-lg font-medium transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            Start Exploring <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                    <Link href="/about">
                        <Button variant="ghost" size="lg" className="h-14 px-8 rounded-full text-indigo-200 hover:text-white hover:bg-white/5 text-lg">
                            How it works
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Live Social Ticker - Dark Indigo Glass */}
            <div className="absolute bottom-10 left-0 right-0 overflow-hidden py-4 border-y border-indigo-500/10 bg-[#0f172a]/40 backdrop-blur-md z-20">
                <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                    className="flex items-center w-max"
                >
                    {/* Duplicate array for seamless loop */}
                    {[...activities, ...activities, ...activities].map((text, i) => (
                        <TickerItem key={i} text={text} />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

function FloatingElements({ mouseX, mouseY }: { mouseX: any, mouseY: any }) {
    const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);

    return (
        <motion.div
            style={{ rotateX, rotateY, perspective: 1000 }}
            className="absolute inset-0 pointer-events-none z-0"
        >
            {/* Abstract 3D Shapes or Images would go here */}
            {/* Placeholder for "Floating Product" */}
            <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[20%] right-[10%] w-64 h-80 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-[2rem] blur-xl border border-white/5"
            />
            <motion.div
                animate={{ y: [0, 30, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[30%] left-[10%] w-48 h-64 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-[2rem] blur-xl border border-white/5"
            />
        </motion.div>
    )
}
