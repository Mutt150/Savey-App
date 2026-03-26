"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    ArrowLeft, User, Lock, Trash2, Calendar, DollarSign, EyeOff, 
    Tags, CreditCard, Bell, Bot, Shield, ChevronRight, Image as ImageIcon, Loader2,
    Save, Plus, X, Star, Plane, Shirt, Book, Gift, Scissors, Wrench, PenTool, Coffee, Music,
    Home, Gamepad2, HeartHandshake, Utensils, Car, HeartPulse, ShoppingBag, ChevronUp, ChevronDown
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCustomCategories, getAllCategories, ICON_MAP, CATEGORIES } from "@/lib/utils";

type MenuKey = "profile" | "preferences" | "customization" | "ai" | "security";

export default function SettingsPage() {
    const router = useRouter();
    const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
    const [userData, setUserData] = useState<{ id: string; email: string; name: string } | null>(null);
    const [isUpdatingName, setIsUpdatingName] = useState(false);
    
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // State untuk UI Pengaturan
    const [cycleStart, setCycleStart] = useState("1");
    const [currency, setCurrency] = useState("IDR");
    const [hideBalance, setHideBalance] = useState(false);
    const [aiPersona, setAiPersona] = useState("ramah");
    const [dailyReminder, setDailyReminder] = useState(true);
    const [appLock, setAppLock] = useState(false);

    // State Kustomisasi Kategori
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [manageCatTab, setManageCatTab] = useState<"expense" | "income">("expense"); // State Baru untuk Tab
    const [customCats, setCustomCats] = useState<any[]>([]);
    const [newCatName, setNewCatName] = useState("");
    const [newCatType, setNewCatType] = useState("expense");
    const [newCatIcon, setNewCatIcon] = useState("Star");
    const [newCatColor, setNewCatColor] = useState("#c084fc");
    const [isSavingCat, setIsSavingCat] = useState(false);
    const [editingCatId, setEditingCatId] = useState<string | null>(null);

    // List Ikon yang diperbanyak
    const ICON_CHOICES = [
        "Star", "Cat", "Dog", "Cpu", "Camera", "MonitorSmartphone", "GraduationCap",
        "Plane", "Shirt", "Book", "Gift", "Scissors", "Wrench", "PenTool", "Coffee", "Music",
        "Home", "Gamepad2", "HeartHandshake", "Utensils", "Car", "HeartPulse", "ShoppingBag"
    ];

    useEffect(() => {
        const fetchUserAndData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserData({
                    id: user.id,
                    email: user.email || "",
                    name: user.user_metadata?.full_name || "User Savey",
                });

                // Fetch Custom Categories dari Supabase
                const { data: catData } = await supabase
                    .from('custom_categories')
                    .select('*')
                    .eq('user_id', user.id);
                
                if (catData) {
                    localStorage.setItem("savey_custom_cats", JSON.stringify(catData));
                }
                setCustomCats(getAllCategories());
            }
        };
        fetchUserAndData();

        const handleUpdateCats = () => setCustomCats(getAllCategories());
        window.addEventListener("savey_preferences_updated", handleUpdateCats);

        setCycleStart(localStorage.getItem("savey_cycle") || "1");
        setCurrency(localStorage.getItem("savey_currency") || "IDR");
        setHideBalance(localStorage.getItem("savey_hide_balance") === "true");
        setAiPersona(localStorage.getItem("savey_ai_persona") || "ramah");
        setDailyReminder(localStorage.getItem("savey_daily_reminder") !== "false");
        setAppLock(localStorage.getItem("savey_app_lock") === "true");
        
        const savedAvatar = localStorage.getItem("savey_custom_avatar");
        if (savedAvatar) setAvatarUrl(savedAvatar);

        if (window.innerWidth >= 768) setActiveMenu("profile");

        return () => window.removeEventListener("savey_preferences_updated", handleUpdateCats);
    }, []);

    // LOGIKA TOMBOL BACK HP (Hardware Back Button)
    useEffect(() => {
        if (activeMenu || showCategoryManager) {
            window.history.pushState({ modalOpen: true }, "");
        }

        const handlePopState = () => {
            if (showCategoryManager) {
                setShowCategoryManager(false);
            } else if (activeMenu && window.innerWidth < 768) {
                setActiveMenu(null);
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [activeMenu, showCategoryManager]);

    const handleBack = () => {
        if (showCategoryManager) {
            setShowCategoryManager(false);
            window.history.back();
        } else if (activeMenu && window.innerWidth < 768) {
            setActiveMenu(null);
            window.history.back();
        } else {
            router.back();
        }
    };

    const savePreference = (key: string, value: string) => {
        localStorage.setItem(key, value);
        window.dispatchEvent(new Event("savey_preferences_updated"));
    };

    const handleSavePreferences = () => {
        savePreference("savey_cycle", cycleStart);
        savePreference("savey_currency", currency);
        savePreference("savey_hide_balance", String(hideBalance));
        alert("Preferensi keuangan berhasil disimpan!");
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setAvatarUrl(base64String);
                localStorage.setItem("savey_custom_avatar", base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateName = async () => {
        const newName = window.prompt("Masukkan nama panggilan baru:", userData?.name);
        if (!newName || newName.trim() === "" || newName === userData?.name) return;

        setIsUpdatingName(true);
        try {
            const { error } = await supabase.auth.updateUser({ data: { full_name: newName } });
            if (error) throw error;
            
            setUserData(prev => prev ? { ...prev, name: newName } : null);
            window.dispatchEvent(new Event("savey_profile_updated"));
            alert("Nama berhasil diubah!");
        } catch (error: any) {
            alert("Gagal mengubah nama: " + error.message);
        } finally {
            setIsUpdatingName(false);
        }
    };

    const handleUpdatePassword = async () => {
        const newPassword = window.prompt("Masukkan kata sandi baru (minimal 6 karakter):");
        if (!newPassword) return;
        if (newPassword.length < 6) {
            alert("Kata sandi terlalu pendek. Minimal 6 karakter.");
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            alert("Kata sandi berhasil diubah! Silakan gunakan sandi baru untuk login selanjutnya.");
        } catch (error: any) {
            alert("Gagal mengubah kata sandi: " + error.message);
        }
    };

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const handleToggleNotification = async () => {
        const val = !dailyReminder;
        if (val) {
            if ("Notification" in window && "serviceWorker" in navigator) {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    setDailyReminder(true);
                    savePreference("savey_daily_reminder", "true");
                    
                    try {
                        const registration = await navigator.serviceWorker.ready;
                        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                        if (!vapidPublicKey) throw new Error("VAPID Public Key belum diset di .env");

                        const subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                        });

                        const response = await fetch('/api/send-notif', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                subscription: subscription,
                                title: "Savey Siap Digunakan! 🚀",
                                message: "Notifikasi latar belakang berhasil diaktifkan. Kamu akan menerima pengingat harian di sini."
                            })
                        });

                        if (!response.ok) throw new Error("Gagal mendaftarkan notifikasi ke server.");
                        alert("Notifikasi latar belakang berhasil diaktifkan!");

                    } catch (error: any) {
                        console.error("Gagal subscribe notifikasi:", error);
                        alert("Gagal mengaktifkan push notifikasi. Pastikan aplikasimu berjalan di HTTPS atau localhost, dan file .env sudah lengkap.");
                        setDailyReminder(false);
                    }
                } else {
                    alert("Izin notifikasi ditolak oleh browser. Buka pengaturan browser untuk mengizinkan.");
                    setDailyReminder(false);
                }
            } else {
                alert("Browser kamu tidak mendukung fitur notifikasi push (butuh HTTPS dan Service Worker PWA).");
            }
        } else {
            setDailyReminder(false);
            savePreference("savey_daily_reminder", "false");
        }
    };

    // LOGIKA KATEGORI (Direvisi untuk mendukung Tab)
    const moveCat = (catId: string, direction: -1 | 1) => {
        const newCats = [...customCats];
        
        // Hanya pindahkan index di kategori yang jenisnya sama
        const visibleCats = newCats.filter(c => c.type === manageCatTab || c.type === "both");
        const currentIdx = visibleCats.findIndex(c => c.id === catId);
        
        if (currentIdx + direction < 0 || currentIdx + direction >= visibleCats.length) return;
        
        const swapWithId = visibleCats[currentIdx + direction].id;
        
        const idx1 = newCats.findIndex(c => c.id === catId);
        const idx2 = newCats.findIndex(c => c.id === swapWithId);
        
        const temp = newCats[idx1];
        newCats[idx1] = newCats[idx2];
        newCats[idx2] = temp;
        
        setCustomCats(newCats);
        
        const order = newCats.map(c => c.id);
        localStorage.setItem("savey_cat_order", JSON.stringify(order));
        window.dispatchEvent(new Event("savey_preferences_updated"));
    };

    const handleEditCategoryInit = (cat: any) => {
        setEditingCatId(cat.id);
        setNewCatName(cat.label);
        setNewCatType(cat.type);
        setNewCatIcon(cat.icon_name || "Star");
        setNewCatColor(cat.color);
        document.getElementById("cat-form")?.scrollIntoView({ behavior: "smooth" });
    };

    const handleAddCategory = async () => {
        if (!newCatName.trim() || !userData) return;
        setIsSavingCat(true);

        try {
            const idToSave = editingCatId || `custom_${Date.now()}`;
            const newCat = {
                id: idToSave,
                user_id: userData.id,
                label: newCatName.trim(),
                icon_name: newCatIcon,
                color: newCatColor,
                type: newCatType
            };

            if (editingCatId && getCustomCategories().find((c:any) => c.id === editingCatId)) {
                const { error } = await supabase.from('custom_categories').update({
                    label: newCatName.trim(),
                    icon_name: newCatIcon,
                    color: newCatColor,
                    type: newCatType
                }).eq('id', editingCatId);
                
                if (error) throw error;
            } else {
                const { data: existing } = await supabase.from('custom_categories').select('id').eq('id', idToSave).single();
                
                if (existing) {
                    const { error } = await supabase.from('custom_categories').update(newCat).eq('id', idToSave);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('custom_categories').insert(newCat);
                    if (error) throw error;
                }
            }

            const { data: latestCats } = await supabase.from('custom_categories').select('*').eq('user_id', userData.id);
            localStorage.setItem("savey_custom_cats", JSON.stringify(latestCats || []));
            
            setCustomCats(getAllCategories());
            window.dispatchEvent(new Event("savey_preferences_updated"));
            
            setNewCatName("");
            setNewCatType("expense");
            setNewCatIcon("Star");
            setNewCatColor("#c084fc");
            setEditingCatId(null);
            
            // Pindahkan tab ke tipe yang baru dibuat
            setManageCatTab(newCat.type === "both" ? "expense" : newCat.type as "expense" | "income");
        } catch (error: any) {
            alert(`Gagal ${editingCatId ? 'mengedit' : 'menambah'} kategori: ` + error.message);
        } finally {
            setIsSavingCat(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!window.confirm("Yakin ingin menghapus kategori ini? Transaksi lama tidak akan hilang, namun kategorinya akan menjadi 'Lainnya'.")) return;
        
        try {
            const isDefault = CATEGORIES.some(c => c.id === id);
            
            if (isDefault) {
                const hidden = JSON.parse(localStorage.getItem("savey_hidden_cats") || "[]");
                if (!hidden.includes(id)) {
                    hidden.push(id);
                    localStorage.setItem("savey_hidden_cats", JSON.stringify(hidden));
                }
                await supabase.from('custom_categories').delete().eq('id', id);
            } else {
                const { error } = await supabase.from('custom_categories').delete().eq('id', id);
                if (error) throw error;
            }

            const { data: latestCats } = await supabase.from('custom_categories').select('*').eq('user_id', userData?.id);
            localStorage.setItem("savey_custom_cats", JSON.stringify(latestCats || []));
            
            setCustomCats(getAllCategories());
            window.dispatchEvent(new Event("savey_preferences_updated"));
        } catch (error: any) {
            alert("Gagal menghapus kategori: " + error.message);
        }
    };

    const MENUS = [
        { id: "profile", label: "Profil & Akun", desc: "Avatar, nama, sandi", icon: User },
        { id: "preferences", label: "Preferensi Keuangan", desc: "Mata uang, siklus, sensor", icon: DollarSign },
        { id: "customization", label: "Kustomisasi", desc: "Kategori pengeluaran & ikon", icon: Tags },
        { id: "ai", label: "AI & Notifikasi", desc: "Persona asisten & pengingat", icon: Bot },
        { id: "security", label: "Keamanan", desc: "Kunci aplikasi", icon: Shield },
    ] as const;

    const renderProfileContent = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 md:slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-5 rounded-3xl border border-purple-50 shadow-sm flex items-center gap-4">
                <div className="relative group cursor-pointer shrink-0" onClick={() => document.getElementById('avatarUpload')?.click()}>
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-purple-200">
                        <img src={avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${userData?.name || 'Felix'}&backgroundColor=f3e8ff`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon size={20} className="text-white" />
                    </div>
                </div>
                <input type="file" id="avatarUpload" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-purple-900 truncate flex items-center gap-2">
                        {userData?.name || "Memuat..."} 
                        {isUpdatingName && <Loader2 size={14} className="animate-spin text-purple-400" />}
                    </h3>
                    <p className="text-sm font-semibold text-purple-400 truncate">{userData?.email}</p>
                    <p className="text-[10px] font-bold text-purple-300 mt-1 flex items-center gap-1"><ImageIcon size={10}/> Tap foto untuk mengubah</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-purple-50 shadow-sm overflow-hidden">
                <div onClick={handleUpdateName} className="p-4 border-b border-purple-50 flex justify-between items-center hover:bg-purple-50/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-xl text-purple-500"><User size={18} /></div>
                        <span className="font-bold text-sm text-purple-900">Ubah Nama Panggilan</span>
                    </div>
                    <ChevronRight size={18} className="text-purple-200" />
                </div>
                <div onClick={handleUpdatePassword} className="p-4 flex justify-between items-center hover:bg-purple-50/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-xl text-purple-500"><Lock size={18} /></div>
                        <span className="font-bold text-sm text-purple-900">Ubah Password</span>
                    </div>
                    <ChevronRight size={18} className="text-purple-200" />
                </div>
            </div>
        </div>
    );

    const renderPreferencesContent = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 md:slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-3xl border border-purple-50 shadow-sm p-5 space-y-6">
                <div>
                    <label className="flex items-center gap-2 text-sm font-extrabold text-purple-900 mb-2"><Calendar size={18} className="text-purple-500" /> Tanggal Siklus Laporan</label>
                    <p className="text-xs font-semibold text-purple-400 mb-3">Pilih tanggal awal perhitungan bulan.</p>
                    <div className="relative">
                        <select value={cycleStart} onChange={(e) => setCycleStart(e.target.value)} className="w-full bg-purple-50 border border-purple-100 text-sm font-bold text-purple-900 rounded-xl p-3.5 outline-none focus:ring-2 ring-purple-300 appearance-none">
                            <option value="1">Tanggal 1 (Default)</option>
                            <option value="25">Tanggal 25 (Gajian)</option>
                            <option value="28">Tanggal 28</option>
                        </select>
                        <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 rotate-90 pointer-events-none" />
                    </div>
                </div>
                <hr className="border-purple-50" />
                <div>
                    <label className="flex items-center gap-2 text-sm font-extrabold text-purple-900 mb-3"><DollarSign size={18} className="text-purple-500" /> Mata Uang Utama</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setCurrency("IDR")} className={`py-3.5 rounded-xl font-bold text-sm border-2 transition-all ${currency === "IDR" ? "bg-purple-100 border-purple-400 text-purple-800 shadow-sm" : "bg-white border-purple-50 text-purple-400 hover:border-purple-200"}`}>Rp Rupiah</button>
                        <button onClick={() => setCurrency("USD")} className={`py-3.5 rounded-xl font-bold text-sm border-2 transition-all ${currency === "USD" ? "bg-purple-100 border-purple-400 text-purple-800 shadow-sm" : "bg-white border-purple-50 text-purple-400 hover:border-purple-200"}`}>$ USD</button>
                    </div>
                </div>
                <hr className="border-purple-50" />
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-extrabold text-purple-900"><EyeOff size={18} className="text-purple-500" /> Sensor Saldo Default</label>
                        <p className="text-xs font-semibold text-purple-400 mt-1">Saldo disembunyikan otomatis.</p>
                    </div>
                    <button onClick={() => setHideBalance(!hideBalance)} className={`w-12 h-6 rounded-full p-1 shrink-0 transition-colors duration-300 ${hideBalance ? "bg-purple-500" : "bg-purple-200"}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${hideBalance ? "translate-x-6" : "translate-x-0"}`} />
                    </button>
                </div>
                <div className="pt-4 border-t border-purple-50">
                    <button onClick={handleSavePreferences} className="w-full py-4 rounded-xl font-extrabold text-white text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #c084fc, #a78bfa)" }}>
                        <Save size={18} /> Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    );

    const renderCustomizationContent = () => {
        if (showCategoryManager) {
            // Filter kategori berdasarkan Tab saat ini
            const displayedCats = customCats.filter(c => c.type === manageCatTab || c.type === "both");

            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-white rounded-3xl border border-purple-50 shadow-sm p-5">
                        <h3 className="text-sm font-extrabold text-purple-900 mb-4">Kategori Kustom Tersimpan</h3>
                        
                        {/* Tab Filter Pengeluaran vs Pemasukan */}
                        <div className="flex rounded-2xl p-1 mb-5" style={{ backgroundColor: "#f3e8ff" }}>
                            <button onClick={() => setManageCatTab("expense")} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${manageCatTab === 'expense' ? 'bg-white text-rose-500 shadow-sm' : 'text-purple-400 hover:text-purple-500'}`}>Pengeluaran</button>
                            <button onClick={() => setManageCatTab("income")} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${manageCatTab === 'income' ? 'bg-white text-emerald-500 shadow-sm' : 'text-purple-400 hover:text-purple-500'}`}>Pemasukan</button>
                        </div>

                        {displayedCats.length === 0 ? (
                            <div className="p-4 bg-purple-50 rounded-xl border border-dashed border-purple-200 text-center">
                                <p className="text-xs font-semibold text-purple-400">Belum ada kategori di bagian ini.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {displayedCats.map((cat, index) => {
                                    const Icon = ICON_MAP[cat.icon_name] || Star;
                                    return (
                                        <div key={cat.id} className="flex items-center p-3 border border-purple-50 rounded-xl bg-white shadow-sm">
                                            <div className="flex flex-col gap-1 mr-3 bg-purple-50 rounded-lg px-1 py-0.5">
                                                <button onClick={() => moveCat(cat.id, -1)} disabled={index === 0} className="text-purple-300 hover:text-purple-600 disabled:opacity-30"><ChevronUp size={16}/></button>
                                                <button onClick={() => moveCat(cat.id, 1)} disabled={index === displayedCats.length - 1} className="text-purple-300 hover:text-purple-600 disabled:opacity-30"><ChevronDown size={16}/></button>
                                            </div>

                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + "20", color: cat.color }}>
                                                    <Icon size={18} strokeWidth={2.5}/>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-purple-900 truncate">{cat.label}</p>
                                                    <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">{cat.type === "expense" || cat.type === "both" && manageCatTab === "expense" ? "Pengeluaran" : "Pemasukan"}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 shrink-0">
                                                <button onClick={() => handleEditCategoryInit(cat)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100">
                                                    <PenTool size={14}/>
                                                </button>
                                                <button onClick={() => handleDeleteCategory(cat.id)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100">
                                                    <Trash2 size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        <hr className="border-purple-50 my-6" id="cat-form" />
                        
                        <h3 className="text-sm font-extrabold text-purple-900 mb-4">
                            {editingCatId ? "Edit Kategori" : "Buat Kategori Baru"}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-purple-500 mb-1 block">Tipe</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setNewCatType("expense")} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${newCatType === 'expense' ? 'bg-rose-100 text-rose-600' : 'bg-purple-50 text-purple-400'}`}>Pengeluaran</button>
                                    <button onClick={() => setNewCatType("income")} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${newCatType === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-50 text-purple-400'}`}>Pemasukan</button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-purple-500 mb-1 block">Nama Kategori</label>
                                <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Misal: Skincare, Pet..." className="w-full bg-purple-50 border border-purple-100 text-sm font-bold text-purple-900 rounded-xl p-3 outline-none focus:ring-2 ring-purple-300" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-purple-500 mb-1 block">Pilih Ikon</label>
                                <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                                    {ICON_CHOICES.map(icon => {
                                        const Icon = ICON_MAP[icon] || Star;
                                        return (
                                            <button key={icon} onClick={() => setNewCatIcon(icon)} className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-all ${newCatIcon === icon ? 'bg-purple-200 text-purple-700 shadow-sm border-2 border-purple-400' : 'bg-purple-50 text-purple-400 border-2 border-transparent'}`}>
                                                <Icon size={20} />
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-purple-500 mb-1 block">Pilih Warna</label>
                                <div className="flex gap-2">
                                    {["#c084fc", "#fbbf24", "#fda4af", "#93c5fd", "#6ee7b7", "#f43f5e", "#10b981", "#3b82f6", "#eab308"].map(color => (
                                        <button key={color} onClick={() => setNewCatColor(color)} className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-transform ${newCatColor === color ? 'scale-110 border-2 border-purple-900' : ''}`} style={{ backgroundColor: color }} />
                                    ))}
                                </div>
                            </div>

                            <button onClick={handleAddCategory} disabled={!newCatName.trim() || isSavingCat} className="w-full py-3.5 mt-2 rounded-xl font-extrabold text-white text-sm bg-purple-500 hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {isSavingCat ? <Loader2 size={18} className="animate-spin" /> : editingCatId ? <Save size={18}/> : <Plus size={18}/>} 
                                {editingCatId ? "Simpan Perubahan" : "Tambah Kategori"}
                            </button>
                            
                            {editingCatId && (
                                <button onClick={() => { setEditingCatId(null); setNewCatName(""); }} className="w-full py-3 rounded-xl font-bold text-purple-500 text-sm bg-purple-50 hover:bg-purple-100 transition-colors">
                                    Batal Edit
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 md:slide-in-from-bottom-4 duration-300">
                <div className="bg-white rounded-3xl border border-purple-50 shadow-sm overflow-hidden">
                    <div onClick={() => setShowCategoryManager(true)} className="p-5 border-b border-purple-50 flex justify-between items-center hover:bg-purple-50/50 cursor-pointer transition-colors">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Tags size={18} className="text-purple-500" />
                                <span className="font-bold text-sm text-purple-900">Kelola Kategori</span>
                            </div>
                            <p className="text-xs font-semibold text-purple-400 ml-7">Tambah, edit, dan urutkan kategori</p>
                        </div>
                        <ChevronRight size={18} className="text-purple-200" />
                    </div>

                    <div onClick={() => alert("Fitur kelola metode pembayaran sedang dikembangkan!")} className="p-5 flex justify-between items-center hover:bg-purple-50/50 cursor-pointer transition-colors">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <CreditCard size={18} className="text-purple-500" />
                                <span className="font-bold text-sm text-purple-900">Kelola Akun Pembayaran</span>
                            </div>
                            <p className="text-xs font-semibold text-purple-400 ml-7">BCA, Gopay, Uang Tunai, dll.</p>
                        </div>
                        <ChevronRight size={18} className="text-purple-200" />
                    </div>
                </div>
            </div>
        );
    };

    const renderAIContent = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 md:slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-3xl border border-purple-50 shadow-sm p-5 space-y-6">
                <div>
                    <label className="flex items-center gap-2 text-sm font-extrabold text-purple-900 mb-3"><Bot size={18} className="text-purple-500" /> Gaya Bahasa AI Savey</label>
                    <div className="space-y-3">
                        {[{ id: "ramah", label: "Ramah & Suportif", desc: "Memberi semangat dan insight positif." }, { id: "sarkas", label: "Galak & Sarkas", desc: "Cocok buat yang boros dan butuh dimarahi biar hemat! 😂" }, { id: "profesional", label: "Profesional", desc: "Singkat, padat, analitis." }].map(p => (
                            <div key={p.id} onClick={() => { setAiPersona(p.id); savePreference("savey_ai_persona", p.id); }} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${aiPersona === p.id ? 'bg-purple-50 border-purple-400 shadow-sm' : 'bg-white border-purple-50 hover:border-purple-200'}`}>
                                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${aiPersona === p.id ? 'border-purple-500' : 'border-purple-200'}`}>
                                    {aiPersona === p.id && <div className="w-2 h-2 bg-purple-500 rounded-full" />}
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${aiPersona === p.id ? 'text-purple-900' : 'text-purple-600'}`}>{p.label}</p>
                                    <p className="text-xs font-semibold text-purple-400 mt-0.5 leading-relaxed">{p.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSecurityContent = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 md:slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-3xl border border-purple-50 shadow-sm p-5 space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-extrabold text-purple-900"><Shield size={18} className="text-purple-500" /> Kunci Aplikasi</label>
                        <p className="text-xs font-semibold text-purple-400 mt-1">Fitur ini belum aktif di versi web.</p>
                    </div>
                    <button disabled className={`w-12 h-6 rounded-full p-1 shrink-0 bg-purple-100 opacity-50 cursor-not-allowed`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm`} />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fdf8f0] pb-20 md:pb-0">
            <header className={`px-5 pt-6 pb-4 bg-[#fdf8f0]/90 backdrop-blur-md border-b border-purple-100 sticky top-0 z-40 items-center gap-3 ${activeMenu ? 'hidden md:flex' : 'flex'}`}>
                <button onClick={handleBack} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-purple-50 text-purple-600 hover:bg-purple-50 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <h1 className="text-lg font-extrabold text-purple-900">Pengaturan</h1>
            </header>

            <header className={`px-5 pt-6 pb-4 bg-[#fdf8f0]/90 backdrop-blur-md border-b border-purple-100 sticky top-0 z-40 items-center gap-3 md:hidden ${activeMenu ? 'flex' : 'hidden'}`}>
                <button onClick={handleBack} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-purple-50 text-purple-600 hover:bg-purple-50 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <h1 className="text-lg font-extrabold text-purple-900 truncate">
                    {showCategoryManager ? "Kelola Kategori" : MENUS.find(m => m.id === activeMenu)?.label}
                </h1>
            </header>

            <div className="max-w-5xl mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-8">
                <div className={`w-full md:w-[35%] shrink-0 flex-col ${activeMenu ? 'hidden md:flex' : 'flex'}`}>
                    
                    <div 
                        onClick={() => { setActiveMenu("profile"); setShowCategoryManager(false); }}
                        className="bg-white rounded-[2rem] p-4 mb-6 flex items-center gap-4 cursor-pointer border border-purple-100 shadow-sm hover:shadow-md transition-all hover:border-purple-300"
                    >
                        <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center border-2 border-purple-200 overflow-hidden shrink-0">
                            <img src={avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${userData?.name || 'Felix'}&backgroundColor=f3e8ff`} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-extrabold text-base text-purple-900 truncate">{userData?.name || "Memuat..."}</h2>
                            <p className="text-[11px] font-semibold text-purple-400 truncate">{userData?.email || "Memuat data..."}</p>
                        </div>
                        <ChevronRight size={20} className="text-purple-300 shrink-0" />
                    </div>

                    <div className="bg-white rounded-[2rem] border border-purple-100 shadow-sm overflow-hidden mb-6">
                        {MENUS.map((menu, index) => {
                            const Icon = menu.icon;
                            const isActive = activeMenu === menu.id;
                            return (
                                <button 
                                    key={menu.id} 
                                    onClick={() => { setActiveMenu(menu.id); setShowCategoryManager(false); }} 
                                    className={`w-full text-left p-4 flex items-center justify-between transition-colors ${index !== MENUS.length - 1 ? 'border-b border-purple-50' : ''} ${isActive ? 'bg-purple-50/50' : 'hover:bg-purple-50/30'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${isActive ? 'bg-purple-500 text-white shadow-md' : 'bg-purple-50 text-purple-500'}`}>
                                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                        </div>
                                        <div>
                                            <span className={`block text-sm font-extrabold ${isActive ? 'text-purple-900' : 'text-purple-800'}`}>{menu.label}</span>
                                            <span className="block text-[11px] font-semibold text-purple-400 mt-0.5">{menu.desc}</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className={isActive ? 'text-purple-500' : 'text-purple-200'} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className={`w-full md:w-[65%] ${!activeMenu ? 'hidden md:block' : 'block'}`}>
                    <div className="mb-6 hidden md:block">
                        <h2 className="text-2xl font-black text-purple-900 flex items-center gap-2">
                            {showCategoryManager && <button onClick={() => setShowCategoryManager(false)} className="mr-2 p-2 hover:bg-purple-100 rounded-lg text-purple-500"><ArrowLeft size={20}/></button>}
                            {showCategoryManager ? "Kelola Kategori" : activeMenu ? MENUS.find(m => m.id === activeMenu)?.label : "Pilih Menu"}
                        </h2>
                    </div>
                    
                    {!activeMenu && (
                        <div className="hidden md:flex flex-col items-center justify-center py-20 text-center opacity-60">
                            <Bot size={64} className="text-purple-300 mb-4" />
                            <p className="text-lg font-bold text-purple-400">Pilih pengaturan di samping kiri</p>
                        </div>
                    )}

                    {activeMenu === "profile" && renderProfileContent()}
                    {activeMenu === "preferences" && renderPreferencesContent()}
                    {activeMenu === "customization" && renderCustomizationContent()}
                    {activeMenu === "ai" && renderAIContent()}
                    {activeMenu === "security" && renderSecurityContent()}
                </div>
            </div>
        </div>
    );
}