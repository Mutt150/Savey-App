import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  Home, Gamepad2, HeartHandshake, Utensils, Car, HeartPulse, 
  ShoppingBag, Banknote, Laptop, Sparkles, Wallet, Smartphone, Building,
  Coffee, Music, Plane, Shirt, Book, Gift, Scissors, Wrench, PenTool,
  Cat, Dog, Cpu, Camera, Star, MonitorSmartphone, GraduationCap
} from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Icon map untuk mapping icon kustom
export const ICON_MAP: Record<string, any> = {
    Home, Gamepad2, HeartHandshake, Utensils, Car, HeartPulse,
    ShoppingBag, Banknote, Laptop, Sparkles, Wallet, Smartphone, Building,
    Coffee, Music, Plane, Shirt, Book, Gift, Scissors, Wrench, PenTool,
    Cat, Dog, Cpu, Camera, Star, MonitorSmartphone, GraduationCap
};

export const CATEGORIES = [
  { id: "living",    label: "Living",      icon: Home,           color: "#d8b4fe", type: "expense", icon_name: "Home" },
  { id: "playing",   label: "Playing",     icon: Gamepad2,       color: "#fda4af", type: "expense", icon_name: "Gamepad2" },
  { id: "giving",    label: "Giving",      icon: HeartHandshake, color: "#a7f3d0", type: "expense", icon_name: "HeartHandshake" },
  { id: "food",      label: "Makanan",     icon: Utensils,       color: "#fde68a", type: "expense", icon_name: "Utensils" },
  { id: "transport", label: "Transport",   icon: Car,            color: "#bfdbfe", type: "expense", icon_name: "Car" },
  { id: "health",    label: "Kesehatan",   icon: HeartPulse,     color: "#d1fae5", type: "expense", icon_name: "HeartPulse" },
  { id: "shopping",  label: "Belanja",     icon: ShoppingBag,    color: "#fecdd3", type: "expense", icon_name: "ShoppingBag" },
  { id: "salary",    label: "Gaji",        icon: Banknote,       color: "#a7f3d0", type: "income", icon_name: "Banknote" },
  { id: "freelance", label: "Freelance",   icon: Laptop,         color: "#c7d2fe", type: "income", icon_name: "Laptop" },
  { id: "other",     label: "Lainnya",     icon: Sparkles,       color: "#e9d5ff", type: "both", icon_name: "Sparkles" },
];

export const ACCOUNTS = [
  { id: "cash",    label: "Cash",     icon: Wallet },
  { id: "ewallet", label: "E-Wallet", icon: Smartphone },
  { id: "bank",    label: "Bank",     icon: Building },
];

// Mengambil Kategori Custom dari memori
export function getCustomCategories() {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("savey_custom_cats");
    return saved ? JSON.parse(saved) : [];
}

// Menggabungkan kategori bawaan dan kustom
export function getAllCategories() {
    const customs = getCustomCategories().map((c: any) => ({
        ...c,
        icon: ICON_MAP[c.icon_name || c.iconName] || Sparkles
    }));
    
    let hidden: string[] = [];
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem("savey_hidden_cats");
        if (stored) hidden = JSON.parse(stored);
    }

    // Gabungkan: jika ada kategori kustom dengan ID sama seperti bawaan, maka akan ditimpa (override)
    const merged = CATEGORIES.map(def => {
        const override = customs.find((c: any) => c.id === def.id);
        return override ? { ...def, ...override } : def;
    }).filter(c => !hidden.includes(c.id));

    // Tambahkan kategori kustom yang murni dibuat oleh user (bukan bawaan)
    const purelyCustom = customs.filter((c: any) => !CATEGORIES.find(def => def.id === c.id));

    const finalArray = [...merged, ...purelyCustom];
    
    // Terapkan urutan custom (jika ada) dari localStorage
    if (typeof window !== "undefined") {
        const orderStr = localStorage.getItem("savey_cat_order");
        if (orderStr) {
            const order = JSON.parse(orderStr);
            finalArray.sort((a, b) => {
                const indexA = order.indexOf(a.id);
                const indexB = order.indexOf(b.id);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
        }
    }
    
    return finalArray;
}

// Global function untuk mendapatkan icon yang aman agar tidak crash
export function getCat(catId: string) {
    const all = getAllCategories();
    return all.find((c:any) => c.id === catId) ?? all.find((c:any) => c.id === "other") ?? all[all.length - 1];
}