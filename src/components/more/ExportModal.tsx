"use client";
import { useEffect, useState } from "react";
import { X, FileText, CheckCircle, Upload, Folder, Table, Calendar, Tag, Eye, TrendingUp, TrendingDown, Loader, Download, Loader2 } from "lucide-react";
import { getAllCategories, getCat } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

function notifyModal(open: boolean) {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("modal-state", { detail: { open } }));
    }
}

type ExportFormat = "pdf" | "excel";

interface Props { 
    open: boolean; 
    onClose: () => void; 
}

export default function ExportModal({ open, onClose }: Props) {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    
    const [format, setFormat] = useState<ExportFormat>("pdf");
    const [selCats, setSelCats] = useState<string[]>([]);
    
    const [transactions, setTransactions] = useState<any[]>([]);
    const [catsList, setCatsList] = useState<any[]>([]);
    
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (open) {
            notifyModal(true);
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            setStartDate(firstDay.toISOString().split("T")[0]);
            setEndDate(lastDay.toISOString().split("T")[0]);
            
            setCatsList(getAllCategories());
            fetchTransactions();
        } else {
            notifyModal(false);
            setDone(false);
            setLoading(false);
            setTransactions([]);
            setSelCats([]);
        }
    }, [open]);

    const fetchTransactions = async () => {
        setIsLoadingData(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: true });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error("Gagal menarik data untuk ekspor:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    if (!open) return null;

    const toggleCat = (catId: string) => {
        setSelCats(prev => prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]);
    };

    const filtered = transactions.filter(t => {
        const inRange = (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate);
        const inCategory = selCats.length === 0 || selCats.includes(t.category);
        return inRange && inCategory;
    });

    const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    const handleExport = async () => {
        if (filtered.length === 0) {
            alert("Tidak ada transaksi pada rentang/filter yang dipilih.");
            return;
        }

        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            if (format === "excel") {
                await exportExcel(filtered);
            } else {
                await exportPDF(filtered, startDate, endDate, totalIncome, totalExpense);
            }
            
            setDone(true);
            setTimeout(() => { 
                setDone(false); 
                onClose(); 
            }, 2000);

        } catch (error) {
            console.error("Export error:", error);
            alert("Gagal mengekspor file! Pastikan library xlsx, jspdf, dan jspdf-autotable sudah terinstall.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(76,29,149,0.35)", backdropFilter: "blur(4px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-lg rounded-t-3xl flex flex-col animate-in slide-in-from-bottom-10" style={{ backgroundColor: "#fdf8f0", maxHeight: "90vh" }}>
                <div className="px-5 pt-5 pb-3 shrink-0">
                    <div className="w-10 h-1.5 rounded-full mx-auto mb-5" style={{ backgroundColor: "#e9d5ff" }} />
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-extrabold flex items-center" style={{ color: "#4c1d95" }}>
                            <Upload size={20} className="mr-2 text-purple-500" /> Ekspor Laporan
                        </h2>
                        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-purple-200" style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}>
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="px-5 pb-8 overflow-y-auto flex-1">
                    <p className="text-xs font-extrabold mb-2 px-1 flex items-center" style={{ color: "#6d28d9" }}><Folder size={14} className="mr-1.5" /> Format File</p>
                    <div className="flex gap-3 mb-5">
                        {(["pdf", "excel"] as const).map(f => (
                            <button key={f} onClick={() => setFormat(f)} className="flex-1 rounded-2xl p-3 border-2 transition-all text-left hover:scale-[1.02]"
                                style={{ backgroundColor: format === f ? "#faf5ff" : "white", borderColor: format === f ? "#c084fc" : "transparent", boxShadow: "0 2px 8px rgba(192,132,252,0.08)" }}>
                                <p className="font-extrabold text-sm flex items-center" style={{ color: "#4c1d95" }}>
                                    {f === "pdf" ? <FileText size={16} className="mr-1.5 text-purple-500" /> : <Table size={16} className="mr-1.5 text-emerald-500" />} {f.toUpperCase()}
                                </p>
                                <p className="text-xs font-semibold mt-0.5" style={{ color: "#c084fc" }}>{f === "pdf" ? "Dokumen Resmi" : "Spreadsheet .xlsx"}</p>
                            </button>
                        ))}
                    </div>

                    <p className="text-xs font-extrabold mb-2 px-1 flex items-center" style={{ color: "#6d28d9" }}><Calendar size={14} className="mr-1.5" /> Rentang Tanggal</p>
                    <div className="grid grid-cols-2 gap-2 mb-5">
                        {[{ label: "Dari", value: startDate, set: setStartDate }, { label: "Sampai", value: endDate, set: setEndDate }].map(({ label, value, set }) => (
                            <div key={label} className="rounded-2xl p-3" style={{ backgroundColor: "white", boxShadow: "0 2px 8px rgba(192,132,252,0.06)" }}>
                                <p className="text-xs font-bold mb-1" style={{ color: "#c084fc" }}>{label}</p>
                                <input type="date" value={value} onChange={e => set(e.target.value)} className="text-sm font-bold bg-transparent border-none outline-none w-full" style={{ color: "#4c1d95" }} />
                            </div>
                        ))}
                    </div>

                    <p className="text-xs font-extrabold mb-2 px-1 flex items-center" style={{ color: "#6d28d9" }}><Tag size={14} className="mr-1.5" /> Filter Kategori <span className="font-semibold ml-1" style={{ color: "#c084fc" }}>(kosong = semua)</span></p>
                    <div className="flex flex-wrap gap-2 mb-5">
                        {catsList.map(cat => (
                            <button key={cat.id} onClick={() => toggleCat(cat.id)} className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all hover:scale-105"
                                style={{ backgroundColor: selCats.includes(cat.id) ? "#f3e8ff" : "white", borderColor: selCats.includes(cat.id) ? "#c084fc" : "#f3e8ff", color: selCats.includes(cat.id) ? "#7c3aed" : "#9ca3af" }}>
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="rounded-2xl p-4 mb-6" style={{ backgroundColor: "#f3e8ff" }}>
                        <p className="text-xs font-extrabold mb-2 flex items-center" style={{ color: "#6d28d9" }}>
                            <Eye size={14} className="mr-1.5" /> Preview — {isLoadingData ? "Memuat..." : `${filtered.length} transaksi`}
                        </p>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <p className="text-xs font-semibold flex items-center" style={{ color: "#065f46" }}>
                                    <TrendingUp size={14} className="mr-1" /> Masuk: <span className="font-extrabold ml-1">Rp {isLoadingData ? "..." : totalIncome.toLocaleString("id-ID")}</span>
                                </p>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-semibold flex items-center" style={{ color: "#9f1239" }}>
                                    <TrendingDown size={14} className="mr-1" /> Keluar: <span className="font-extrabold ml-1">Rp {isLoadingData ? "..." : totalExpense.toLocaleString("id-ID")}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <button onClick={handleExport} disabled={loading || done || isLoadingData || filtered.length === 0} className="w-full py-4 rounded-2xl font-extrabold text-base text-white transition-all flex items-center justify-center active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed"
                        style={{ background: done ? "#10b981" : "linear-gradient(135deg, #c084fc, #f9a8d4)", boxShadow: "0 4px 14px rgba(192,132,252,0.3)" }}>
                        {done ? <><CheckCircle size={20} className="mr-2" /> Berhasil Diunduh!</> : loading ? <><Loader size={20} className="mr-2 animate-spin" /> Menyiapkan file...</> : <><Download size={20} className="mr-2" /> Download {format.toUpperCase()}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// FUNGSI EKSPORT
async function exportExcel(data: any[]) {
    const XLSX = await import("xlsx");
    const wsData: any[][] = [
        ["Tanggal", "Tipe", "Kategori", "Akun", "Nominal", "Catatan"],
        ...data.map(t => [
            t.date,
            t.type === "income" ? "Pemasukan" : "Pengeluaran",
            getCat(t.category).label,
            t.account,
            t.amount,
            t.note || "-",
        ]),
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    ws["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 25 }];

    XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");
    XLSX.writeFile(wb, `Laporan-Dompet-Savey-${new Date().toISOString().split("T")[0]}.xlsx`);
}

async function exportPDF(data: any[], startDate: string, endDate: string, totalIncome: number, totalExpense: number) {
    const jsPDFModule = await import("jspdf");
    const jsPDF = jsPDFModule.default;
    const autoTableModule = await import("jspdf-autotable");
    const autoTable = autoTableModule.default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Header Background
    doc.setFillColor(192, 132, 252); // Lilac color
    doc.rect(0, 0, 210, 40, "F");
    
    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Savey", 14, 18);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Laporan Keuangan Pribadi", 14, 25);
    
    doc.setFontSize(10);
    doc.text(`Periode: ${startDate || "Awal"} s/d ${endDate || "Akhir"}`, 14, 32);

    // Summary Section
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Laporan", 14, 50);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Pemasukan: Rp ${totalIncome.toLocaleString("id-ID")}`, 14, 58);
    doc.text(`Total Pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}`, 14, 64);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(76, 29, 149);
    doc.text(`Saldo Bersih: Rp ${(totalIncome - totalExpense).toLocaleString("id-ID")}`, 14, 72);

    // Table
    autoTable(doc, {
        startY: 80,
        head: [["Tanggal", "Tipe", "Kategori", "Akun", "Nominal (Rp)", "Catatan"]],
        body: data.map(t => [
            t.date,
            t.type === "income" ? "Masuk" : "Keluar",
            getCat(t.category).label,
            t.account,
            t.amount.toLocaleString("id-ID"),
            t.note || "-"
        ]),
        theme: 'grid',
        headStyles: { fillColor: [192, 132, 252], textColor: 255, fontStyle: "bold", halign: "center" },
        bodyStyles: { fontSize: 9, textColor: 50 },
        alternateRowStyles: { fillColor: [250, 245, 255] },
        columnStyles: {
            0: { cellWidth: 22, halign: "center" },
            1: { cellWidth: 20, halign: "center" },
            2: { cellWidth: 32 },
            3: { cellWidth: 25 },
            4: { cellWidth: 32, halign: "right" },
            5: { cellWidth: 'auto' }, // Catatan auto menyesuaikan
        },
        margin: { left: 14, right: 14 }
    });

    doc.save(`Laporan-Keuangan-Savey.pdf`);
}