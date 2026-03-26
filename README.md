<div align="center">

<br/>

```
 ██████╗  █████╗ ██╗   ██╗███████╗██╗   ██╗
██╔════╝ ██╔══██╗██║   ██║██╔════╝╚██╗ ██╔╝
╚█████╗  ███████║██║   ██║█████╗   ╚████╔╝ 
 ╚═══██╗ ██╔══██║╚██╗ ██╔╝██╔══╝    ╚██╔╝  
██████╔╝ ██║  ██║ ╚████╔╝ ███████╗   ██║   
╚═════╝  ╚═╝  ╚═╝  ╚═══╝  ╚══════╝   ╚═╝  
```

### 🐱 *Save More, Worry Less.*

**Aplikasi keuangan pribadi berbasis web yang cerdas, cantik, dan nggak bikin pusing.**

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)

<br/>

**[🚀 Lihat Demo](https://my-savey.vercel.app)** · **[🐛 Laporkan Bug](mailto:mutiara.shabrina250@gmail.com)** · **[💡 Request Fitur](mailto:mutiara.shabrina250@gmail.com)**

<br/>

</div>

---

## Apa itu Savey?

**Savey** adalah aplikasi pencatatan keuangan pribadi modern berbentuk **Progressive Web App (PWA)** — bisa dibuka di browser, bisa juga diinstall langsung di homescreen HP layaknya aplikasi native. Dilengkapi **kecerdasan buatan (AI)** yang bukan sekadar gimmick: dari scan struk otomatis, split bill cerdas, sampai asisten AI yang bisa galak kalau kamu kebanyakan jajan.

> *"Nggak perlu jadi ahli keuangan buat kelola uang dengan bijak — cukup punya Savey."*

---

## Fitur Unggulan

### 🤖 AI Receipt Scanner & Smart Split Bill
Foto struk setelah nongkrong, dan biarkan Savey bekerja. AI akan membaca pesanan, harga, pajak, dan biaya layanan — lalu membaginya secara **proporsional** ke masing-masing teman. Tagihan langsung bisa dibagikan via **WhatsApp** dalam sekali tap.

### 💡 AI Financial Insight dengan 3 Persona
Pilih gaya asisten AI-mu sesuai kebutuhan:
| Persona | Cocok untuk |
|---|---|
| 😊 **Ramah** | Kamu yang butuh semangat & dukungan |
| 😤 **Galak & Sarkas** | Kamu yang perlu ditegur biar nggak boros |
| 👔 **Profesional** | Kamu yang mau analisis serius & actionable |

### 📊 Dashboard & Analisis Lengkap
- Ringkasan arus kas harian (pemasukan vs pengeluaran)
- Pie chart pengeluaran per kategori
- Budget Limit per kategori dengan peringatan overspending
- Kalender transaksi bulanan dengan indikator warna

### 📸 Kategori & Ikon Kustom
Buat kategori unikmu sendiri — pilih nama, warna, dan ikon sesuka hati. Dari "Jajan Malam" sampai "Investasi Kripto", semuanya bisa.

### 📄 Ekspor & Impor Data
- Export ke **PDF** siap cetak dengan desain cantik
- Export ke **Excel (.xlsx)** untuk analisis lebih lanjut
- Import data lama via **CSV** dengan mudah

### 📱 PWA — Install Seperti Aplikasi Native
Savey bisa diinstall langsung di homescreen smartphone tanpa perlu App Store/Play Store. Notifikasi push pengingat harian juga tersedia agar kamu nggak lupa mencatat.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | Next.js 15 (App Router, TypeScript) |
| **Styling** | Tailwind CSS v4 |
| **Database & Auth** | Supabase (PostgreSQL + RLS) |
| **AI Engine** | Google Gemini API (`gemini-2.5-flash`) |
| **Charts** | Recharts |
| **Export** | jsPDF, jsPDF-AutoTable, XLSX |
| **Icons** | Lucide React |
| **PWA & Notifikasi** | @ducanh2912/next-pwa, Web Push |

---

## Struktur Direktori

```
savey/
├── public/                    # Aset statis (PWA icons, Service Worker)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Halaman Login & Register
│   │   ├── (main)/            # Layout utama: Dashboard, Kalender, dll
│   │   ├── api/               # API Routes (Push Notifications)
│   │   └── report-preview/    # Halaman preview cetak laporan
│   ├── components/
│   │   ├── dashboard/         # Kartu ringkasan & list transaksi
│   │   ├── layout/            # TopBar, Sidebar, BottomNav, FAB
│   │   ├── more/              # Modal Export & Import
│   │   └── transaction/       # Modal Add/Edit & Detail Transaksi
│   └── lib/                   # Konfigurasi Supabase, format angka, dll
├── next.config.ts
└── package.json
```

---

## Cara Menjalankan Lokal

### Prasyarat
Pastikan sudah terinstall:
- **Node.js** v18 ke atas
- Akun **Supabase** (gratis)
- **Google Gemini API Key** dari [Google AI Studio](https://aistudio.google.com/)

### 1. Clone Repositori

```bash
git clone https://github.com/Mutt150/Savey-App.git
cd Savey-App
```

### 2. Install Dependensi

```bash
npm install
```

### 3. Konfigurasi Environment Variables

Buat file `.env.local` di root proyek:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://proyek-kamu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...

# VAPID Keys untuk Web Push Notification
NEXT_PUBLIC_VAPID_PUBLIC_KEY=B...
VAPID_PRIVATE_KEY=...
```

> **Generate VAPID Keys:**
> ```bash
> npx web-push generate-vapid-keys
> ```

### 4. Setup Database Supabase

Buat tabel-tabel berikut di Supabase (`public` schema):

```sql
-- Tabel transaksi
transactions (id, user_id, type, amount, category, account, date, note)

-- Kategori kustom
custom_categories (id, user_id, label, icon_name, color, type)

-- Anggaran per kategori
budgets (id, user_id, category, limit_amount, color, icon_name)
```

> ⚠️ Jangan lupa aktifkan **Row Level Security (RLS)** berdasarkan `user_id` di setiap tabel.

### 5. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser. 

---

## Design System

Savey menggunakan palet **Lilac & Cream** yang tenang namun tetap hidup:

| Token | Warna | Hex |
|---|---|---|
| Background | Cream | `#fdf8f0` |
| Primary | Lilac 400 | `#c084fc` |
| Accent | Lilac 500 | `#a855f7` |
| Income | Emerald | `#10b981` |
| Expense | Rose | `#f43f5e` |

---

## 🤝 Kontribusi

Kontribusi selalu disambut hangat! 

```bash
# 1. Fork repositori ini
# 2. Buat branch fitur baru
git checkout -b feature/nama-fitur-keren

# 3. Commit perubahan kamu
git commit -m 'feat: tambah fitur keren'

# 4. Push ke branch
git push origin feature/nama-fitur-keren

# 5. Buka Pull Request
```

---

## 📄 Lisensi

Hak Cipta © 2026 **Savey**. All rights reserved.

---

<div align="center">

Dibuat dengan 🐱 dan ☕ untuk kebebasan finansial yang lebih baik.

**[⬆ Kembali ke atas](#)**

</div>
