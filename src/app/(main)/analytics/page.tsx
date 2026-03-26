"use client";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatRupiah, CATEGORIES, ICON_MAP } from "@/lib/utils";
import { Home, Utensils, ShoppingBag, Car, Gamepad2, HeartHandshake, HeartPulse, Wallet, Smartphone, Building, PieChart as PieChartIcon, ClipboardList, Lightbulb, TrendingUp, BarChart3, Coins, AlertTriangle, Settings, X, Trash2, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const TABS = ["Kategori", "Anggaran", "Tren", "Aset"] as const;
type Tab = typeof TABS[number];

// Helpers untuk Tooltip & Label
function CustomLineTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-2xl px-3 py-2 text-xs font-bold bg-white border border-purple-100 shadow-md">
            <p style={{ color: "#7c3aed" }}>Tgl {label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color }}>{p.name === "income" ? "📈 Masuk" : "📉 Keluar"}: {formatRupiah(p.value)}</p>
            ))}
        </div>
    );
}

function CustomPieTooltip({ active, payload, total }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
        <div className="rounded-2xl px-3 py-2 text-xs font-bold bg-white border border-purple-100 shadow-md relative z-[100]">
            <p style={{ color: "#4c1d95" }}>{d.name}</p>
            <p style={{ color: d.payload.color }}>{formatRupiah(d.value)}</p>
            <p style={{ color: "#9ca3af" }}>{((d.value / total) * 100).toFixed(1)}%</p>
        </div>
    );
}

const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name, fill } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <g>
            <text x={x} y={y - 8} fill={fill} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={14} fontWeight="900">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
            <text x={x} y={y + 8} fill="#9ca3af" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight="bold">
                {name}
            </text>
        </g>
    );
};

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("Kategori");
    const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
    const [rotation, setRotation] = useState(0);

    // STATE UNTUK SUPABASE
    const [budgets, setBudgets] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);
    const [lineData, setLineData] = useState<any[]>([]);
    const [accountsData, setAccountsData] = useState<any[]>([]);
    const [allCategories, setAllCategories] = useState<any[]>(CATEGORIES);
    const [monthlyData, setMonthlyData] = useState<any[]>([]); // TAMBAHAN: State untuk Perbandingan Bulanan
    
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSavingBudget, setIsSavingBudget] = useState(false);

    // Modal Anggaran
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [isAddingBudget, setIsAddingBudget] = useState(false);
    const [newBudgetCategory, setNewBudgetCategory] = useState("");
    const [newBudgetLimit, setNewBudgetLimit] = useState("");

    // Fetch Data dari Supabase Terintegrasi Penuh
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // 1. Fetch Custom Categories
                const { data: customCats } = await supabase.from('custom_categories').select('*').eq('user_id', user.id);
                const combinedCats = [
                    ...CATEGORIES, 
                    ...(customCats || []).map(c => ({
                        id: c.id, label: c.label, type: c.type, color: c.color, icon: ICON_MAP[c.icon_name] || ShoppingBag
                    }))
                ];
                setAllCategories(combinedCats);

                // 2. Fetch Semua Transaksi User
                const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: true });
                
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                // Filter transaksi hanya untuk bulan ini (Untuk Pie Chart & Tren)
                const currentMonthTx = (txData || []).filter(tx => {
                    const txDate = new Date(tx.date);
                    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
                });

                // KALKULASI PIE CHART (Pengeluaran Bulan Ini)
                const pieMap: Record<string, number> = {};
                currentMonthTx.filter(tx => tx.type === 'expense').forEach(tx => {
                    const catLabel = combinedCats.find(c => c.id === tx.category)?.label || "Lainnya";
                    pieMap[catLabel] = (pieMap[catLabel] || 0) + tx.amount;
                });
                
                const formattedPieData = Object.keys(pieMap).map(label => {
                    const catDef = combinedCats.find(c => c.label === label);
                    return {
                        name: label,
                        value: pieMap[label],
                        color: catDef?.color || "#e9d5ff",
                        icon: catDef?.icon || ShoppingBag
                    };
                }).filter(d => d.value > 0);
                setPieData(formattedPieData);

                // KALKULASI TREN (Grafik Garis Bulan Ini)
                const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                const trendArray = Array.from({length: daysInMonth}, (_, i) => ({ day: String(i + 1), income: 0, expense: 0 }));
                
                currentMonthTx.forEach(tx => {
                    const txDay = new Date(tx.date).getDate();
                    if (tx.type === 'income') trendArray[txDay - 1].income += tx.amount;
                    if (tx.type === 'expense') trendArray[txDay - 1].expense += tx.amount;
                });
                setLineData(trendArray);

                // KALKULASI PERBANDINGAN BULANAN (Semua Transaksi)
                const monthlyMap: Record<string, { income: number, expense: number }> = {};
                (txData || []).forEach(tx => {
                    const dateObj = new Date(tx.date);
                    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { income: 0, expense: 0 };
                    if (tx.type === 'income') monthlyMap[monthKey].income += tx.amount;
                    if (tx.type === 'expense') monthlyMap[monthKey].expense += tx.amount;
                });

                const formattedMonthly = Object.entries(monthlyMap)
                    .map(([key, data]) => {
                        const [year, month] = key.split('-');
                        const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
                        return {
                            id: key,
                            month: dateObj.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
                            timestamp: dateObj.getTime(),
                            ...data
                        };
                    })
                    .sort((a, b) => b.timestamp - a.timestamp) 
                    .slice(0, 3); // Ambil 3 bulan terakhir saja
                
                setMonthlyData(formattedMonthly);

                // KALKULASI ASET (Dari Semua Transaksi)
                const initialAccounts = [
                    { id: "cash", label: "Cash", icon: Wallet, balance: 0, color: "#c084fc" },
                    { id: "ewallet", label: "E-Wallet", icon: Smartphone, balance: 0, color: "#f9a8d4" },
                    { id: "bank", label: "Bank BCA", icon: Building, balance: 0, color: "#93c5fd" },
                ];
                
                (txData || []).forEach(tx => {
                    const accIndex = initialAccounts.findIndex(a => a.id === (tx.account || "").toLowerCase());
                    if (accIndex !== -1) {
                        if (tx.type === 'income') initialAccounts[accIndex].balance += tx.amount;
                        if (tx.type === 'expense') initialAccounts[accIndex].balance -= tx.amount;
                    }
                });
                setAccountsData(initialAccounts);

                // KALKULASI BUDGET (Dari Semua Transaksi)
                const { data: budgetData } = await supabase.from('budgets').select('*').eq('user_id', user.id);
                
                const formattedBudgets = (budgetData || []).map(b => {
                    const usedAmount = currentMonthTx.filter(tx => {
                        const catLabel = combinedCats.find(c => c.id === tx.category)?.label || "Lainnya";
                        return catLabel === b.category && tx.type === 'expense';
                    }).reduce((sum, tx) => sum + tx.amount, 0);

                    return {
                        id: b.id,
                        category: b.category,
                        limit: b.limit_amount,
                        used: usedAmount,
                        color: b.color || "#c084fc",
                        icon: ICON_MAP[b.icon_name] || ShoppingBag
                    };
                });
                setBudgets(formattedBudgets);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, []);

    const totalExpense = pieData.reduce((s, d) => s + d.value, 0);
    const totalAsset = accountsData.reduce((s, a) => s + a.balance, 0);
    const totalIncomeThisMonth = lineData.reduce((s, d) => s + d.income, 0);
    const totalExpenseThisMonth = lineData.reduce((s, d) => s + d.expense, 0);

    useEffect(() => {
        if (activeTab !== "Kategori") return;
        const interval = setInterval(() => setRotation(prev => (prev - 0.05) % 360), 50); 
        return () => clearInterval(interval);
    }, [activeTab]);


    // LOGIKA MODAL ANGGARAN (Hardware Back Button)
    useEffect(() => {
        if (isEditingBudget) {
            window.history.pushState({ modalOpen: true }, "");
        }
        const handlePopState = () => {
            if (isEditingBudget) {
                setIsEditingBudget(false);
                setIsAddingBudget(false);
            }
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [isEditingBudget]);

    // Kategori Pengeluaran yang belum memiliki budget
    const availableCategoriesForBudget = allCategories.filter(c => 
        c.type === 'expense' && 
        !["salary", "freelance"].includes(c.id) && 
        !budgets.some(b => b.category === c.label)
    );

    const handleBudgetChange = async (id: string, newLimit: string) => {
        const val = Number(newLimit) || 0;
        setBudgets(budgets.map(b => b.id === id ? { ...b, limit: val } : b));
        await supabase.from('budgets').update({ limit_amount: val }).eq('id', id);
    };

    const handleDeleteBudget = async (id: string) => {
        setBudgets(budgets.filter(b => b.id !== id));
        await supabase.from('budgets').delete().eq('id', id);
    };

    const handleAddBudget = async () => {
        if (!newBudgetCategory || !newBudgetLimit) return;
        setIsSavingBudget(true);
        
        const selectedCat = allCategories.find(c => c.id === newBudgetCategory);
        if (!selectedCat) {
            setIsSavingBudget(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Belum login");

            let iconNameString = "ShoppingBag";
            for (const [name, component] of Object.entries(ICON_MAP)) {
                if (component === selectedCat.icon) {
                    iconNameString = name;
                    break;
                }
            }

            const newDbBudget = { 
                user_id: user.id,
                category: selectedCat.label, 
                limit_amount: Number(newBudgetLimit), 
                color: selectedCat.color,
                icon_name: iconNameString
            };

            const { data, error } = await supabase.from('budgets').insert(newDbBudget).select().single();
            if (error) throw error;
            
            setBudgets([...budgets, { ...newDbBudget, id: data.id, icon: selectedCat.icon, used: 0, limit: newDbBudget.limit_amount }]);
            
            setNewBudgetCategory("");
            setNewBudgetLimit("");
            setIsAddingBudget(false);
        } catch (error: any) {
            alert("Gagal menyimpan anggaran: " + error.message);
        } finally {
            setIsSavingBudget(false);
        }
    };

    return (
        <div className="pb-28">
            <div className="px-4 pt-4">
                <div className="flex rounded-2xl p-1 gap-1" style={{ backgroundColor: "#f3e8ff" }}>
                    {TABS.map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className="flex-1 py-2 rounded-xl text-xs font-extrabold transition-all"
                            style={{ backgroundColor: activeTab === tab ? "white" : "transparent", color: activeTab === tab ? "#7c3aed" : "#c084fc", boxShadow: activeTab === tab ? "0 2px 6px rgba(192,132,252,0.2)" : "none" }}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {isLoadingData ? (
                <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-purple-400" size={32} /></div>
            ) : (
                <>
                    {activeTab === "Kategori" && (
                        <div className="px-4 mt-4 flex flex-col gap-3 animate-in fade-in">
                            <div className="rounded-3xl p-4 overflow-visible" style={{ backgroundColor: "white", boxShadow: "0 2px 16px rgba(192,132,252,0.08)" }}>
                                <p className="text-sm font-extrabold mb-1 flex items-center gap-1.5" style={{ color: "#4c1d95" }}>
                                    <PieChartIcon size={16} className="text-purple-500" /> Pengeluaran Bulan Ini
                                </p>
                                <p className="text-xs font-semibold mb-3" style={{ color: "#c084fc" }}>Total: {formatRupiah(totalExpense)}</p>
                                
                                {pieData.length === 0 ? (
                                    <div className="text-center py-10 text-purple-300 text-sm font-bold">Belum ada pengeluaran bulan ini</div>
                                ) : (
                                    <div style={{ height: 320, width: "100%", overflow: "visible" }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie 
                                                    data={pieData} cx="50%" cy="50%" 
                                                    innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value"
                                                    startAngle={90 + rotation} endAngle={-270 + rotation}
                                                    isAnimationActive={false} labelLine={{ strokeWidth: 1.5, stroke: "#d8b4fe" }}
                                                    label={renderCustomizedLabel}
                                                    onMouseEnter={(_, i) => setActivePieIndex(i)} 
                                                    onMouseLeave={() => setActivePieIndex(null)}
                                                >
                                                    {pieData.map((entry, i) => <Cell key={entry.name} fill={entry.color} opacity={activePieIndex === null || activePieIndex === i ? 1 : 0.7} stroke="transparent" />)}
                                                </Pie>
                                                <RechartsTooltip content={<CustomPieTooltip total={totalExpense} />} wrapperStyle={{ zIndex: 100 }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>

                            {pieData.length > 0 && (
                                <div className="rounded-3xl p-4" style={{ backgroundColor: "white", boxShadow: "0 2px 16px rgba(192,132,252,0.08)" }}>
                                    <p className="text-sm font-extrabold mb-4 flex items-center gap-1.5" style={{ color: "#4c1d95" }}>
                                        <ClipboardList size={16} className="text-purple-500" /> Rincian Kategori
                                    </p>
                                    <div className="flex flex-col gap-4">
                                        {pieData.sort((a, b) => b.value - a.value).map((item) => {
                                            const pct = Math.round((item.value / totalExpense) * 100);
                                            const Icon = item.icon;
                                            return (
                                                <div key={item.name}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 rounded-xl" style={{ backgroundColor: item.color + "20", color: item.color }}><Icon size={16} strokeWidth={2.5} /></div>
                                                            <span className="text-sm font-bold" style={{ color: "#3b0764" }}>{item.name}</span>
                                                        </div>
                                                        <div className="text-right flex items-center gap-2">
                                                            <span className="text-sm font-extrabold" style={{ color: "#4c1d95" }}>{formatRupiah(item.value)}</span>
                                                            <span className="text-xs font-bold" style={{ color: "#c084fc" }}>{pct}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 rounded-full w-full" style={{ backgroundColor: "#f3e8ff" }}>
                                                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "Anggaran" && (
                        <div className="px-4 mt-4 flex flex-col gap-3 animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <div className="rounded-3xl p-4 flex-1 mr-2" style={{ background: "linear-gradient(135deg, #c084fc, #a78bfa)", boxShadow: "0 4px 16px rgba(192,132,252,0.3)" }}>
                                    <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>
                                        <Lightbulb size={14} /> Insight Anggaran
                                    </p>
                                    <p className="text-sm font-extrabold text-white mt-1">
                                        Kamu sudah pakai {Math.round((budgets.reduce((s, b) => s + b.used, 0) / Math.max(1, budgets.reduce((s, b) => s + b.limit, 0))) * 100) || 0}%
                                    </p>
                                </div>
                                <button onClick={() => setIsEditingBudget(true)} className="p-4 rounded-3xl flex items-center justify-center transition-colors hover:bg-purple-100" style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}>
                                    <Settings size={22} />
                                </button>
                            </div>

                            {budgets.length === 0 && (
                                <div className="rounded-3xl p-8 text-center bg-white shadow-sm mt-2">
                                    <p className="text-sm font-bold text-purple-400">Belum ada anggaran. Yuk tambahkan!</p>
                                </div>
                            )}

                            {budgets.map((b) => {
                                const pct = b.limit === 0 ? 0 : Math.round((b.used / b.limit) * 100);
                                const over = pct >= 90;
                                const Icon = b.icon || ShoppingBag;
                                return (
                                    <div key={b.id} className="rounded-3xl p-4 transition-all" style={{ backgroundColor: "white", boxShadow: "0 2px 8px rgba(192,132,252,0.08)" }}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-xl" style={{ backgroundColor: b.color + "20", color: b.color }}><Icon size={16} strokeWidth={2.5} /></div>
                                                <span className="text-sm font-extrabold" style={{ color: "#3b0764" }}>{b.category}</span>
                                                {over && <AlertTriangle size={14} className="text-rose-500 ml-1" />}
                                            </div>
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: over ? "#ffe4e6" : "#f3e8ff", color: over ? "#f43f5e" : "#c084fc" }}>
                                                {pct}% Terpakai
                                            </span>
                                        </div>
                                        <div className="h-3 rounded-full w-full mb-2" style={{ backgroundColor: "#f3e8ff" }}>
                                            <div className="h-3 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: over ? "#f43f5e" : b.color }} />
                                        </div>
                                        <div className="flex justify-between text-xs font-bold">
                                            <span style={{ color: "#9ca3af" }}>Terpakai: {formatRupiah(b.used)}</span>
                                            <span style={{ color: "#c084fc" }}>Limit: {formatRupiah(b.limit)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

            {/* Modal Kustomisasi & Tambah Anggaran */}
            {isEditingBudget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(76,29,149,0.35)", backdropFilter: "blur(4px)" }}>
                    <div className="w-full max-w-md rounded-[2.5rem] p-6 bg-white shadow-2xl animate-in zoom-in-95 relative" style={{ maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <h2 className="text-lg font-extrabold text-purple-900 flex items-center gap-2">
                                <Settings size={18}/> Atur Anggaran
                            </h2>
                            <button onClick={() => { setIsEditingBudget(false); window.history.back(); }} className="w-8 h-8 rounded-xl flex items-center justify-center bg-purple-50 text-purple-400 hover:bg-purple-100 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto space-y-4 mb-4 pr-1 flex-1">
                            {budgets.length > 0 ? (
                                budgets.map((b) => {
                                    const Icon = b.icon || ShoppingBag;
                                    return (
                                        <div key={b.id} className="space-y-1">
                                            <div className="flex items-center justify-between px-1">
                                                <label className="text-xs font-bold text-purple-500 flex items-center gap-1.5">
                                                    <Icon size={14} color={b.color} /> {b.category}
                                                </label>
                                                <button onClick={() => handleDeleteBudget(b.id)} className="text-xs font-bold text-rose-400 hover:text-rose-600 flex items-center gap-1">
                                                    <Trash2 size={12}/> Hapus
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 bg-purple-50 rounded-xl p-2 px-3 border border-purple-100">
                                                <span className="text-sm font-bold text-purple-400">Rp</span>
                                                <input type="number" value={b.limit || ""} onChange={(e) => handleBudgetChange(b.id, e.target.value)} className="w-full bg-transparent text-sm font-extrabold text-purple-900 outline-none" />
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <p className="text-xs text-center text-purple-400 font-semibold py-4">Belum ada anggaran.</p>
                            )}

                            {isAddingBudget ? (
                                <div className="border-2 border-dashed border-purple-200 rounded-2xl p-4 mt-6 animate-in fade-in bg-purple-50/50">
                                    <p className="text-xs font-extrabold text-purple-600 mb-3">Buat Anggaran Baru</p>
                                    
                                    {availableCategoriesForBudget.length === 0 ? (
                                        <div className="text-center py-4">
                                            <span className="text-3xl block mb-2">🎉</span>
                                            <p className="text-xs font-bold text-purple-500">Semua pengeluaran sudah punya anggaran!</p>
                                            <button onClick={() => setIsAddingBudget(false)} className="mt-4 px-4 py-2 rounded-xl font-bold text-sm text-purple-500 bg-purple-100 hover:bg-purple-200 transition-colors w-full">Batal</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[10px] font-extrabold text-purple-400 mb-1.5">PILIH KATEGORI</p>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {availableCategoriesForBudget.map(cat => {
                                                        const Icon = cat.icon;
                                                        const isSelected = newBudgetCategory === cat.id;
                                                        return (
                                                            <button key={cat.id} onClick={() => setNewBudgetCategory(cat.id)} className={`rounded-2xl py-2 flex flex-col items-center gap-1 border-2 transition-all hover:scale-105 ${isSelected ? 'border-purple-400 bg-white shadow-sm' : 'border-transparent bg-white/60 hover:bg-white'}`}>
                                                                <div className="p-1 rounded-lg" style={{ color: cat.color }}><Icon size={18} strokeWidth={2.5} /></div>
                                                                <span className="text-[9px] font-bold text-center leading-tight px-1" style={{ color: "#7c3aed" }}>{cat.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-[10px] font-extrabold text-purple-400 mb-1.5 mt-2">LIMIT BULANAN</p>
                                                <div className="flex items-center gap-2 bg-white border border-purple-100 rounded-xl p-2 px-3 focus-within:ring-2 focus-within:ring-purple-200 transition-all">
                                                    <span className="text-sm font-bold text-purple-400">Rp</span>
                                                    <input type="number" placeholder="0" value={newBudgetLimit} onChange={(e) => setNewBudgetLimit(e.target.value)} className="w-full bg-transparent text-sm font-extrabold text-purple-900 outline-none" />
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mt-4 pt-2">
                                                <button onClick={() => setIsAddingBudget(false)} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-purple-500 bg-purple-100 hover:bg-purple-200 transition-colors">Batal</button>
                                                <button onClick={handleAddBudget} disabled={!newBudgetCategory || !newBudgetLimit || isSavingBudget} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center">
                                                    {isSavingBudget ? <Loader2 size={16} className="animate-spin" /> : "Simpan"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button onClick={() => { setIsAddingBudget(true); if (availableCategoriesForBudget.length > 0) setNewBudgetCategory(availableCategoriesForBudget[0].id); }} className="w-full py-3 mt-4 rounded-2xl font-bold text-sm text-purple-500 bg-purple-50 border border-dashed border-purple-200 flex items-center justify-center gap-2 hover:bg-purple-100 transition-colors">
                                    <Plus size={16} /> Tambah Anggaran Baru
                                </button>
                            )}
                        </div>

                        <div className="shrink-0 pt-2 border-t border-purple-50">
                            <button onClick={() => { setIsEditingBudget(false); window.history.back(); }} className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #c084fc, #f9a8d4)" }}>
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "Tren" && (
                <div className="px-4 mt-4 flex flex-col gap-3 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-3 mb-1">
                        <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 text-center">
                            <p className="text-[10px] font-extrabold text-emerald-600 mb-1">MASUK BULAN INI</p>
                            <p className="text-sm font-black text-emerald-700">{formatRupiah(totalIncomeThisMonth)}</p>
                        </div>
                        <div className="bg-rose-50 rounded-2xl p-3 border border-rose-100 text-center">
                            <p className="text-[10px] font-extrabold text-rose-600 mb-1">KELUAR BULAN INI</p>
                            <p className="text-sm font-black text-rose-700">{formatRupiah(totalExpenseThisMonth)}</p>
                        </div>
                    </div>
                    <div className="rounded-3xl p-4" style={{ backgroundColor: "white", boxShadow: "0 2px 16px rgba(192,132,252,0.08)" }}>
                        <p className="text-sm font-extrabold mb-1 flex items-center gap-1.5" style={{ color: "#4c1d95" }}><TrendingUp size={16} className="text-purple-500" /> Arus Kas Harian</p>
                        <p className="text-xs font-semibold mb-4" style={{ color: "#c084fc" }}>Grafik transaksi bulan ini</p>
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={lineData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#c084fc", fontWeight: 700 }} axisLine={{ stroke: "#f3e8ff" }} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: "#c084fc" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${v / 1000000}jt` : v >= 1000 ? `${v / 1000}rb` : String(v)} />
                                <RechartsTooltip content={<CustomLineTooltip />} />
                                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 2, strokeWidth: 0 }} activeDot={{ r: 5 }} name="income" />
                                <Line type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2.5} dot={{ fill: "#f43f5e", r: 2, strokeWidth: 0 }} activeDot={{ r: 5 }} name="expense" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="rounded-3xl p-4" style={{ backgroundColor: "white", boxShadow: "0 2px 8px rgba(192,132,252,0.08)" }}>
                        <p className="text-sm font-extrabold mb-3 flex items-center gap-1.5" style={{ color: "#4c1d95" }}>
                            <BarChart3 size={16} className="text-purple-500" /> Perbandingan Bulanan
                        </p>
                        <div className="flex flex-col gap-2">
                            {monthlyData.length === 0 ? (
                                <p className="text-xs text-purple-400 text-center py-4 font-semibold">Belum ada riwayat bulanan.</p>
                            ) : (
                                monthlyData.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between py-2 border-b border-purple-50 last:border-0">
                                        <span className="text-xs font-bold" style={{ color: "#6b7280" }}>{m.month}</span>
                                        <div className="flex gap-3">
                                            <span className="text-xs font-extrabold" style={{ color: "#10b981" }}>+{formatRupiah(m.income)}</span>
                                            <span className="text-xs font-extrabold" style={{ color: "#f43f5e" }}>-{formatRupiah(m.expense)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "Aset" && (
                <div className="px-4 mt-4 flex flex-col gap-3 animate-in fade-in">
                    <div className="rounded-3xl p-5" style={{ background: "linear-gradient(135deg, #c084fc 0%, #a78bfa 100%)", boxShadow: "0 4px 16px rgba(192,132,252,0.3)" }}>
                        <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.8)" }}><Coins size={14} /> Total Aset Keseluruhan</p>
                        <p className="text-3xl font-extrabold text-white mt-1">{formatRupiah(totalAsset)}</p>
                    </div>
                    {accountsData.map((acc) => {
                        // FIX: Memastikan persentase tidak tembus batas > 100% jika ada aset yang lebih besar dari total asetnya (karena ada akun minus)
                        const pctRaw = totalAsset === 0 ? 0 : (Math.max(0, acc.balance) / totalAsset) * 100;
                        const pctCapped = Math.min(100, Math.round(pctRaw)); 
                        
                        const Icon = acc.icon;
                        return (
                            <div key={acc.id} className="rounded-3xl p-4 flex items-center gap-4" style={{ backgroundColor: "white", boxShadow: "0 2px 8px rgba(192,132,252,0.08)" }}>
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: acc.color + "20", color: acc.color }}><Icon size={24} strokeWidth={2.5} /></div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5"><span className="text-sm font-extrabold" style={{ color: "#3b0764" }}>{acc.label}</span><span className="text-sm font-extrabold" style={{ color: "#4c1d95" }}>{formatRupiah(acc.balance)}</span></div>
                                    <div className="h-2 rounded-full w-full" style={{ backgroundColor: "#f3e8ff" }}>
                                        <div className="h-2 rounded-full transition-all" style={{ width: `${pctCapped}%`, backgroundColor: acc.color }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
                </>
            )}
        </div>
    );
}