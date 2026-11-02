'use client'

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getLiveActivityStream } from '@/lib/service/activity-stream';

export function QuantumHero() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    // Mouse Parallax for "3D floating" effect
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const mouseX = useTransform(() => mousePos.x);
    const mouseY = useTransform(() => mousePos.y);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        setMousePos({
            x: (clientX / innerWidth) - 0.5,
            y: (clientY / innerHeight) - 0.5
        });
    };

    // Live Activity Stream State
    const [activities, setActivities] = useState<string[]>([
        "Verified Buyer in Mumbai just purchased Silk Midi Dress",
        "Shopper in Bangalore added Denim Trench to cart",
        "Someone in Delhi purchased Classic White Poplin Shirt"
    ]);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const stream = await getLiveActivityStream();
                if (stream && stream.length > 0) {
                    const messages = stream.map(s => {
                        if (s.type === 'purchase') return `${s.user_location} just purchased ${s.product_name}`;
                        return `${s.user_location} is viewing ${s.product_name}`;
                    });
                    setActivities(messages);
                }
            } catch (e) {
                console.error("Failed to fetch live activity", e);
            }
        };

        fetchActivity();
        const interval = setInterval(fetchActivity, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section ref={ref} className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden bg-[#0f172a] text-white" onMouseMove={handleMouseMove}>
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0f172a] to-[#0b1021]" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            {/* Floating Elements */}
            <FloatingElements mouseX={mouseX} mouseY={mouseY} />

            {/* Main Content */}
            <motion.div style={{ y, opacity }} className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-[-10vh]">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-6">
                    <Sparkles className="w-4 h-4" />
                    <span>Curated Premium Fashion</span>
                </motion.div>

                <h1 className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-indigo-200/50 mb-6 font-serif">
                    Fashion from the <br /> <span className="text-indigo-400">Future.</span>
                </h1>

                <p className="text-lg md:text-xl text-indigo-200/60 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Explore curated collections crafted for comfort, style, and effortless confidence.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link href="/shop">
                        <Button size="lg" className="h-14 px-8 rounded-full bg-white text-[#0f172a] hover:bg-indigo-50 text-lg font-medium transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            Start Exploring <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                    <Link href="/about">
                        <Button variant="ghost" size="lg" className="h-14 px-8 rounded-full text-indigo-200 hover:text-white hover:bg-white/5 text-lg">
                            Our Story
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Live Social Ticker */}
            <div className="absolute bottom-10 left-0 right-0 overflow-hidden py-4 border-y border-indigo-500/10 bg-[#0f172a]/40 backdrop-blur-md z-20">
                <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                    className="flex items-center w-max"
                >
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

function TickerItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 px-8 text-xs font-medium tracking-wide text-indigo-200/80 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{text}</span>
        </div>
    )
}
