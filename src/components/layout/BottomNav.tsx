"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calendar, BarChart2, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import AddTransactionModal from "@/components/transaction/AddTransactionModal";

interface NavItem {
    href?: string;
    label: string;
    icon: React.ElementType;
    isFab?: boolean;
}

const navItems: NavItem[] = [
    { href: "/dashboard", label: "Buku", icon: BookOpen },
    { href: "/calendar", label: "Kalender", icon: Calendar },
    { label: "Tambah", icon: Plus, isFab: true },
    { href: "/analytics", label: "Analisis", icon: BarChart2 },
    { href: "/more", label: "Lainnya", icon: MoreHorizontal },
];

export default function BottomNav() {
    const pathname = usePathname() || "";
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <>
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#fdf8f0] via-[#fdf8f0]/90 to-transparent pointer-events-none z-30" />
            <div className="md:hidden fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
                <nav className="flex items-center justify-between px-2 py-1.5 rounded-3xl shadow-[0_12px_40px_rgba(163,124,246,0.4)] w-full max-w-[500px] pointer-events-auto transition-all bg-gradient-to-br from-[#b38cf8] via-[#a37cf6] to-[#8f5ef5] border border-[#b38cf8]/30">
                    <div className="flex w-full justify-between items-center relative h-[48px]">
                        
                        {navItems.map((item, index) => {
                            if (item.isFab) {
                                return (
                                    <div key="add-fab" className="w-[64px] flex justify-center relative z-20 group">
                                        <div className="absolute bottom-[-8px] w-[64px] h-[64px] flex items-center justify-center bg-[#fdf8f0] rounded-full transition-transform duration-300 group-hover:-translate-y-1">
                                            <button
                                                onClick={() => setModalOpen(true)}
                                                className="w-[46px] h-[46px] rounded-full flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 active:scale-90 hover:rotate-90 text-white shadow-[0_8px_20px_rgba(192,132,252,0.6)]"
                                                style={{ background: "linear-gradient(135deg, #c084fc, #f9a8d4)" }}
                                            >
                                                <Plus size={24} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            const href = item.href || "#";
                            const active = pathname.startsWith(href);
                            const Icon = item.icon;

                            return (
                                <Link 
                                    key={href} 
                                    href={href} 
                                    className="flex flex-col items-center justify-center w-[64px] gap-[2px] transition-all duration-300 ease-out hover:-translate-y-1 active:scale-95 group"
                                >
                                    <Icon 
                                        size={22} 
                                        strokeWidth={active ? 2.5 : 2} 
                                        className={`transition-colors duration-300 ${active ? "text-white drop-shadow-md" : "text-white/60 group-hover:text-white/90"}`} 
                                    />
                                    <span 
                                        className={`text-[11px] transition-all duration-300 ${active ? "font-bold text-white drop-shadow-md" : "font-medium text-white/60 group-hover:text-white/90"} leading-tight`}
                                    >
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                        
                    </div>
                </nav>
            </div>

            <AddTransactionModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </>
    );
}