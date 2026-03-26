"use client";
import { Bell, Search, Wallet, ChevronDown, X, Sparkles, AlertTriangle, Calendar, Info } from "lucide-react";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

function TopBarContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const query = searchParams ? searchParams.get("q") || "" : "";
    const monthParam = searchParams ? searchParams.get("month") : null;

    const [userName, setUserName] = useState("User"); 
    const [selectedMonth, setSelectedMonth] = useState(monthParam ? new Date(`${monthParam}-01T00:00:00`) : new Date());
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showNotif, setShowNotif] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchText, setSearchText] = useState(query);
    const pickerRef = useRef<HTMLDivElement>(null);

    const fetchUserName = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const fullName = user.user_metadata?.full_name || "User";
            setUserName(fullName.split(" ")[0]);
        }
    };

    useEffect(() => {
        fetchUserName();
        const handleProfileUpdate = () => fetchUserName();
        window.addEventListener("savey_profile_updated", handleProfileUpdate);
        return () => window.removeEventListener("savey_profile_updated", handleProfileUpdate);
    }, []);

    // Sinkronisasi state internal dengan URL
    useEffect(() => {
        if (monthParam) setSelectedMonth(new Date(`${monthParam}-01T00:00:00`));
        else setSelectedMonth(new Date());
    }, [monthParam]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowMonthPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchText(val);
        
        const currentParams = new URLSearchParams(searchParams?.toString() || "");
        if (val) currentParams.set("q", val);
        else currentParams.delete("q");
        
        router.push(`${pathname}?${currentParams.toString()}`);
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + offset, 1);
        setSelectedMonth(newDate);
        setShowMonthPicker(false);
        
        const yyyy = newDate.getFullYear();
        const mm = String(newDate.getMonth() + 1).padStart(2, '0');
        const currentParams = new URLSearchParams(searchParams?.toString() || "");
        currentParams.set("month", `${yyyy}-${mm}`);
        router.push(`${pathname}?${currentParams.toString()}`);
    };

    const resetToCurrentMonth = () => {
        const newDate = new Date();
        setSelectedMonth(newDate);
        setShowMonthPicker(false);
        
        const currentParams = new URLSearchParams(searchParams?.toString() || "");
        currentParams.delete("month");
        router.push(`${pathname}?${currentParams.toString()}`);
    };

    // Dummy Notifikasi untuk UI
    const notifications = [
        { id: 1, title: "Anggaran Hampir Habis", desc: "Sisa anggaran Makanan sisa 10%", type: "warning" },
        { id: 2, title: "Laporan Tersedia", desc: "Ringkasan bulan lalu siap dilihat", type: "info" }
    ];

    const currentMonthString = selectedMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    const isCurrentMonth = new Date().getMonth() === selectedMonth.getMonth() && new Date().getFullYear() === selectedMonth.getFullYear();

    return (
        <header className="px-4 pt-6 pb-2 sticky top-0 z-40 bg-[#fdf8f0]/90 backdrop-blur-md border-b border-purple-100">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-purple-100 flex items-center justify-center text-purple-600">
                        <Wallet size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-purple-400 tracking-wider uppercase">Halo, {userName}</p>
                        <div className="relative" ref={pickerRef}>
                            <button onClick={() => setShowMonthPicker(!showMonthPicker)} className="flex items-center gap-1.5 text-purple-900 font-black hover:opacity-70 transition-opacity">
                                {currentMonthString} <ChevronDown size={16} className={`text-purple-500 transition-transform ${showMonthPicker ? "rotate-180" : ""}`} />
                            </button>
                            
                            {showMonthPicker && (
                                <div className="absolute top-8 left-0 w-48 rounded-2xl p-2 bg-white shadow-2xl border border-purple-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex flex-col gap-1">
                                        <button onClick={() => changeMonth(-1)} className="p-3 text-sm font-bold text-purple-600 hover:bg-purple-50 rounded-xl text-left flex items-center gap-2">
                                            <Calendar size={14} /> Bulan Sebelumnya
                                        </button>
                                        {!isCurrentMonth && (
                                            <button onClick={resetToCurrentMonth} className="p-3 text-sm font-bold text-purple-600 hover:bg-purple-50 rounded-xl text-left flex items-center gap-2">
                                                <Sparkles size={14} /> Bulan Ini
                                            </button>
                                        )}
                                        <button onClick={() => changeMonth(1)} className="p-3 text-sm font-bold text-purple-600 hover:bg-purple-50 rounded-xl text-left flex items-center gap-2">
                                            <Calendar size={14} /> Bulan Berikutnya
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setShowSearch(!showSearch)} className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-white border border-purple-100 text-purple-500 shadow-sm hover:bg-purple-50">
                        {showSearch ? <X size={18} /> : <Search size={18} />}
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowNotif(!showNotif)} className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-white border border-purple-100 text-purple-500 shadow-sm hover:bg-purple-50 relative">
                            <Bell size={18} />
                            {notifications.length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white" />}
                        </button>
                        
                        {showNotif && (
                            <div className="absolute top-12 right-0 w-72 rounded-3xl p-4 bg-white shadow-2xl border border-purple-50 animate-in fade-in slide-in-from-top-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-extrabold text-purple-900 text-sm">Notifikasi</h3>
                                    <button onClick={() => setShowNotif(false)} className="text-purple-300 hover:text-purple-600"><X size={16}/></button>
                                </div>
                                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                    {notifications.map((n, i) => (
                                        <div key={i} className="p-3 rounded-2xl border border-purple-50 bg-[#fdf8f0]">
                                            <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: n?.type === "warning" ? "#f43f5e" : "#8b5cf6" }}>
                                                {n?.type === "warning" ? <AlertTriangle size={12}/> : n?.type === "info" ? <Info size={12}/> : <Sparkles size={12} />} 
                                                {n?.title}
                                            </p>
                                            <p className="text-[10px] font-semibold mt-0.5" style={{ color: n?.type === "warning" ? "#be185d" : "#7c3aed" }}>{n?.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showSearch && (
                <div className="mt-4 relative animate-in fade-in slide-in-from-top-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400"><Search size={16} /></span>
                    <input 
                        type="text" 
                        value={searchText}
                        onChange={handleSearch}
                        placeholder="Cari transaksi atau catatan..." 
                        className="w-full bg-white border border-purple-200 text-sm font-bold rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-purple-200/50 transition-all text-purple-900 shadow-sm"
                        autoFocus
                    />
                </div>
            )}
        </header>
    );
}

export default function TopBar() {
    return (
        <Suspense fallback={<header className="px-4 pt-6 pb-2 sticky top-0 z-40 bg-[#fdf8f0]/90 backdrop-blur-md border-b border-purple-100 min-h-[72px]"></header>}>
            <TopBarContent />
        </Suspense>
    );
}