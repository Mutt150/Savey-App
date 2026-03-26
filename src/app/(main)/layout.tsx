"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace("/login");
            } else {
                setIsLoading(false);
            }
        };
        
        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                router.replace("/login");
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [router]);

    if (isLoading) {
        return <div className="flex h-screen w-full items-center justify-center bg-[#fdf8f0]">Memuat...</div>;
    }

    return (
        <div className="flex h-screen w-full bg-[#fdf8f0] text-slate-700 font-sans selection:bg-pink-200 overflow-hidden">
            <Sidebar />

            <main className="flex-1 flex flex-col relative h-full w-full max-w-2xl mx-auto md:max-w-none md:mx-0 bg-[#fdf8f0] overflow-y-auto overflow-x-hidden">
                <TopBar />
                
                <div className="pb-32 flex-1">
                    {children}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}