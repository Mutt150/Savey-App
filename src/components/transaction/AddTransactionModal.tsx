"use client";
import { useState, useEffect, useRef } from "react";
import { 
    X, PieChart as PieChartIcon, Wallet, ShoppingBag, Banknote, Plus, 
    ScanLine, FileText, ArrowLeft, Trash2, Edit2, Sparkles, Save, ListChecks, Loader2, AlertCircle
} from "lucide-react";
import { getAllCategories, ACCOUNTS, getCustomCategories, ICON_MAP } from "@/lib/utils";
import { supabase } from "@/lib/supabase"; 

interface Props {
    open: boolean;
    onClose: () => void;
    initialData?: any;
}

interface ScannedItem {
    id: string;
    name: string;
    price: number;
    category: string;
}

export default function AddTransactionModal({ open, onClose, initialData }: Props) {
    const [step, setStep] = useState<"choose" | "manual" | "scanning" | "review">("choose");
    
    // Manual Input State
    const [type, setType] = useState<"expense" | "income">("expense");
    const [rawAmount, setRaw] = useState("");
    const [category, setCategory] = useState("living");
    const [account, setAccount] = useState("cash");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [note, setNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Quick Add Category State (Fitur Baru)
    const [isAddingQuickCat, setIsAddingQuickCat] = useState(false);
    const [quickCatName, setQuickCatName] = useState("");
    const [quickCatIcon, setQuickCatIcon] = useState("Star");
    const [quickCatColor, setQuickCatColor] = useState("#c084fc");
    
    // State kategori yang digabung dengan Kategori Kustom
    const [categoriesList, setCategoriesList] = useState(getAllCategories());

    // AI Scanner & Preview State
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [loadingMsg, setLoadingMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Kunci scroll body saat modal terbuka & reset state saat ditutup
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
            setIsAddingQuickCat(false);
            setQuickCatName("");
        }
        return () => { document.body.style.overflow = "auto"; };
    }, [open]);

    // Update list kategori jika ada event perubahan dari setting
    useEffect(() => {
        const updateCats = () => setCategoriesList(getAllCategories());
        window.addEventListener("savey_preferences_updated", updateCats);
        return () => window.removeEventListener("savey_preferences_updated", updateCats);
    }, []);

    useEffect(() => {
        if (open) {
            setCategoriesList(getAllCategories());
            if (initialData) {
                setStep("manual");
                setType(initialData.type);
                setRaw(initialData.amount.toString());
                setCategory(initialData.category);
                setAccount(initialData.account?.toLowerCase() || "cash");
                setDate(new Date(initialData.date).toISOString().split("T")[0]);
                setNote(initialData.note || "");
            } else {
                setStep("choose");
                resetManualForm();
                setScannedItems([]);
                setErrorMsg("");
            }
        }
    }, [initialData, open]);

    useEffect(() => {
        const validCats = categoriesList.filter((c: any) => {
            if (type === "income") return c.type === "income" || c.type === "both";
            return c.type === "expense" || c.type === "both";
        });
        if (validCats.length > 0 && !validCats.find((c: any) => c.id === category)) {
            setCategory(validCats[0].id);
        }
    }, [type, categoriesList, category]);

    // SEMUA HOOKS HARUS BERADA DI ATAS BARIS INI
    if (!open) return null;

    const resetManualForm = () => {
        setType("expense");
        setRaw("");
        setCategory("living");
        setAccount("cash");
        setDate(new Date().toISOString().split("T")[0]);
        setNote("");
    };

    // Filter kategori berdasarkan tipe transaksi
    const visibleCats = categoriesList.filter((c: any) => {
        if (type === "income") return c.type === "income" || c.type === "both";
        return c.type === "expense" || c.type === "both";
    });

    // Tambah Kategori Cepat ke Supabase 
    const handleQuickAddCat = async () => {
        if (!quickCatName.trim()) return;
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Silakan login terlebih dahulu");

            const newId = `custom_${Date.now()}`;
            const newCat = {
                id: newId,
                user_id: user.id,
                label: quickCatName.trim(),
                icon_name: quickCatIcon,
                color: quickCatColor,
                type: type
            };

            const { error } = await supabase.from('custom_categories').insert(newCat);
            if (error) throw error;

            // Update memori lokal
            const updated = [...getCustomCategories(), newCat];
            localStorage.setItem("savey_custom_cats", JSON.stringify(updated));
            window.dispatchEvent(new Event("savey_preferences_updated"));
            
            // Perbarui state lokal di modal ini & set kategori yang baru dibuat
            setCategoriesList(getAllCategories());
            setCategory(newId);
            setIsAddingQuickCat(false);
            setQuickCatName("");
            setQuickCatIcon("Star");
            setQuickCatColor("#c084fc");
        } catch (err: any) {
            alert("Gagal membuat kategori: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleManualSubmit = async () => {
        if (!rawAmount || parseInt(rawAmount) === 0) return;
        setIsSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Silakan login terlebih dahulu");

            const transactionData = {
                user_id: user.id,
                type: type,
                amount: parseInt(rawAmount),
                category: category,
                account: account,
                date: date,
                note: note
            };

            if (initialData) {
                const { error } = await supabase.from('transactions').update(transactionData).eq('id', initialData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('transactions').insert(transactionData);
                if (error) throw error;
            }

            window.dispatchEvent(new Event("refresh-transactions"));
            onClose();
        } catch (error: any) {
            alert(error.message || "Gagal menyimpan transaksi");
        } finally {
            setIsSaving(false);
        }
    };

    const handleMultipleSubmit = async () => {
        if (scannedItems.length === 0) return;
        setIsSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Silakan login terlebih dahulu");

            const insertData = scannedItems.map(item => ({
                user_id: user.id,
                type: "expense",
                amount: item.price,
                category: item.category,
                account: account,
                date: date,
                note: item.name
            }));

            const { error } = await supabase.from('transactions').insert(insertData);
            if (error) throw error;

            window.dispatchEvent(new Event("refresh-transactions"));
            onClose();
        } catch (error: any) {
            alert(error.message || "Gagal menyimpan transaksi massal");
        } finally {
            setIsSaving(false);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = (error) => reject(error);
        });
    };

    const processReceiptWithAI = async (file: File) => {
        setStep("scanning");
        setErrorMsg("");
        setLoadingMsg("AI sedang menganalisis struk...");

        try {
            const base64Data = await fileToBase64(file);
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

            const prompt = `
                Ekstrak struk ini menjadi JSON. 
                Berikan array bernama "items" dimana setiap item memiliki:
                {
                    "name": "nama item/layanan/pajak",
                    "price": angka nominal positif,
                    "category": "tebak salah satu kategori terdekat: food, shopping, transport, health, playing, living, atau other"
                }
            `;

            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: file.type || "image/jpeg", data: base64Data } }] }],
                generationConfig: { responseMimeType: "application/json" }
            };

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Gagal terhubung ke AI");

            const data = await response.json();
            const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textResult) throw new Error("Hasil scan kosong");

            const parsed = JSON.parse(textResult);
            if (!parsed.items) throw new Error("Format gagal dipahami AI");

            const formattedItems: ScannedItem[] = parsed.items.map((it: any, index: number) => ({
                id: `item-${Date.now()}-${index}`,
                name: it.name || "Item Tidak Diketahui",
                price: Math.abs(it.price || 0),
                category: it.category || "other",
            }));

            setScannedItems(formattedItems);
            setAccount("cash");
            setDate(new Date().toISOString().split("T")[0]);
            setStep("review");
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.message || "Gagal membaca struk.");
            setStep("choose");
        }
    };

    const updateScannedItem = (id: string, field: keyof ScannedItem, value: any) => {
        setScannedItems(items => items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const deleteScannedItem = (id: string) => {
        setScannedItems(items => items.filter(item => item.id !== id));
    };

    const totalScannedAmount = scannedItems.reduce((acc, curr) => acc + curr.price, 0);

    const renderStepChoose = () => (
        <div className="flex flex-col gap-4 py-4">
            {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-2 text-rose-600 text-xs font-bold">
                    <AlertCircle size={16}/> {errorMsg}
                </div>
            )}
            <button onClick={() => setStep("manual")} className="group flex items-center gap-4 p-5 rounded-3xl bg-white border border-purple-100 shadow-sm hover:shadow-md transition-all hover:border-purple-300">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={28} /></div>
                <div className="text-left">
                    <h3 className="text-base font-extrabold text-purple-900">Input Manual</h3>
                    <p className="text-xs font-semibold text-purple-400 mt-0.5">Ketik transaksi satu per satu</p>
                </div>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="group flex items-center gap-4 p-5 rounded-3xl bg-white border border-purple-100 shadow-sm hover:shadow-md transition-all hover:border-purple-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 blur-2xl opacity-50 rounded-full" />
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform text-white" style={{ background: "linear-gradient(135deg, #c084fc, #f9a8d4)" }}>
                    <ScanLine size={28} />
                </div>
                <div className="text-left relative z-10">
                    <h3 className="text-base font-extrabold text-purple-900 flex items-center gap-2">AI Struk Scanner <Sparkles size={14} className="text-pink-400"/></h3>
                    <p className="text-xs font-semibold text-purple-400 mt-0.5">Ekstrak & catat otomatis dari foto</p>
                </div>
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && processReceiptWithAI(e.target.files[0])} />
            </button>
        </div>
    );

    const renderStepScanning = () => (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
                <div className="absolute inset-0 border-4 border-dashed border-purple-300 rounded-2xl animate-[spin_4s_linear_infinite]" />
                <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <Loader2 size={36} className="text-purple-500 animate-spin" />
                </div>
            </div>
            <h3 className="text-lg font-extrabold text-purple-900">AI Sedang Membaca...</h3>
            <p className="text-sm font-semibold text-purple-400 mt-2">{loadingMsg}</p>
        </div>
    );

    const renderStepReview = () => (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-extrabold text-purple-600 flex items-center gap-1.5"><ListChecks size={16} /> Preview Data</p>
                <button onClick={() => setScannedItems([...scannedItems, { id: Date.now().toString(), name: "Item Baru", price: 0, category: "other" }])} className="text-[10px] font-bold bg-purple-100 text-purple-600 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors flex items-center gap-1">
                    <Plus size={12}/> Tambah
                </button>
            </div>
            
            <div className="space-y-3 mb-6 flex-1 overflow-y-auto pr-1">
                {scannedItems.map((item) => (
                    <div key={item.id} className="p-3 bg-white rounded-2xl border border-purple-100 shadow-sm flex items-center gap-3">
                        <div className="flex-1 space-y-2">
                            <input type="text" value={item.name} onChange={(e) => updateScannedItem(item.id, "name", e.target.value)} className="w-full text-sm font-extrabold text-purple-900 bg-transparent outline-none border-b border-purple-50 focus:border-purple-300 pb-1" placeholder="Nama Item" />
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-purple-400">Rp</span>
                                <input type="number" value={item.price || ""} onChange={(e) => updateScannedItem(item.id, "price", parseInt(e.target.value) || 0)} className="w-full text-sm font-extrabold text-purple-900 bg-transparent outline-none" placeholder="0" />
                            </div>
                        </div>
                        <button onClick={() => deleteScannedItem(item.id)} className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors shrink-0">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-purple-50 rounded-2xl p-4 mb-4 border border-purple-100">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-purple-500">Total Pengeluaran</span>
                    <span className="text-base font-extrabold text-rose-500">Rp {totalScannedAmount.toLocaleString("id-ID")}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto shrink-0">
                <button onClick={() => setStep("choose")} className="py-3.5 rounded-2xl font-bold text-sm bg-white border-2 border-purple-100 text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2">
                    <ArrowLeft size={16}/> Batal
                </button>
                <button onClick={handleMultipleSubmit} disabled={isSaving} className="py-3.5 rounded-2xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-70" style={{ background: "linear-gradient(135deg, #c084fc, #f9a8d4)" }}>
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>} Simpan Semua
                </button>
            </div>
        </div>
    );

    const renderStepManual = () => (
        <div className="overflow-y-auto pr-1 flex-1 space-y-5" style={{ overscrollBehavior: "contain", scrollbarWidth: "none" }}>
            <div className="flex rounded-2xl p-1" style={{ backgroundColor: "#f3e8ff" }}>
                <button onClick={() => { setType("expense"); setCategory("living"); }} className="flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2" style={{ backgroundColor: type === "expense" ? "white" : "transparent", color: type === "expense" ? "#f43f5e" : "#c084fc", boxShadow: type === "expense" ? "0 2px 6px rgba(192,132,252,0.2)" : "none" }}>
                    <ShoppingBag size={16} /> Pengeluaran
                </button>
                <button onClick={() => { setType("income"); setCategory("salary"); }} className="flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2" style={{ backgroundColor: type === "income" ? "white" : "transparent", color: type === "income" ? "#10b981" : "#c084fc", boxShadow: type === "income" ? "0 2px 6px rgba(192,132,252,0.2)" : "none" }}>
                    <Banknote size={16} /> Pemasukan
                </button>
            </div>

            <div className="rounded-3xl p-4 text-center bg-white shadow-sm border border-purple-50">
                <p className="text-xs font-bold mb-1" style={{ color: "#c084fc" }}>Nominal (Rp)</p>
                <input type="text" inputMode="numeric" placeholder="0" value={rawAmount ? parseInt(rawAmount).toLocaleString("id-ID") : ""} onChange={(e) => setRaw(e.target.value.replace(/\D/g, ""))} className="text-4xl font-extrabold bg-transparent border-none outline-none text-center w-full focus:ring-0 placeholder-[#e9d5ff]" style={{ color: "#4c1d95" }} autoFocus />
            </div>

            <div>
                <p className="text-xs font-extrabold px-1 mb-2 flex items-center gap-1 text-purple-700"><PieChartIcon size={14} /> Kategori</p>
                <div className="grid grid-cols-4 gap-2">
                    {visibleCats.map((cat: any) => {
                        const Icon = cat.icon;
                        return (
                            <button key={cat.id} onClick={() => setCategory(cat.id)} className="rounded-2xl py-3 flex flex-col items-center gap-1.5 border-2 transition-all hover:scale-105" style={{ backgroundColor: category === cat.id ? "#faf5ff" : "white", borderColor: category === cat.id ? "#c084fc" : "transparent" }}>
                                <div className="p-1 rounded-lg" style={{ color: cat.color }}><Icon size={20} strokeWidth={2.5} /></div>
                                <span className="text-[10px] font-bold text-center leading-tight px-1" style={{ color: "#7c3aed" }}>{cat.label}</span>
                            </button>
                        );
                    })}
                    
                    {/* Tombol Baru untuk Tambah Kategori (Fitur Baru) */}
                    <button onClick={() => setIsAddingQuickCat(true)} className="rounded-2xl py-3 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-purple-200 text-purple-400 hover:bg-purple-50 transition-all hover:scale-105">
                        <Plus size={20} />
                        <span className="text-[10px] font-bold text-center leading-tight px-1">Baru</span>
                    </button>
                </div>

                {/* Form Quick Add Kategori (Inline) */}
                {isAddingQuickCat && (
                    <div className="mt-3 p-4 bg-purple-50 rounded-2xl flex flex-col gap-3 border border-purple-100 animate-in fade-in zoom-in-95">
                        <input 
                            type="text" 
                            value={quickCatName} 
                            onChange={e => setQuickCatName(e.target.value)} 
                            placeholder="Nama Kategori..." 
                            className="w-full bg-white rounded-xl px-4 py-3 text-sm font-bold outline-none border border-purple-100 text-purple-900 focus:ring-2 focus:ring-purple-300" 
                        />
                        
                        {/* Pilihan Warna */}
                        <div>
                            <p className="text-[10px] font-bold text-purple-400 mb-1.5 uppercase">Warna</p>
                            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                                {["#c084fc", "#fbbf24", "#fda4af", "#93c5fd", "#6ee7b7", "#f43f5e", "#10b981", "#3b82f6", "#eab308"].map(color => (
                                    <button key={color} onClick={() => setQuickCatColor(color)} className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-transform ${quickCatColor === color ? 'scale-110 border-2 border-purple-900' : ''}`} style={{ backgroundColor: color }} />
                                ))}
                            </div>
                        </div>

                        {/* Pilihan Ikon */}
                        <div>
                            <p className="text-[10px] font-bold text-purple-400 mb-1.5 uppercase">Ikon</p>
                            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                                {["Star", "Home", "ShoppingBag", "Utensils", "Car", "HeartPulse", "Coffee", "Gamepad2", "Shirt", "Plane", "Cat", "Dog"].map(icon => {
                                    const Icon = ICON_MAP[icon] || Sparkles;
                                    return (
                                        <button key={icon} onClick={() => setQuickCatIcon(icon)} className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${quickCatIcon === icon ? 'bg-purple-200 text-purple-700 shadow-sm border-2 border-purple-400' : 'bg-white text-purple-400 border border-purple-100'}`}>
                                            <Icon size={18} />
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-2">
                            <button onClick={handleQuickAddCat} disabled={isSaving || !quickCatName.trim()} className="flex-1 bg-purple-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center transition-colors shadow-sm">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Simpan"}
                            </button>
                            <button onClick={() => setIsAddingQuickCat(false)} disabled={isSaving} className="flex-1 bg-white text-purple-500 border border-purple-100 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-50 transition-colors">
                                Batal
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div>
                <p className="text-xs font-extrabold px-1 mb-2 flex items-center gap-1 text-purple-700"><Wallet size={14} /> Akun</p>
                <div className="flex gap-2">
                    {ACCOUNTS.map((acc) => {
                        const Icon = acc.icon;
                        return (
                            <button key={acc.id} onClick={() => setAccount(acc.id)} className="flex-1 rounded-2xl py-3 flex flex-col items-center gap-1.5 border-2 transition-all hover:scale-105" style={{ backgroundColor: account === acc.id ? "#faf5ff" : "white", borderColor: account === acc.id ? "#c084fc" : "transparent" }}>
                                <Icon size={18} color="#c084fc" strokeWidth={2.5} />
                                <span className="text-[10px] font-bold" style={{ color: "#7c3aed" }}>{acc.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl p-3 bg-white border border-purple-50">
                    <p className="text-xs font-bold mb-1" style={{ color: "#c084fc" }}><FileText size={12} className="inline mr-1"/> Tanggal</p>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm font-bold bg-transparent border-none outline-none w-full" style={{ color: "#4c1d95" }} />
                </div>
                <div className="rounded-2xl p-3 bg-white border border-purple-50">
                    <p className="text-xs font-bold mb-1" style={{ color: "#c084fc" }}><Edit2 size={12} className="inline mr-1"/> Catatan</p>
                    <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional..." className="text-sm font-bold bg-transparent border-none outline-none w-full placeholder-[#c084fc]" style={{ color: "#4c1d95" }} />
                </div>
            </div>

            <div className="shrink-0 pt-4 mt-2 relative z-10">
                <button onClick={handleManualSubmit} disabled={isSaving || !rawAmount || parseInt(rawAmount) <= 0} className="w-full text-white font-extrabold text-base py-4 rounded-2xl transition-all shadow-[0_4px_14px_rgba(192,132,252,0.4)] hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" style={{ background: "linear-gradient(135deg, #c084fc, #f9a8d4)" }}>
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20}/>} 
                    {initialData ? "Simpan Perubahan" : "Simpan Transaksi"}
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4" style={{ backgroundColor: "rgba(76, 29, 149, 0.35)", backdropFilter: "blur(4px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] p-5 animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 relative flex flex-col" style={{ backgroundColor: "#fdf8f0", height: step === "choose" ? "auto" : "90vh", maxHeight: "90vh" }}>
                
                <div className="w-10 h-1.5 rounded-full mx-auto mb-5 md:hidden shrink-0" style={{ backgroundColor: "#e9d5ff" }} />

                <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-3">
                        {step !== "choose" && !initialData && (
                            <button onClick={() => setStep("choose")} className="w-8 h-8 rounded-xl flex items-center justify-center bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors">
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <h2 className="text-xl font-extrabold text-purple-900 flex items-center gap-2">
                            {initialData ? <><Edit2 size={20} className="text-purple-500"/> Edit Transaksi</> : <><Plus size={20} className="text-purple-500"/> Tambah Transaksi</>}
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-purple-200" style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}><X size={16} /></button>
                </div>

                {step === "choose" && renderStepChoose()}
                {step === "manual" && renderStepManual()}
                {step === "scanning" && renderStepScanning()}
                {step === "review" && renderStepReview()}

            </div>
        </div>
    );
}