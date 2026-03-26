"use client";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import AddTransactionModal from "@/components/transaction/AddTransactionModal";

export default function FAB() {
    const [open, setOpen] = useState(false);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        // Sembunyikan FAB kalau ada modal lain yang terbuka
        const handler = (e: CustomEvent) => setHidden(e.detail.open);
        window.addEventListener("modal-state" as any, handler);
        return () => window.removeEventListener("modal-state" as any, handler);
    }, []);

    if (hidden && !open) return null;

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-20 right-5 w-14 h-14 rounded-2xl flex items-center justify-center z-50 transition-all hover:scale-110 active:scale-95"
                style={{
                    background: "linear-gradient(135deg, #c084fc, #f9a8d4)",
                    boxShadow: "0 6px 20px rgba(192, 132, 252, 0.45)",
                }}
            >
                <Plus size={28} color="white" strokeWidth={2.5} />
            </button>
            <AddTransactionModal open={open} onClose={() => setOpen(false)} />
        </>
    );
}