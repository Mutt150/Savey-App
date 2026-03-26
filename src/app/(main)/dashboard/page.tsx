"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import SummaryCards from "../../../components/dashboard/SummaryCards";
import TransactionList from "../../../components/dashboard/TransactionList";
import type { Transaction } from "../../../components/dashboard/TransactionList";
import { Receipt, Sparkles, TrendingUp, AlertCircle, Loader2, Lightbulb } from "lucide-react";
import { getCat } from "../../../lib/utils";
import { supabase } from "../../../lib/supabase"; 
import { useSearchParams } from "next/navigation";

function DashboardContent() {
    const searchParams = useSearchParams();
    const query = searchParams ? searchParams.get("q")?.toLowerCase() || "" : "";
    const monthParam = searchParams ? searchParams.get("month") : null;

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    
    const [aiTip, setAiTip] = useState({ text: "Menganalisis keuanganmu...", icon: Sparkles as any, color: "#a855f7" });
    const [isLoadingInsight, setIsLoadingInsight] = useState(true);

    const fetchTransactions = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoadingData(false);
                return;
            }

            // Mengatur rentang waktu dengan format YYYY-MM-DD lokal agar tidak meleset zona waktu (UTC)
            const targetDate = monthParam ? new Date(`${monthParam}-01T00:00:00`) : new Date();
            const yyyy = targetDate.getFullYear();
            const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
            const lastDay = new Date(yyyy, targetDate.getMonth() + 1, 0).getDate();
            
            const startOfMonth = `${yyyy}-${mm}-01`;
            const endOfMonth = `${yyyy}-${mm}-${lastDay}`;

            // Fetch dari Supabase dengan filter tanggal yang akurat
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', startOfMonth)
                .lte('date', endOfMonth)
                .order('created_at', { ascending: false })
                .order('date', { ascending: false });

            if (error) throw error;

            const formattedData = data.map((item: any) => ({
                id: item.id,
                type: item.type,
                amount: item.amount,
                category: item.category,
                date: new Date(item.date),
                note: item.note,
                account: item.account
            })) as Transaction[];

            setTransactions(formattedData);
        } catch (error) {
            console.error("Gagal mengambil data transaksi:", error);
        } finally {
            setIsLoadingData(false);
        }
    }, [monthParam]);

    useEffect(() => {
        fetchTransactions();
        const handleRefresh = () => fetchTransactions();
        window.addEventListener("refresh-transactions", handleRefresh);
        return () => window.removeEventListener("refresh-transactions", handleRefresh);
    }, [fetchTransactions]);

    const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    // Fetch AI Insight
    useEffect(() => {
        const fetchAIInsight = async () => {
            if (income === 0 && expense === 0 && !isLoadingData) {
                setAiTip({ text: "Belum ada transaksi di bulan ini. Catat pengeluaran pertamamu untuk melihat analisis AI!", icon: Lightbulb, color: "#a855f7" });
                setIsLoadingInsight(false);
                return;
            }

            setIsLoadingInsight(true);
            try {
                const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
                if (!apiKey) throw new Error("API Key tidak ditemukan di environment.");

                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
                
                const dataKeuangan = {
                    pemasukan: income,
                    pengeluaran: expense,
                    transaksiTerbaru: transactions.slice(0, 10).map(t => ({
                        // Menggunakan getCat agar kategori kustom terbaca namanya oleh AI (bukan nampil ID custom_123)
                        kategori: getCat(t.category).label,
                        tipe: t.type,
                        nominal: t.amount
                    }))
                };

                const persona = localStorage.getItem("savey_ai_persona") || "ramah";
                let personaPrompt = "ramah, suportif, dan memberi semangat";
                if (persona === "sarkas") {
                    personaPrompt = "galak, sarkastik, ceplas-ceplos, suka menyindir, dan memarahi dengan gaya lucu (roasting) jika pengguna terlalu boros pengeluarannya";
                } else if (persona === "profesional") {
                    personaPrompt = "sangat profesional, kaku, formal, tanpa basa-basi, dan sangat analitis ala konsultan keuangan";
                }

                const prompt = `
                    Kamu adalah Savey, asisten keuangan pribadi yang ${personaPrompt}.
                    Berikut adalah ringkasan keuangan user bulan ini: ${JSON.stringify(dataKeuangan)}.
                    Berikan 1 kalimat insight/saran singkat (maksimal 15 kata) tentang kondisi keuangannya, pastikan gaya bahasamu mencerminkan kepribadianmu yang ${personaPrompt}.
                    Format balasan WAJIB berupa JSON persis seperti ini:
                    {
                        "text": "kalimat insightmu",
                        "status": "warning" | "positive" | "neutral"
                    }
                `;

                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });

                if (!response.ok) {
                    throw new Error(`Gagal fetch Gemini: ${response.status}`);
                }

                const data = await response.json();
                let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (!textResult) throw new Error("Hasil AI kosong dari Google");
                
                // Membersihkan markdown backticks dari Gemini agar JSON bisa di-parse tanpa error
                textResult = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(textResult);

                let icon = Sparkles;
                let color = "#a855f7";
                
                if (parsed.status === "warning") { icon = AlertCircle; color = "#f43f5e"; }
                else if (parsed.status === "positive") { icon = TrendingUp; color = "#10b981"; }

                setAiTip({ text: parsed.text, icon, color });
            } catch (error) {
                console.error("🔥 Error AI Insight:", error);
                setAiTip({ text: "Pengeluaran terpantau aman. Pantau terus arus kas kamu!", icon: Sparkles, color: "#a855f7" });
            } finally {
                setIsLoadingInsight(false);
            }
        };

        if (!query && !isLoadingData) fetchAIInsight();
    }, [income, expense, query, isLoadingData, transactions]);

    const filteredTransactions = query 
        ? transactions.filter(t => {
            // Fitur Search sekarang mendukung kategori kustom
            const catLabel = getCat(t.category).label.toLowerCase();
            return t.note?.toLowerCase().includes(query) || catLabel.includes(query) || t.amount.toString().includes(query);
          })
        : transactions;

    return (
        <div className="animate-in fade-in duration-300">
            {!query && (
                <div className="px-4 pt-4 pb-0">
                    <div className="rounded-2xl p-3 flex items-start gap-3 bg-white" style={{ border: `1px solid ${aiTip.color}30`, boxShadow: "0 2px 8px rgba(192,132,252,0.05)" }}>
                        <div className="p-1.5 rounded-xl shrink-0" style={{ backgroundColor: `${aiTip.color}15`, color: aiTip.color }}>
                            {isLoadingInsight ? <Loader2 size={18} className="animate-spin" /> : <aiTip.icon size={18} strokeWidth={2.5} />}
                        </div>
                        <div>
                            <p className="text-xs font-extrabold" style={{ color: aiTip.color }}>AI Insight</p>
                            <p className="text-[11px] font-semibold mt-0.5 leading-snug" style={{ color: "#6b7280" }}>{aiTip.text}</p>
                        </div>
                    </div>
                </div>
            )}

            {!query && <SummaryCards balance={income - expense} income={income} expense={expense} />}

            <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <h2 className="text-sm font-extrabold flex items-center gap-2" style={{ color: "#4c1d95" }}>
                    <Receipt size={16} className="text-purple-500" /> 
                    {query ? `Hasil Pencarian: "${query}"` : "Transaksi Bulan Ini"}
                </h2>
                {!query && transactions.length > 0 && (
                    <a href="/calendar" className="text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:bg-purple-200" style={{ color: "#7c3aed", backgroundColor: "#f3e8ff" }}>Lihat Semua</a>
                )}
            </div>

            {isLoadingData ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin text-purple-400" size={32} /></div>
            ) : transactions.length === 0 && !query ? (
                <div className="text-center py-10 px-4">
                    <p className="text-sm font-bold text-purple-400">Belum ada transaksi di bulan ini.</p>
                </div>
            ) : filteredTransactions.length === 0 && query ? (
                // Tampilan kosong saat data tidak ditemukan di pencarian (Search)
                <div className="text-center py-10 px-4">
                    <p className="text-sm font-bold text-purple-400">Tidak ada transaksi yang cocok dengan "{query}".</p>
                </div>
            ) : (
                <TransactionList transactions={filteredTransactions} />
            )}
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center py-10">
                <Loader2 className="animate-spin text-purple-400" size={32} />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}