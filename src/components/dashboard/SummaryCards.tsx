"use client";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown, Eye, EyeOff } from "lucide-react";

interface Props {
    balance: number;
    income: number;
    expense: number;
}

export default function SummaryCards({ balance, income, expense }: Props) {
    const [showBalance, setShowBalance] = useState(false);

    const updateVisibility = () => {
        // Jika hide balance true, maka showBalance false
        const isHidden = localStorage.getItem("savey_hide_balance") === "true";
        setShowBalance(!isHidden);
    };

    useEffect(() => {
        updateVisibility();
        // Listener saat setting disimpan
        window.addEventListener("savey_preferences_updated", updateVisibility);
        return () => window.removeEventListener("savey_preferences_updated", updateVisibility);
    }, []);

    const renderNominal = (amount: number) => {
        return showBalance ? formatRupiah(amount) : "Rp •••••••";
    };

    return (
        <div className="px-4 pt-5 pb-2">
            <div className="rounded-3xl p-5 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #c084fc 0%, #a78bfa 100%)", boxShadow: "0 8px 24px rgba(192,132,252,0.25)" }}>
                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
                <div className="absolute -bottom-6 right-10 w-20 h-20 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                
                <div className="flex items-center justify-between relative z-10">
                    <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.85)" }}>
                        <Wallet size={14} /> Total Saldo
                    </p>
                    <button onClick={() => setShowBalance(!showBalance)} className="text-white/80 hover:text-white transition-colors p-1">
                        {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                </div>
                
                <p className="text-3xl font-extrabold mt-1 mb-5 tracking-tight text-white relative z-10 transition-all">
                    {renderNominal(balance)}
                </p>
                
                <div className="flex gap-3 relative z-10">
                    <div className="flex-1 rounded-2xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                        <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>
                            <TrendingUp size={14} /> Pemasukan
                        </p>
                        <p className="text-sm font-extrabold mt-1 text-white">{renderNominal(income)}</p>
                    </div>
                    <div className="flex-1 rounded-2xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                        <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>
                            <TrendingDown size={14} /> Pengeluaran
                        </p>
                        <p className="text-sm font-extrabold mt-1 text-white">{renderNominal(expense)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}