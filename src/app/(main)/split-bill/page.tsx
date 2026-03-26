"use client";
import { useState, useRef } from "react";
import { ArrowLeft, ArrowRight, UploadCloud, Users, ScanLine, FileText, CheckCircle2, UserPlus, Receipt, Share2, AlertCircle, Plus, Trash2, Edit2, Loader2, Sparkles, X } from "lucide-react";
import { formatRupiah } from "../../../lib/utils";

interface ScannedItem {
    id: string;
    name: string;
    price: number;
    isTaxOrFee: boolean;
    assignees: string[];
}

interface Person {
    id: string;
    name: string;
    color: string;
}

const COLORS = ["#c084fc", "#fbbf24", "#fda4af", "#93c5fd", "#6ee7b7", "#f9a8d4", "#86efac", "#d8b4fe"];

export default function SplitBillPage() {
    const [step, setStep] = useState<"upload" | "scanning" | "review" | "assign" | "result">("upload");
    const [items, setItems] = useState<ScannedItem[]>([]);
    const [people, setPeople] = useState<Person[]>([{ id: "p1", name: "Saya", color: COLORS[0] }]);
    const [newPersonName, setNewPersonName] = useState("");
    const [activePersonId, setActivePersonId] = useState<string>("p1");
    const [loadingMsg, setLoadingMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalStruk = items.reduce((acc, item) => acc + item.price, 0);
    const unassignedCount = items.filter(it => !it.isTaxOrFee && it.assignees.length === 0).length;

    // AI INTEGRATION (Gemini)
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
        setLoadingMsg("Mengunggah dan membaca struk...");

        try {
            const base64Data = await fileToBase64(file);
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY; 
            
            if (!apiKey) {
                throw new Error("API Key Gemini belum diatur di .env.local!");
            }

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

            const prompt = `
                Ekstrak detail struk belanja ini menjadi format JSON.
                Berikan array bernama "items" dimana setiap item memiliki struktur:
                {
                    "name": "nama makanan/layanan",
                    "price": angka bulat nominal (jangan gunakan string/koma),
                    "isTaxOrFee": boolean (true JIKA item ini adalah pajak, service charge, PB1, ongkir, diskon, atau biaya tambahan. false jika ini makanan/pesanan riil)
                }
                Pastikan harga diskon bernilai negatif. Abaikan total pembayaran dan kembalian, fokus pada daftar item saja.
            `;

            const payload = {
                contents: [{
                    role: "user",
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: file.type || "image/jpeg", data: base64Data } }
                    ]
                }],
                generationConfig: { responseMimeType: "application/json" }
            };

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Gagal terhubung ke AI Scanner");

            const data = await response.json();
            const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textResult) throw new Error("Hasil scan tidak valid");

            const parsed = JSON.parse(textResult);
            if (!parsed.items || !Array.isArray(parsed.items)) throw new Error("Format AI tidak sesuai");

            const formattedItems: ScannedItem[] = parsed.items.map((it: any, index: number) => ({
                id: `item-${Date.now()}-${index}`,
                name: it.name,
                price: it.price,
                isTaxOrFee: it.isTaxOrFee || false,
                assignees: it.isTaxOrFee ? [] : [],
            }));

            setItems(formattedItems);
            setStep("review");
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.message || "Gagal membaca struk. Pastikan foto jelas.");
            setStep("upload");
        }
    };

    // LOGIC REVIEW / EDIT ITEMS
    const updateItem = (id: string, field: keyof ScannedItem, value: any) => {
        setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
    };

    const deleteItem = (id: string) => {
        setItems(prev => prev.filter(it => it.id !== id));
    };

    const addEmptyItem = () => {
        setItems([...items, { id: `item-${Date.now()}`, name: "Item Baru", price: 0, isTaxOrFee: false, assignees: [] }]);
    };


    // LOGIC ASSIGN & CALCULATE 
    const toggleAssignee = (itemId: string, personId: string) => {
        setItems(prev => prev.map(item => {
            if (item.id !== itemId || item.isTaxOrFee) return item;
            const hasAssigned = item.assignees.includes(personId);
            return {
                ...item,
                assignees: hasAssigned 
                    ? item.assignees.filter(id => id !== personId) 
                    : [...item.assignees, personId]
            };
        }));
    };

    const addPerson = () => {
        if (!newPersonName.trim()) return;
        const newPerson: Person = {
            id: `p-${Date.now()}`,
            name: newPersonName.trim(),
            color: COLORS[people.length % COLORS.length]
        };
        setPeople([...people, newPerson]);
        setNewPersonName("");
        setActivePersonId(newPerson.id);
    };

    const deletePerson = (id: string) => {
        if (people.length <= 1) return;
        setPeople(people.filter(p => p.id !== id));
        setItems(items.map(it => ({ ...it, assignees: it.assignees.filter(pId => pId !== id) })));
        if (activePersonId === id) setActivePersonId(people[0].id);
    };

    // MATEMATIKA PROPORSIONAL
    const calculateTotals = () => {
        let itemsSubtotal = 0;
        let totalTaxAndFees = 0;
        const personSubtotals: Record<string, number> = {};
        people.forEach(p => personSubtotals[p.id] = 0);

        items.forEach(item => {
            if (item.isTaxOrFee) {
                totalTaxAndFees += item.price;
            } else {
                itemsSubtotal += item.price;
                if (item.assignees.length > 0) {
                    const splitPrice = item.price / item.assignees.length;
                    item.assignees.forEach(pId => {
                        if (personSubtotals[pId] !== undefined) {
                            personSubtotals[pId] += splitPrice;
                        }
                    });
                }
            }
        });

        const results = people.map(p => {
            const sub = personSubtotals[p.id];
            const ratio = itemsSubtotal > 0 ? (sub / itemsSubtotal) : 0;
            const proportionalTax = totalTaxAndFees * ratio;
            return {
                person: p,
                subtotal: sub,
                tax: proportionalTax,
                total: sub + proportionalTax,
                items: items.filter(it => it.assignees.includes(p.id)).map(it => ({
                    name: it.name,
                    price: it.price / it.assignees.length,
                    sharedWith: it.assignees.length
                }))
            };
        });

        return { results, itemsSubtotal, totalTaxAndFees, grandTotal: itemsSubtotal + totalTaxAndFees };
    };

    const shareToWA = (result: any) => {
        let text = `Halo *${result.person.name}*! Ini detail tagihan patungan kita:\n\n*Pesananmu:*\n`;
        result.items.forEach((it: any) => {
            text += `- ${it.name} ${it.sharedWith > 1 ? `(1/${it.sharedWith})` : ''}: Rp ${Math.round(it.price).toLocaleString("id-ID")}\n`;
        });
        if (result.tax !== 0) {
            text += `\nPajak & Layanan proporsional: Rp ${Math.round(result.tax).toLocaleString("id-ID")}\n`;
        }
        text += `*TOTAL: Rp ${Math.round(result.total).toLocaleString("id-ID")}*\n\nBisa transfer ke rek/e-wallet aku ya. Thanks!`;
        
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    const shareAllToWA = (data: any) => {
        let text = `Halo semua! Ini rincian tagihan patungan kita:\n\n`;
        
        data.results.forEach((res: any) => {
            text += `👤 *${res.person.name}*\n`;
            res.items.forEach((it: any) => {
                text += `  - ${it.name} ${it.sharedWith > 1 ? `(1/${it.sharedWith})` : ''}: Rp ${Math.round(it.price).toLocaleString("id-ID")}\n`;
            });
            if (res.tax !== 0) {
                text += `  + Pajak/Fee proporsional: Rp ${Math.round(res.tax).toLocaleString("id-ID")}\n`;
            }
            text += `  *Total: Rp ${Math.round(res.total).toLocaleString("id-ID")}*\n\n`;
        });

        text += `💰 *GRAND TOTAL: Rp ${Math.round(data.grandTotal).toLocaleString("id-ID")}*\n\n`;
        text += `Silakan transfer ke rek/e-wallet aku ya. Terima kasih! ✨`;
        
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    // RENDERERS
    return (
        <div className="pb-8">
            {/* Header Sticky yang lebih mulus */}
            <header className="px-5 pt-6 pb-4 sticky top-0 z-40 bg-[#fdf8f0]/95 backdrop-blur-sm border-b border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => {
                        if (step === "result") setStep("assign");
                        else if (step === "assign") setStep("review");
                        else if (step === "review") setStep("upload");
                        else window.history.back();
                    }} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-purple-50 text-purple-600 hover:bg-purple-50 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-base font-extrabold text-purple-900">Smart Split Bill</h1>
                        <p className="text-[10px] font-bold text-purple-400">Patungan adil proporsional</p>
                    </div>
                </div>
            </header>

            <div className="px-4 pt-6">
                {step === "upload" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-white rounded-[2rem] p-6 border border-purple-50 shadow-sm text-center mb-6">
                            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-500 relative">
                                <Sparkles size={24} className="absolute top-0 right-0 text-pink-400 animate-pulse" />
                                <Receipt size={36} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-xl font-extrabold text-purple-900 mb-2">Bagi Tagihan Lebih Adil</h2>
                            <p className="text-sm font-semibold text-purple-400 mb-6">Upload foto struk, AI kami akan mengekstrak item pesanan beserta pajaknya. Kamu tinggal menentukan siapa pesan apa.</p>
                            
                            {errorMsg && (
                                <div className="mb-6 p-3 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-2 text-rose-600 text-xs font-bold text-left">
                                    <AlertCircle size={16} className="shrink-0"/> {errorMsg}
                                </div>
                            )}

                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 rounded-2xl font-extrabold text-white text-base shadow-md transition-all hover:scale-[1.02] flex justify-center items-center gap-2" style={{ background: "linear-gradient(135deg, #c084fc, #f9a8d4)" }}>
                                <ScanLine size={20}/> Scan Foto Struk
                            </button>
                            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && processReceiptWithAI(e.target.files[0])} />
                        </div>
                    </div>
                )}

                {step === "scanning" && (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 border-4 border-dashed border-purple-300 rounded-2xl animate-[spin_4s_linear_infinite]" />
                            <div className="w-24 h-24 bg-purple-100 rounded-2xl flex items-center justify-center">
                                <Loader2 size={40} className="text-purple-500 animate-spin" />
                            </div>
                        </div>
                        <h3 className="text-xl font-extrabold text-purple-900 mb-2">Memproses dengan AI</h3>
                        <p className="text-sm font-semibold text-purple-400">{loadingMsg}</p>
                    </div>
                )}

                {/* LANGKAH REVIEW (EDIT NOTA) */}
                {step === "review" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-extrabold text-purple-900 flex items-center gap-2"><Edit2 size={16} className="text-purple-500"/> Periksa & Edit Nota</h2>
                            <button onClick={addEmptyItem} className="flex items-center gap-1 text-[11px] font-bold bg-white border border-purple-100 text-purple-600 px-3 py-1.5 rounded-full hover:bg-purple-50 transition-colors shadow-sm">
                                <Plus size={14}/> Tambah
                            </button>
                        </div>
                        
                        <div className="bg-white rounded-3xl p-5 border border-purple-50 shadow-sm mb-5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-purple-500">Total Nominal Nota</span>
                                <span className="text-xl font-black text-purple-900">Rp {totalStruk.toLocaleString("id-ID")}</span>
                            </div>
                            <p className="text-[10px] font-semibold text-purple-400 mt-1">Pastikan total sesuai dengan fisik nota sebelum dibagi.</p>
                        </div>

                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className={`bg-white p-4 rounded-2xl border flex flex-col gap-3 transition-colors ${item.isTaxOrFee ? "border-rose-100 bg-rose-50/30" : "border-purple-50 shadow-sm"}`}>
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1 space-y-3">
                                            <input type="text" value={item.name} onChange={e => updateItem(item.id, "name", e.target.value)} placeholder="Nama Item" className="w-full text-sm font-extrabold text-purple-900 bg-transparent outline-none border-b border-purple-50 focus:border-purple-300 pb-1" />
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-purple-400">Rp</span>
                                                <input type="number" value={item.price || ""} onChange={e => updateItem(item.id, "price", parseInt(e.target.value) || 0)} placeholder="0" className="w-full text-sm font-extrabold text-purple-900 bg-transparent outline-none" />
                                            </div>
                                        </div>
                                        <button onClick={() => deleteItem(item.id)} className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 hover:bg-rose-100 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 bg-purple-50/50 p-2.5 rounded-xl border border-purple-50 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => updateItem(item.id, "isTaxOrFee", !item.isTaxOrFee)}>
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${item.isTaxOrFee ? "bg-rose-500" : "bg-white border-2 border-purple-200"}`}>
                                            {item.isTaxOrFee && <CheckCircle2 size={14} className="text-white" />}
                                        </div>
                                        <span className="text-xs font-bold text-purple-700">Pajak / Layanan / Diskon</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 mb-4">
                            <button onClick={() => setStep("assign")} className="w-full py-4 rounded-2xl font-extrabold text-white text-base shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2" style={{ background: "linear-gradient(135deg, #c084fc, #f9a8d4)" }}>
                                Lanjut Pilih Pemilik <ArrowRight size={18}/>
                            </button>
                        </div>
                    </div>
                )}

                {/* LANGKAH ASSIGN ITEM */}
                {step === "assign" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        
                        <div className="bg-purple-50 rounded-2xl p-4 mb-5 flex justify-between items-center border border-purple-100 shadow-sm">
                            <span className="text-xs font-extrabold text-purple-500">Total Struk:</span>
                            <span className="text-lg font-black text-purple-900">Rp {totalStruk.toLocaleString("id-ID")}</span>
                        </div>

                        {/* Area Tambah Orang */}
                        <div className="bg-white rounded-3xl p-4 border border-purple-50 shadow-sm mb-5">
                            <p className="text-xs font-extrabold text-purple-600 mb-3 flex items-center gap-1.5"><Users size={16}/> Teman Patungan</p>
                            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                                {people.map(p => (
                                    <div key={p.id} onClick={() => setActivePersonId(p.id)} className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all flex items-center gap-2 border-2 ${activePersonId === p.id ? 'shadow-md' : 'opacity-60 hover:opacity-100'}`} style={{ backgroundColor: activePersonId === p.id ? p.color + "20" : "transparent", borderColor: activePersonId === p.id ? p.color : "#f3e8ff", color: activePersonId === p.id ? p.color : "#9ca3af" }}>
                                        {p.name}
                                        {activePersonId === p.id && p.id !== "p1" && (
                                            <button onClick={(e) => { e.stopPropagation(); deletePerson(p.id); }} className="hover:text-rose-500 bg-white/50 rounded-full p-0.5"><X size={12}/></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input type="text" value={newPersonName} onChange={e => setNewPersonName(e.target.value)} placeholder="Ketik nama teman..." className="flex-1 bg-purple-50 border-none outline-none rounded-xl px-4 py-3 text-sm font-bold text-purple-900 placeholder-purple-300" onKeyDown={e => e.key === 'Enter' && addPerson()} />
                                <button onClick={addPerson} disabled={!newPersonName.trim()} className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-600 text-white disabled:opacity-50 transition-all hover:bg-purple-700">
                                    <UserPlus size={18}/>
                                </button>
                            </div>
                        </div>

                        {/* Petunjuk */}
                        <div className="bg-purple-50/50 rounded-2xl p-3 mb-5 text-center border border-purple-100">
                            <p className="text-[11px] font-semibold text-purple-600">Pilih nama di atas, lalu tap pada pesanan di bawah untuk menandai siapa yang makan. Pajak dibagi otomatis.</p>
                        </div>

                        {/* Daftar Pesanan */}
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.id} onClick={() => toggleAssignee(item.id, activePersonId)} className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${item.isTaxOrFee ? 'border-dashed border-rose-200 bg-rose-50/30' : (item.assignees.length > 0 ? 'border-purple-300 shadow-sm' : 'border-purple-50 hover:border-purple-200')}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {item.isTaxOrFee && <AlertCircle size={14} className="text-rose-400"/>}
                                            <p className={`font-bold text-sm ${item.isTaxOrFee ? 'text-rose-600' : 'text-purple-900'}`}>{item.name}</p>
                                        </div>
                                        <p className={`font-extrabold text-sm ${item.isTaxOrFee ? 'text-rose-500' : 'text-purple-600'}`}>Rp {item.price.toLocaleString("id-ID")}</p>
                                    </div>

                                    {!item.isTaxOrFee && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {item.assignees.length === 0 ? (
                                                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2 py-1 rounded-md">Belum dipilih</span>
                                            ) : (
                                                item.assignees.map(pId => {
                                                    const person = people.find(p => p.id === pId);
                                                    if (!person) return null;
                                                    return (
                                                        <span key={pId} className="text-[11px] font-extrabold px-2.5 py-1 rounded-md" style={{ backgroundColor: person.color + "20", color: person.color }}>
                                                            {person.name}
                                                        </span>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                    {item.isTaxOrFee && (
                                        <p className="text-[10px] font-bold text-rose-400 mt-1">Otomatis dibagi berdasarkan rasio pesanan.</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 mb-4 flex flex-col gap-3">
                            {unassignedCount === 0 ? (
                                <div className="bg-emerald-50 text-emerald-600 text-xs font-extrabold p-3 rounded-2xl text-center border border-emerald-100 flex items-center justify-center gap-1.5 shadow-sm">
                                    <CheckCircle2 size={16}/> Mantap! Semua pesanan sudah dipilih.
                                </div>
                            ) : (
                                <div className="bg-rose-50 text-rose-500 text-xs font-extrabold p-3 rounded-2xl text-center border border-rose-100 flex items-center justify-center gap-1.5 shadow-sm">
                                    <AlertCircle size={16}/> Masih ada {unassignedCount} pesanan belum dipilih.
                                </div>
                            )}
                            <button onClick={() => setStep("result")} disabled={unassignedCount > 0} className="w-full py-4 rounded-2xl font-extrabold text-white text-base shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale flex justify-center items-center gap-2" style={{ background: "linear-gradient(135deg, #c084fc, #f9a8d4)" }}>
                                Hitung Tagihan <ArrowRight size={18}/>
                            </button>
                        </div>
                    </div>
                )}

                {/* LANGKAH HASIL */}
                {step === "result" && (() => {
                    const data = calculateTotals();
                    return (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <div className="bg-white rounded-3xl p-5 border border-purple-50 shadow-sm text-center mb-6">
                                <p className="text-xs font-bold text-purple-500 mb-1">Grand Total Struk</p>
                                <h2 className="text-3xl font-black text-purple-900 mb-3">Rp {data.grandTotal.toLocaleString("id-ID")}</h2>
                                <div className="flex items-center justify-center gap-4 text-xs font-bold bg-purple-50 py-2 rounded-xl text-purple-600">
                                    <span>Subtotal: Rp {data.itemsSubtotal.toLocaleString("id-ID")}</span>
                                    <span>Pajak: Rp {data.totalTaxAndFees.toLocaleString("id-ID")}</span>
                                </div>
                            </div>

                            <h3 className="text-sm font-extrabold text-purple-900 mb-4 flex items-center gap-2"><Receipt size={16} className="text-purple-500"/> Tagihan Per Orang</h3>
                            
                            <div className="space-y-4">
                                {data.results.map((res, i) => (
                                    <div key={i} className="bg-white rounded-3xl p-4 border border-purple-50 shadow-sm relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: res.person.color }} />
                                        <div className="pl-2">
                                            <div className="flex justify-between items-center border-b border-purple-50 pb-3 mb-3">
                                                <h4 className="font-extrabold text-base" style={{ color: res.person.color }}>{res.person.name}</h4>
                                                <button onClick={() => shareToWA(res)} className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md">
                                                    <Share2 size={14}/>
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-1.5 mb-3">
                                                {res.items.map((it, idx) => (
                                                    <div key={idx} className="flex justify-between text-xs">
                                                        <span className="font-semibold text-purple-900">{it.name} {it.sharedWith > 1 ? `(1/${it.sharedWith})` : ''}</span>
                                                        <span className="font-bold text-purple-600">Rp {Math.round(it.price).toLocaleString("id-ID")}</span>
                                                    </div>
                                                ))}
                                                {res.tax !== 0 && (
                                                    <div className="flex justify-between text-xs pt-1.5 border-t border-dashed border-purple-50">
                                                        <span className="font-semibold text-rose-500">Pajak / Fee Proporsional</span>
                                                        <span className="font-bold text-rose-500">Rp {Math.round(res.tax).toLocaleString("id-ID")}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center bg-purple-50 p-3 rounded-xl">
                                                <span className="text-xs font-extrabold text-purple-700">Total Bayar</span>
                                                <span className="text-base font-black text-purple-900">Rp {Math.round(res.total).toLocaleString("id-ID")}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 mb-4">
                                <button onClick={() => shareAllToWA(data)} className="w-full py-4 rounded-2xl font-extrabold text-white text-base shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2 bg-[#25D366]">
                                    <Share2 size={20}/> Bagikan Semua ke WA
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}