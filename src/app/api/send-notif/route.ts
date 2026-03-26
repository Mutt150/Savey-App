import { NextResponse } from 'next/server';
import webpush from 'web-push';

// KONFIGURASI VAPID KEYS (KTP/Izin Resmi Robot Kita)
// Ambil dari file .env yang sudah generate sebelumnya
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "";

// Set up kredensial web-push
// Ganti "mailto:mutiara.shabrina250@gmail.com" dengan email aktifmu (wajib untuk web-push)
webpush.setVapidDetails(
    'mailto:mutiara.shabrina250@gmail.com',
    publicVapidKey,
    privateVapidKey
);

export async function POST(request: Request) {
    try {
        // 1. Menerima data dari aplikasi frontend (alamat HP user & isi pesan)
        const body = await request.json();
        const { subscription, title, message } = body;

        // Validasi jika data tidak lengkap
        if (!subscription || !title || !message) {
            return NextResponse.json(
                { success: false, error: "Data tidak lengkap. Butuh subscription, title, dan message." }, 
                { status: 400 }
            );
        }

        // 2. Robot kita menyerahkan pesan ke Kurir Google (FCM) / Apple (APNs)
        const payload = JSON.stringify({ title, body: message });
        
        await webpush.sendNotification(subscription, payload);

        // 3. Beri laporan balik ke frontend bahwa tugas selesai
        return NextResponse.json({ 
            success: true, 
            message: "Notifikasi berhasil diserahkan ke sistem Push." 
        });

    } catch (error: any) {
        console.error("Gagal mengirim notifikasi push:", error);
        
        return NextResponse.json(
            { success: false, error: "Gagal mengirim notifikasi: " + error.message }, 
            { status: 500 }
        );
    }
}