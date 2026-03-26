"use client";
import { useState } from "react";
import { formatRupiah, CATEGORIES } from "../../lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Inbox, FolderOpen } from "lucide-react";
import TransactionDetailModal from "../transaction/TransactionDetailModal";
import AddTransactionModal from "../transaction/AddTransactionModal";

export interface Transaction {
    id: string;
    type: "expense" | "income";
    amount: number;
    category: string;
    date: Date;
    note?: string;
}

function getCat(catId: string) {
    return CATEGORIES.find((c) => c.id === catId) ?? CATEGORIES[CATEGORIES.length - 1];
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#f3e8ff" }}>
                <FolderOpen size={32} style={{ color: "#c084fc" }} strokeWidth={1.5} />
            </div>
            <p className="font-extrabold text-lg" style={{ color: "#7c3aed" }}>
                Belum ada transaksi
            </p>
            <p className="text-sm mt-1 font-semibold" style={{ color: "#c084fc" }}>
                Yuk catat pengeluaran pertamamu!
            </p>
        </div>
    );
}

export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);

    if (!transactions.length) return <EmptyState />;

    return (
        <>
            <div className="px-4 flex flex-col gap-2">
                {transactions.map((tx) => {
                    const cat = getCat(tx.category);
                    const Icon = cat.icon;
                    
                    return (
                        <div 
                            key={tx.id} 
                            onClick={() => setSelectedTx(tx)}
                            className="rounded-3xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{ backgroundColor: "white", boxShadow: "0 2px 8px rgba(192,132,252,0.1)" }}
                        >
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: cat.color + "30", color: cat.color }}>
                                <Icon size={20} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate" style={{ color: "#3b0764" }}>{cat.label}</p>
                                <p className="text-xs font-semibold mt-0.5" style={{ color: "#c084fc" }}>
                                    {format(new Date(tx.date), "d MMM yyyy", { locale: id })}
                                    {tx.note && ` · ${tx.note}`}
                                </p>
                            </div>
                            <p className="text-sm font-extrabold shrink-0"
                            style={{ color: tx.type === "income" ? "#10b981" : "#f43f5e" }}>
                            {tx.type === "income" ? "+" : "-"}{formatRupiah(tx.amount)}
                        </p>
                    </div>
                );
            })}
        </div>

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
    </>
);
}