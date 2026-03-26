"use client";
import { useEffect, useState, Suspense } from "react";
import { formatRupiah, getCat } from "@/lib/utils";
import { ArrowLeft, Printer, Wallet, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";

function ReportPreviewContent() {
    const searchParams = useSearchParams();
    const monthParam = searchParams ? searchParams.get("month") : null;

    const [isLoading, setIsLoading] = useState(true);
    const [reportData, setReportData] = useState<any>(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                let query = supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: true });
                
                // Set rentang tanggal sesuai bulan
                const targetDate = monthParam ? new Date(`${monthParam}-01T00:00:00`) : new Date();
                const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString();
                const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
                
                query = query.gte('date', startOfMonth).lte('date', endOfMonth);

                const { data: txs } = await query;
                
                let inc = 0; let exp = 0;
                const byCat: Record<string, {amount: number, type: string}> = {};
                
                (txs || []).forEach(tx => {
                    if (tx.type === 'income') inc += tx.amount;
                    if (tx.type === 'expense') exp += tx.amount;
                    
                    if (!byCat[tx.category]) byCat[tx.category] = { amount: 0, type: tx.type };
                    byCat[tx.category].amount += tx.amount;
                });
                
                // Konversi ke array dan urutkan berdasarkan nominal terbesar
                const catArray = Object.keys(byCat).map(id => ({ id, amount: byCat[id].amount, type: byCat[id].type }));
                catArray.sort((a, b) => b.amount - a.amount);

                setReportData({
                    period: `1 - ${new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate()} ${targetDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`,
                    generated: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                    user: user.user_metadata?.full_name || "User Savey",
                    summary: { income: inc, expense: exp },
                    byCategory: catArray,
                    transactions: txs || []
                });
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReport();
    }, [monthParam]);

    if (isLoading || !reportData) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f3e8ff" }}>
                <Loader2 size={32} className="animate-spin text-purple-500" />
            </div>
        );
    }

    const { summary, transactions, byCategory, period, generated, user } = reportData;
    const balance = summary.income - summary.expense;

    return (
        <div className="min-h-screen py-8 px-4" style={{ backgroundColor: "#f3e8ff" }}>
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <button onClick={() => window.history.back()} className="w-10 h-10 rounded-2xl bg-white text-purple-600 flex items-center justify-center shadow-sm border border-purple-100 hover:bg-purple-50 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <button onClick={() => window.print()} className="px-5 py-2.5 rounded-2xl text-white font-extrabold text-sm flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg, #c084fc, #a78bfa)" }}>
                        <Printer size={16} /> Cetak / PDF
                    </button>
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
                    <div className="p-8 pb-0">
                        <div className="flex justify-between items-start border-b-2 border-dashed border-purple-100 pb-6 mb-6">
                            <div>
                                <h1 className="text-3xl font-black mb-1" style={{ color: "#3b0764", letterSpacing: "-0.02em" }}>Savey<span style={{ color: "#c084fc" }}>.</span></h1>
                                <p className="text-sm font-extrabold" style={{ color: "#c084fc" }}>Laporan Keuangan Pribadi</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold mb-1" style={{ color: "#9ca3af" }}>PERIODE</p>
                                <p className="text-sm font-extrabold" style={{ color: "#4c1d95" }}>{period}</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-8 p-4 rounded-2xl bg-[#faf5ff] border border-purple-50">
                            <div>
                                <p className="text-xs font-bold" style={{ color: "#9ca3af" }}>NAMA PENGGUNA</p>
                                <p className="text-base font-extrabold" style={{ color: "#4c1d95" }}>{user}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold" style={{ color: "#9ca3af" }}>TANGGAL DIBUAT</p>
                                <p className="text-sm font-extrabold" style={{ color: "#c084fc" }}>{generated}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-5 rounded-3xl" style={{ backgroundColor: "#f0fdf4", border: "1px solid #dcfce7" }}>
                                <p className="text-xs font-bold mb-1" style={{ color: "#166534" }}>TOTAL PEMASUKAN</p>
                                <p className="text-xl font-black" style={{ color: "#15803d" }}>{formatRupiah(summary.income)}</p>
                            </div>
                            <div className="p-5 rounded-3xl" style={{ backgroundColor: "#fff1f2", border: "1px solid #ffe4e6" }}>
                                <p className="text-xs font-bold mb-1" style={{ color: "#9f1239" }}>TOTAL PENGELUARAN</p>
                                <p className="text-xl font-black" style={{ color: "#be123c" }}>{formatRupiah(summary.expense)}</p>
                            </div>
                        </div>

                        <div className="mb-8 p-6 rounded-3xl text-center" style={{ background: "linear-gradient(135deg, #c084fc, #a78bfa)" }}>
                            <p className="text-xs font-bold text-white/80 mb-1 flex items-center justify-center gap-1.5"><Wallet size={14}/> SISA SALDO BERSIH PERIODE INI</p>
                            <p className="text-4xl font-black text-white">{formatRupiah(balance)}</p>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-sm font-extrabold mb-3 flex items-center gap-2" style={{ color: "#4c1d95" }}>
                                <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: "#c084fc" }} />
                                RINCIAN PER KATEGORI
                            </h2>
                            {byCategory.length === 0 ? (
                                <div className="text-center py-6 text-xs font-bold text-purple-400">Belum ada data kategori di periode ini.</div>
                            ) : (
                                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #f3e8ff" }}>
                                    {byCategory.map((cat: any, i: number) => {
                                        // Gunakan getCat agar Kategori Kustom bisa ter-render warna dan namanya dengan benar
                                        const catData = getCat(cat.id);
                                        const Icon = catData.icon;
                                        return (
                                            <div key={i} className="flex justify-between items-center p-4 border-b last:border-0 border-[#f3e8ff]" style={{ backgroundColor: i % 2 === 0 ? "white" : "#faf5ff" }}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: catData.color + "20", color: catData.color }}><Icon size={14} strokeWidth={2.5}/></div>
                                                    <div>
                                                        <p className="text-sm font-bold" style={{ color: "#3b0764" }}>{catData.label}</p>
                                                        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#9ca3af" }}>{cat.type === "expense" ? "Pengeluaran" : "Pemasukan"}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-extrabold" style={{ color: cat.type === "expense" ? "#f43f5e" : "#10b981" }}>
                                                    {cat.type === "expense" ? "-" : "+"}{formatRupiah(cat.amount)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div>
                            <h2 className="text-sm font-extrabold mb-3 flex items-center gap-2" style={{ color: "#4c1d95" }}>
                                <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: "#c084fc" }} />
                                DETAIL TRANSAKSI
                            </h2>
                            {transactions.length === 0 ? (
                                <div className="text-center py-6 text-xs font-bold text-purple-400">Belum ada transaksi di periode ini.</div>
                            ) : (
                                <div className="rounded-2xl overflow-x-auto" style={{ border: "1px solid #f3e8ff" }}>
                                    <table className="w-full text-left border-collapse min-w-[450px]">
                                        <thead>
                                            <tr style={{ backgroundColor: "#f3e8ff" }}>
                                                <th className="px-4 py-3 text-xs font-extrabold" style={{ color: "#7c3aed" }}>TANGGAL</th>
                                                <th className="px-4 py-3 text-xs font-extrabold" style={{ color: "#7c3aed" }}>CATATAN & KATEGORI</th>
                                                <th className="px-4 py-3 text-xs font-extrabold text-right" style={{ color: "#7c3aed" }}>NOMINAL</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((tx: any, i: number) => {
                                                const catData = getCat(tx.category);
                                                return (
                                                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "white" : "#faf5ff" }}>
                                                        <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: "#9ca3af" }}>{new Date(tx.date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'})}</td>
                                                        <td className="px-4 py-3 text-xs">
                                                            <p className="font-extrabold truncate max-w-[180px]" style={{ color: "#4c1d95" }}>{tx.note || catData.label}</p>
                                                            <p className="font-semibold text-[10px]" style={{ color: "#c084fc" }}>{catData.label} • {tx.account.toUpperCase()}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-extrabold text-right whitespace-nowrap" style={{ color: tx.type === "expense" ? "#f43f5e" : "#10b981" }}>
                                                            {tx.type === "expense" ? "-" : "+"}{formatRupiah(tx.amount)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="bg-[#faf5ff] p-6 text-center mt-8 border-t border-purple-100">
                        <p className="text-xs font-bold" style={{ color: "#c084fc" }}>Laporan dihasilkan secara otomatis oleh Savey App.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ReportPreviewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f3e8ff" }}>
                <Loader2 size={32} className="animate-spin text-purple-500" />
            </div>
        }>
            <ReportPreviewContent />
        </Suspense>
    );
}