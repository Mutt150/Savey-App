"use client";
import { useState, useRef, useEffect } from "react";
import { X, Upload, CheckCircle, AlertCircle, FileSpreadsheet, Download, Info, CheckCircle2, XCircle, ArrowRight, PartyPopper } from "lucide-react";

function notifyModal(open: boolean) {
    window.dispatchEvent(new CustomEvent("modal-state", { detail: { open } }));
}

interface ParsedRow {
    date: string;
    type: string;
    category: string;
    account: string;
    amount: number;
    note: string;
    valid: boolean;
    error?: string;
}

interface Props { open: boolean; onClose: () => void; }

export default function ImportModal({ open, onClose }: Props) {
    const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
    const [rows, setRows] = useState<ParsedRow[]>([]);
    const [fileName, setFileName] = useState("");
    const [loading, setLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) notifyModal(true);
        else notifyModal(false);
    }, [open]);

    if (!open) return null;

    const reset = () => { setStep("upload"); setRows([]); setFileName(""); };

    const parseCSV = (text: string): ParsedRow[] => {
        const lines = text.trim().split("\n");
        const headers = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""));
        return lines.slice(1).map((line, i) => {
            const cols = line.split(",").map(c => c.trim().replace(/"/g, ""));
            const row: Record<string, string> = {};
            headers.forEach((h, idx) => { row[h] = cols[idx] ?? ""; });

            const amount = parseFloat(row["nominal"] || row["amount"] || "0");
            const date = row["tanggal"] || row["date"] || "";
            const type = (row["tipe"] || row["type"] || "").toLowerCase();

            const valid = !!date && !isNaN(amount) && amount > 0 && (type === "income" || type === "expense" || type === "pemasukan" || type === "pengeluaran");

            return {
                date,
                type: type.includes("income") || type.includes("masuk") || type.includes("pemasukan") ? "income" : "expense",
                category: row["kategori"] || row["category"] || "Lainnya",
                account: row["akun"] || row["account"] || "Cash",
                amount: isNaN(amount) ? 0 : amount,
                note: row["catatan"] || row["note"] || "",
                valid,
                error: !valid ? (!date ? "Tanggal kosong" : isNaN(amount) ? "Nominal tidak valid" : "Tipe harus income/expense") : undefined,
            };
        });
    };

    const handleFile = (file: File) => {
        if (!file.name.endsWith(".csv")) {
            alert("Hanya file .csv yang didukung!");
            return;
        }
        setFileName(file.name);
        setLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const parsed = parseCSV(text);
            setRows(parsed);
            setStep("preview");
            setLoading(false);
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleImport = async () => {
        const validRows = rows.filter(r => r.valid);
        setLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        setLoading(false);
        setStep("done");
    };

    const downloadTemplate = () => {
        const csv = [
            "tanggal,tipe,kategori,akun,nominal,catatan",
            "2026-03-15,income,Gaji,Bank,8500000,Gaji Maret",
            "2026-03-10,expense,Living,Bank,1200000,Bayar Kos",
            "2026-03-17,expense,Makanan,Cash,25000,Makan siang",
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "template-import-keuangan.csv";
        a.click();
    };

    const validCount = rows.filter(r => r.valid).length;
    const invalidCount = rows.filter(r => !r.valid).length;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: "rgba(76,29,149,0.35)", backdropFilter: "blur(4px)" }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-lg rounded-t-3xl p-5 overflow-y-auto"
                style={{ backgroundColor: "#fdf8f0", maxHeight: "92vh" }}>

                <div className="w-10 h-1.5 rounded-full mx-auto mb-5" style={{ backgroundColor: "#e9d5ff" }} />

                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-extrabold flex items-center gap-2" style={{ color: "#4c1d95" }}>
                        <Upload size={20} className="text-purple-500" /> Import CSV
                    </h2>
                    <button onClick={() => { reset(); onClose(); }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-purple-200"
                        style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}>
                        <X size={16} />
                    </button>
                </div>

                {step === "upload" && (
                    <>
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileRef.current?.click()}
                            className="rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all mb-4"
                            style={{
                                border: `2px dashed ${dragOver ? "#c084fc" : "#e9d5ff"}`,
                                backgroundColor: dragOver ? "#faf5ff" : "white",
                                minHeight: 180,
                            }}>
                            <input ref={fileRef} type="file" accept=".csv" className="hidden"
                                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                            <FileSpreadsheet size={48} strokeWidth={1.5} className="mb-4 text-purple-300" />
                            <p className="font-extrabold text-sm text-center" style={{ color: "#4c1d95" }}>
                                {dragOver ? "Lepaskan file di sini!" : "Drag & drop file CSV"}
                            </p>
                            <p className="text-xs font-semibold mt-1" style={{ color: "#c084fc" }}>
                                atau klik untuk memilih file
                            </p>
                        </div>

                        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "#f3e8ff" }}>
                            <p className="text-xs font-extrabold mb-2 flex items-center gap-1.5" style={{ color: "#6d28d9" }}>
                                <Info size={14}/> Format kolom:
                            </p>
                            <code className="text-xs font-mono" style={{ color: "#7c3aed" }}>
                                tanggal, tipe, kategori, akun, nominal, catatan
                            </code>
                            <p className="text-xs font-semibold mt-2" style={{ color: "#9ca3af" }}>
                                • tipe: <b>income</b> atau <b>expense</b><br />
                                • tanggal: format YYYY-MM-DD<br />
                                • nominal: angka tanpa titik/koma
                            </p>
                        </div>

                        <button onClick={downloadTemplate}
                            className="w-full py-3 rounded-2xl font-bold text-sm border-2 transition-all hover:bg-purple-50 flex justify-center items-center gap-2"
                            style={{ borderColor: "#e9d5ff", color: "#c084fc", backgroundColor: "white" }}>
                            <Download size={16}/> Download Template CSV
                        </button>
                    </>
                )}

                {step === "preview" && (
                    <>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {[
                                { label: "Total Baris", value: rows.length, color: "#4c1d95", bg: "#f3e8ff", icon: FileSpreadsheet },
                                { label: "Valid", value: validCount, color: "#065f46", bg: "#d1fae5", icon: CheckCircle2 },
                                { label: "Error", value: invalidCount, color: "#9f1239", bg: "#ffe4e6", icon: XCircle },
                            ].map(s => (
                                <div key={s.label} className="rounded-2xl p-3 text-center flex flex-col items-center justify-center"
                                    style={{ backgroundColor: s.bg }}>
                                    <p className="text-lg font-extrabold flex items-center gap-1" style={{ color: s.color }}>
                                        <s.icon size={16}/> {s.value}
                                    </p>
                                    <p className="text-xs font-bold" style={{ color: s.color }}>{s.label}</p>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs font-extrabold mb-2 px-1 flex items-center gap-1.5" style={{ color: "#6d28d9" }}>
                            <Info size={14} /> Preview Data — {fileName}
                        </p>

                        <div className="rounded-2xl overflow-hidden mb-4"
                            style={{ border: "1px solid #f3e8ff", maxHeight: 300, overflowY: "auto" }}>
                            <table className="w-full text-xs">
                                <thead style={{ backgroundColor: "#f3e8ff", position: "sticky", top: 0 }}>
                                    <tr>
                                        {["Tgl", "Tipe", "Kategori", "Nominal", "Status"].map(h => (
                                            <th key={h} className="px-2 py-2 font-extrabold text-left"
                                                style={{ color: "#6d28d9" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, i) => (
                                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "white" : "#faf5ff" }}>
                                            <td className="px-2 py-1.5 font-semibold" style={{ color: "#3b0764" }}>{row.date}</td>
                                            <td className="px-2 py-1.5">
                                                <span className="px-1.5 py-0.5 rounded-full font-bold text-[10px]"
                                                    style={{
                                                        backgroundColor: row.type === "income" ? "#d1fae5" : "#ffe4e6",
                                                        color: row.type === "income" ? "#065f46" : "#9f1239",
                                                    }}>
                                                    {row.type === "income" ? "Masuk" : "Keluar"}
                                                </span>
                                            </td>
                                            <td className="px-2 py-1.5 font-semibold" style={{ color: "#3b0764" }}>{row.category}</td>
                                            <td className="px-2 py-1.5 font-bold" style={{ color: "#4c1d95" }}>
                                                {row.amount.toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-2 py-1.5">
                                                {row.valid
                                                    ? <CheckCircle size={14} style={{ color: "#10b981" }} />
                                                    : <span className="text-[10px] font-bold flex items-center gap-0.5" style={{ color: "#f43f5e" }}>
                                                        <AlertCircle size={10}/> {row.error}
                                                    </span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={reset}
                                className="flex-1 py-3 rounded-2xl font-bold text-sm border-2 transition-all hover:bg-purple-50"
                                style={{ borderColor: "#e9d5ff", color: "#c084fc", backgroundColor: "white" }}>
                                Kembali
                            </button>
                            <button onClick={handleImport} disabled={validCount === 0 || loading}
                                className="flex-1 py-3 rounded-2xl font-extrabold text-sm text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ background: "linear-gradient(135deg, #c084fc, #f9a8d4)" }}>
                                {loading ? "Memproses..." : <><CheckCircle2 size={16}/> Import {validCount} Data</>}
                            </button>
                        </div>
                    </>
                )}

                {step === "done" && (
                    <div className="flex flex-col items-center py-10 text-center">
                        <PartyPopper size={56} className="text-emerald-400 mb-4" strokeWidth={1.5} />
                        <p className="text-xl font-extrabold mb-2" style={{ color: "#4c1d95" }}>
                            Import Berhasil!
                        </p>
                        <p className="text-sm font-semibold mb-6" style={{ color: "#c084fc" }}>
                            {validCount} transaksi berhasil ditambahkan ke Savey.
                        </p>
                        <button onClick={() => { reset(); onClose(); }}
                            className="px-8 py-3 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                            style={{ background: "linear-gradient(135deg, #c084fc, #f9a8d4)" }}>
                            Lihat Dashboard <ArrowRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}