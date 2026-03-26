"use client";
import { useState, useEffect } from "react";
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
} from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatRupiah, getCat } from "@/lib/utils";
import TransactionDetailModal from "@/components/transaction/TransactionDetailModal";
import AddTransactionModal from "@/components/transaction/AddTransactionModal";
import { supabase } from "@/lib/supabase";

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    
    // States Fetching Data Supabase
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedTx, setSelectedTx] = useState<any | null>(null);
    const [editingTx, setEditingTx] = useState<any | null>(null);
    
    // State untuk Tab Filter Transaksi
    const [txFilter, setTxFilter] = useState<"expense" | "income" | "all">("all");

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const allDays = eachDayOfInterval({ start: calStart, end: calEnd });

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    // Fetch data dari Supabase setiap kali bulannya berganti
    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            // Ambil transaksi dengan batasan calStart dan calEnd agar titik kalender akurat
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', format(calStart, 'yyyy-MM-dd'))
                .lte('date', format(calEnd, 'yyyy-MM-dd'));

            if (error) throw error;
            
            const formatted = (data || []).map((t: any) => ({
                ...t,
                date: new Date(t.date)
            }));
            setTransactions(formatted);
        } catch (error) {
            console.error("Gagal fetch data kalender:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
        const handleRefresh = () => fetchTransactions();
        window.addEventListener("refresh-transactions", handleRefresh);
        return () => window.removeEventListener("refresh-transactions", handleRefresh);
    }, [currentMonth]);

    // Helpers untuk membaca transaksi lokal
    const getTxForDate = (date: Date) => transactions.filter((t) => isSameDay(new Date(t.date), date));
    const hasTx = (date: Date) => transactions.some((t) => isSameDay(new Date(t.date), date));
    const hasIncome = (date: Date) => transactions.some((t) => isSameDay(new Date(t.date), date) && t.type === "income");
    const hasExpense = (date: Date) => transactions.some((t) => isSameDay(new Date(t.date), date) && t.type === "expense");

    const selectedTxList = selectedDate ? getTxForDate(selectedDate) : [];
    const filteredTxList = selectedTxList.filter(tx => txFilter === "all" || tx.type === txFilter);

    const monthIncome = transactions
        .filter(t => isSameMonth(new Date(t.date), currentMonth) && t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
    const monthExpense = transactions
        .filter(t => isSameMonth(new Date(t.date), currentMonth) && t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in">
            
            {/* Calendar Card (Single Card Layout) */}
            <div className="mx-4 rounded-[2.5rem] p-6 bg-white shadow-sm border border-purple-50">
                
                {/* Header Kalender */}
                <div className="flex items-center justify-between mb-6 px-1">
                    <button onClick={prevMonth} className="p-2.5 hover:bg-purple-50 rounded-2xl transition-colors text-purple-500">
                        <ChevronLeft size={22} strokeWidth={3} />
                    </button>
                    <h2 className="text-lg font-black text-purple-900 capitalize tracking-wide">
                        {format(currentMonth, "MMMM yyyy", { locale: id })}
                    </h2>
                    <button onClick={nextMonth} className="p-2.5 hover:bg-purple-50 rounded-2xl transition-colors text-purple-500">
                        <ChevronRight size={22} strokeWidth={3} />
                    </button>
                </div>

                {/* Nama Hari */}
                <div className="grid grid-cols-7 mb-4 pb-3 border-b border-purple-100">
                    {HARI.map((h, i) => (
                        <div key={h} className={`text-center text-[11px] sm:text-xs font-black uppercase tracking-wider ${i === 0 ? 'text-rose-500' : 'text-purple-500'}`}>
                            {h}
                        </div>
                    ))}
                </div>

                {/* Grid Tanggal dengan Indikator Loading / Supabase */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="animate-spin text-purple-300" size={36} />
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-y-3">
                        {allDays.map((day) => {
                            const inMonth = isSameMonth(day, currentMonth);
                            const selected = selectedDate ? isSameDay(day, selectedDate) : false;
                            const isTodayDate = isToday(day);
                            const hasAnyTx = hasTx(day);
                            const incDot = hasIncome(day);
                            const expDot = hasExpense(day);
                            const isSunday = day.getDay() === 0;

                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => inMonth && setSelectedDate(isSameDay(day, selectedDate ?? new Date(0)) ? null : day)}
                                    disabled={!inMonth}
                                    className={`relative flex items-center justify-center w-10 h-10 mx-auto rounded-full transition-all ${
                                        selected 
                                            ? 'bg-purple-600 shadow-md shadow-purple-200 hover:bg-purple-700' 
                                            : isTodayDate 
                                                ? 'bg-purple-100 hover:bg-purple-200' 
                                                : inMonth 
                                                    ? 'hover:bg-purple-50' 
                                                    : 'opacity-40 cursor-not-allowed'
                                    }`}
                                >
                                    <span className={`text-sm ${selected ? 'font-extrabold text-white' : isTodayDate ? 'font-extrabold text-purple-700' : isSunday ? 'font-bold text-rose-500' : inMonth ? 'font-bold text-purple-900' : 'font-medium text-purple-300'}`}>
                                        {format(day, "d")}
                                    </span>
                                    {/* Titik indikator transaksi dari Supabase */}
                                    {!selected && inMonth && hasAnyTx && (
                                        <div className="absolute bottom-1 flex gap-1">
                                            {incDot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />}
                                            {expDot && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm" />}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Segmented Control (Tabs) */}
                <div className="flex rounded-2xl p-1.5 mt-8 bg-purple-50/80 border border-purple-100">
                    {[
                        { id: "expense", label: "Pengeluaran" },
                        { id: "income", label: "Pemasukan" },
                        { id: "all", label: "Semua" }
                    ].map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setTxFilter(tab.id as any)}
                            className={`flex-1 py-2.5 text-[11px] sm:text-xs font-black rounded-xl transition-all ${
                                txFilter === tab.id 
                                    ? 'bg-white text-purple-700 shadow-sm border border-purple-100/50' 
                                    : 'text-purple-400 hover:text-purple-600 hover:bg-purple-100/50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Monthly Summary */}
                <div className="grid grid-cols-3 gap-0 mt-8 pt-6 border-t border-purple-100 divide-x divide-purple-100">
                    <div className="flex flex-col items-center px-2">
                        <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1.5">Pemasukan</p>
                        <p className="text-[11px] sm:text-xs font-black text-emerald-600 truncate w-full text-center">
                            {formatRupiah(monthIncome)}
                        </p>
                    </div>
                    <div className="flex flex-col items-center px-2">
                        <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1.5">Pengeluaran</p>
                        <p className="text-[11px] sm:text-xs font-black text-rose-600 truncate w-full text-center">
                            {formatRupiah(monthExpense)}
                        </p>
                    </div>
                    <div className="flex flex-col items-center px-2">
                        <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1.5">Sisa Saldo</p>
                        <p className="text-[11px] sm:text-xs font-black text-purple-900 truncate w-full text-center">
                            {formatRupiah(monthIncome - monthExpense)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Selected Date Detail */}
            {selectedDate && (
                <div className="mx-4 flex flex-col gap-4 mt-2">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-black uppercase tracking-wider text-purple-500">
                            {format(selectedDate, "EEEE, d MMM yyyy", { locale: id })}
                        </h3>
                        <span className="text-xs font-extrabold bg-purple-100 text-purple-600 px-3 py-1 rounded-xl">
                            {filteredTxList.length} Transaksi
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="rounded-[2.5rem] py-10 flex justify-center bg-white border border-purple-50 shadow-sm">
                            <Loader2 className="animate-spin text-purple-300" size={28} />
                        </div>
                    ) : filteredTxList.length === 0 ? (
                        <div className="rounded-[2.5rem] p-10 text-center bg-white border border-purple-50 shadow-sm">
                            <p className="text-sm font-bold text-purple-300 italic">
                                Tidak ada data yang sesuai filter 🐾
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {filteredTxList.map((tx) => {
                                const cat = getCat(tx.category);
                                const Icon = cat.icon;
                                return (
                                    <div 
                                        key={tx.id}
                                        onClick={() => setSelectedTx(tx)}
                                        className="rounded-[2rem] px-5 py-4 flex items-center gap-4 cursor-pointer bg-white shadow-sm border border-purple-50 hover:shadow-md active:scale-95 transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: cat.color + "20", color: cat.color }}>
                                            <Icon size={22} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-base truncate text-purple-900">
                                                {cat.label}
                                            </p>
                                            {tx.note && (
                                                <p className="text-xs font-bold mt-1 truncate text-purple-400">
                                                    {tx.note}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-base font-black shrink-0"
                                            style={{ color: tx.type === "income" ? "#10b981" : "#f43f5e" }}>
                                            {tx.type === "income" ? "+" : "-"}{formatRupiah(tx.amount)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <TransactionDetailModal 
                open={!!selectedTx} 
                onClose={() => setSelectedTx(null)} 
                transaction={selectedTx} 
                onEdit={() => {
                    setEditingTx(selectedTx);
                    setSelectedTx(null);
                }}
            />

            <AddTransactionModal 
                open={!!editingTx} 
                onClose={() => setEditingTx(null)} 
                initialData={editingTx} 
            />
        </div>
    );
}