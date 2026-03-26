"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ExportModal from "../../../components/more/ExportModal";
import ImportModal from "../../../components/more/ImportModal";
import { Download, Upload, Receipt, Settings, ChevronRight, Wallet, Users, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MorePage() {
    const router = useRouter();
    const [showExport, setShowExport] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            router.push("/login");
        } catch (error) {
            console.error("Gagal logout:", error);
            alert("Gagal keluar dari akun. Silakan coba lagi.");
            setIsLoggingOut(false);
        }
    };

    const menuItems = [
        {
            icon: Users,
            label: "Smart Split Bill",
            desc: "Bagi tagihan makan bareng teman via AI",
            color: "#e0e7ff",
            iconColor: "#4f46e5",
            action: () => router.push("/split-bill"),
        },
        {
            icon: Upload,
            label: "Ekspor Laporan",
            desc: "Download PDF atau Excel",
            color: "#f3e8ff",
            iconColor: "#7c3aed",
            action: () => setShowExport(true),
        },
        {
            icon: Download,
            label: "Import CSV",
            desc: "Upload data dari spreadsheet",
            color: "#d1fae5",
            iconColor: "#065f46",
            action: () => setShowImport(true),
        },
        {
            icon: Receipt,
            label: "Preview Laporan",
            desc: "Lihat laporan bergaya struk",
            color: "#fdf2f8",
            iconColor: "#9d174d",
            action: () => router.push("/report-preview"),
        },
        {
            icon: Settings,
            label: "Pengaturan",
            desc: "Profil & preferensi",
            color: "#faf5ff",
            iconColor: "#6d28d9",
            action: () => router.push("/settings"),
        },
        {
            icon: LogOut,
            label: isLoggingOut ? "Keluar..." : "Keluar",
            desc: "Log out dari akun Savey",
            color: "#fff1f2",
            iconColor: "#e11d48",
            action: handleLogout,
        },
    ];

    return (
        <div className="px-4 pt-5 pb-28 animate-in fade-in duration-300">
            <div className="rounded-3xl p-5 mb-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #c084fc 0%, #a78bfa 100%)", boxShadow: "0 8px 24px rgba(192,132,252,0.3)" }}>
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-xl" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/10 blur-xl" />
                
                <p className="text-white/80 text-xs font-bold flex items-center gap-1.5 relative z-10"><Wallet size={14}/> Savey</p>
                <p className="text-white text-xl font-extrabold mt-1 relative z-10">Pusat Fitur</p>
                <p className="text-white/70 text-xs font-semibold mt-1 relative z-10">Akses alat ekstra, pengaturan, dan ekspor datamu</p>
            </div>

            <div className="flex flex-col gap-3">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button key={item.label} onClick={item.action} disabled={isLoggingOut}
                            className="w-full rounded-3xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.99] text-left disabled:opacity-50"
                            style={{ backgroundColor: "white", boxShadow: "0 2px 12px rgba(192,132,252,0.1)" }}>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: item.color, color: item.iconColor }}>
                                <Icon size={24} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1">
                                <p className="font-extrabold text-sm" style={{ color: "#3b0764" }}>{item.label}</p>
                                <p className="text-xs font-semibold mt-0.5" style={{ color: "#c084fc" }}>{item.desc}</p>
                            </div>
                            <ChevronRight size={18} style={{ color: "#d8b4fe" }} />
                        </button>
                    );
                })}
            </div>

            <ExportModal open={showExport} onClose={() => setShowExport(false)} />
            <ImportModal open={showImport} onClose={() => setShowImport(false)} />
        </div>
    );
}