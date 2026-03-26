"use client";
import { useState } from "react";
import { X, Calendar, Wallet, FileText, Trash2, Edit3, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CATEGORIES, ACCOUNTS, formatRupiah } from "@/lib/utils";
import { supabase } from "@/lib/supabase"; 

interface TransactionData {
    id: string;
    type: "expense" | "income";
    amount: number;
    category: string;
    date: Date | string;
    account?: string;
    note?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    transaction: TransactionData | null;
    onEdit?: () => void;
}

export default function TransactionDetailModal({ open, onClose, transaction, onEdit }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!open || !transaction) return null;

    const cat = CATEGORIES.find((c) => c.id === transaction.category) ?? CATEGORIES[CATEGORIES.length - 1];
    const acc = ACCOUNTS.find((a) => a.id === (transaction.account?.toLowerCase() || "cash")) ?? ACCOUNTS[0];
    const Icon = cat.icon;

    // Fungsi Hapus Real ke Supabase
    const handleDelete = async () => {
        const confirmDelete = window.confirm("Yakin ingin menghapus transaksi ini?");
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', transaction.id);

            if (error) throw error;
            
            // Refresh halaman / komponen list
            window.dispatchEvent(new Event("refresh-transactions"));
            onClose();
        } catch (error: any) {
            console.error("Gagal menghapus:", error);
            alert("Gagal menghapus transaksi.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(76, 29, 149, 0.35)", backdropFilter: "blur(4px)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full max-w-sm rounded-[2.5rem] p-6 overflow-hidden animate-in zoom-in-95 duration-300 relative"
                style={{ backgroundColor: "#fdf8f0", boxShadow: "0 20px 40px rgba(76,29,149,0.2)" }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-purple-200"
                    style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}
                >
                    <X size={16} />
                </button>

                {/* Icon & Amount */}
                <div className="flex flex-col items-center mt-2 mb-6">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-inner"
                        style={{ backgroundColor: cat.color + "30", color: cat.color }}>
                        <Icon size={40} strokeWidth={2.5} />
                    </div>
                    <p className="text-sm font-bold mb-1" style={{ color: "#c084fc" }}>{cat.label}</p>
                    <h2 className="text-3xl font-extrabold" style={{ color: transaction.type === "income" ? "#10b981" : "#f43f5e" }}>
                        {transaction.type === "income" ? "+" : "-"}{formatRupiah(transaction.amount)}
                    </h2>
                </div>

                {/* Details List */}
                <div className="rounded-3xl p-4 space-y-4 mb-6" style={{ backgroundColor: "white", boxShadow: "0 2px 8px rgba(192,132,252,0.05)" }}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "#9ca3af" }}>
                            <Calendar size={16} /> Tanggal
                        </div>
                        <p className="text-sm font-extrabold" style={{ color: "#4c1d95" }}>
                            {format(new Date(transaction.date), "d MMM yyyy", { locale: id })}
                        </p>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "#9ca3af" }}>
                            <Wallet size={16} /> Akun
                        </div>
                        <p className="text-sm font-extrabold" style={{ color: "#4c1d95" }}>
                            {acc.label}
                        </p>
                    </div>
                    {transaction.note && (
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "#9ca3af" }}>
                                <FileText size={16} /> Catatan
                            </div>
                            <p className="text-sm font-extrabold text-right max-w-[150px]" style={{ color: "#4c1d95" }}>
                                {transaction.note}
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:bg-rose-50 text-rose-500 border-2 border-transparent hover:border-rose-200 disabled:opacity-50" 
                        style={{ backgroundColor: "white" }}
                    >
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} 
                        Hapus
                    </button>
                    <button 
                        onClick={onEdit}
                        disabled={isDeleting}
                        className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 text-white disabled:opacity-50" 
                        style={{ background: "linear-gradient(135deg, #c084fc, #f9a8d4)" }}
                    >
                        <Edit3 size={16} /> Edit
                    </button>
                </div>
            </div>
        </div>
    );
}