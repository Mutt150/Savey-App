"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PiggyBank, BookOpen, Calendar, BarChart2, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import AddTransactionModal from "@/components/transaction/AddTransactionModal";

export default function Sidebar() {
    const pathname = usePathname();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const navItems = [
        { href: "/dashboard", label: "Buku", icon: BookOpen },
        { href: "/calendar", label: "Kalender", icon: Calendar },
        { href: "/analytics", label: "Analisis", icon: BarChart2 },
        { href: "/more", label: "Lainnya", icon: MoreHorizontal },
    ];

    return (
        <>
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-purple-100 shadow-[4px_0_24px_rgba(203,170,203,0.1)] z-10 rounded-r-3xl my-2">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#f3e8ff] rounded-2xl flex items-center justify-center text-[#7c3aed] shadow-sm">
                        <PiggyBank size={24} />
                    </div>
                    <h1 className="text-xl font-extrabold bg-gradient-to-r from-[#c084fc] to-[#f9a8d4] bg-clip-text text-transparent">
                        Savey
                    </h1>
                </div>
                
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const active = pathname.startsWith(href);
                        return (
                            <Link 
                                key={href} 
                                href={href} 
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-bold ${
                                    active ? 'bg-[#f3e8ff] text-[#7c3aed]' : 'text-[#9ca3af] hover:bg-purple-50 hover:text-[#c084fc]'
                                }`}
                            >
                                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                                <span>{label}</span>
                                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4">
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 text-white font-extrabold py-3 rounded-2xl shadow-[0_4px_14px_rgba(192,132,252,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: "linear-gradient(135deg, #c084fc, #f9a8d4)" }}
                    >
                        <Plus size={20} strokeWidth={2.5} /> Tambah Transaksi
                    </button>
                </div>
            </aside>
            
            <AddTransactionModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        </>
    );
}