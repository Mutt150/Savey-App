"use client";

import { useState, useEffect } from "react";
import { Cat, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, User, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace("/dashboard");
            }
        };
        checkSession();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");
        setSuccessMsg("");
        
        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) {
                    if (error.message.includes("Email not confirmed")) {
                        throw new Error("Email belum dikonfirmasi. Silakan cek inbox/spam email kamu.");
                    }
                    throw error;
                }
                
                if (data.user) router.replace("/dashboard");
                
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: name,
                        }
                    }
                });

                if (error) throw error;

                if (data.user && data.session === null) {
                    setSuccessMsg("Pendaftaran berhasil! Cek inbox atau folder spam email kamu untuk verifikasi.");
                    setIsLogin(true); 
                } else {
                    router.replace("/dashboard");
                }
            }
        } catch (error: any) {
            setErrorMsg(error.message || "Terjadi kesalahan pada sistem");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setErrorMsg("");
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`
                }
            });
            if (error) throw error;
        } catch (error: any) {
            setErrorMsg(error.message || "Gagal login dengan Google");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#fdf8f0] relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-[pulse_6s_ease-in-out_infinite]" />
            <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-[pulse_6s_ease-in-out_infinite_2000ms]" />
            <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-[pulse_6s_ease-in-out_infinite_4000ms]" />

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-[0_8px_40px_rgba(192,132,252,0.15)] border border-purple-100 relative z-10 animate-in zoom-in-95 duration-500">
                
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-[#f3e8ff] rounded-3xl flex items-center justify-center text-[#7c3aed] shadow-inner mb-4 relative group">
                        <Sparkles size={16} className="absolute -top-1 -right-1 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Cat size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-[#c084fc] to-[#f9a8d4] bg-clip-text text-transparent">
                        Savey
                    </h1>
                    <p className="text-sm font-bold text-purple-400 mt-2 text-center">
                        {isLogin ? "Selamat datang kembali! Yuk cek keuanganmu." : "Mulai perjalanan finansialmu hari ini."}
                    </p>
                </div>

                {errorMsg && (
                    <div className="mb-5 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-top-2">
                        <p className="text-xs font-bold text-rose-500 text-center">{errorMsg}</p>
                    </div>
                )}

                {successMsg && (
                    <div className="mb-5 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in slide-in-from-top-2 flex flex-col items-center gap-2">
                        <CheckCircle2 size={24} className="text-emerald-500" />
                        <p className="text-xs font-bold text-emerald-600 text-center">{successMsg}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {!isLogin && (
                        <div className="space-y-1.5 animate-in slide-in-from-top-2 fade-in duration-300">
                            <label className="text-xs font-extrabold text-purple-900 ml-1">Nama Lengkap</label>
                            <div className="relative flex items-center">
                                <User size={18} className="absolute left-4 text-purple-300" />
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={!isLogin}
                                    placeholder="Nama panggilanmu"
                                    className="w-full bg-white border border-purple-100 text-sm font-bold rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-purple-900 placeholder:text-purple-300 shadow-sm"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-purple-900 ml-1">Email</label>
                        <div className="relative flex items-center">
                            <Mail size={18} className="absolute left-4 text-purple-300" />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="nama@email.com"
                                className="w-full bg-white border border-purple-100 text-sm font-bold rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-purple-900 placeholder:text-purple-300 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-purple-900 ml-1">Password</label>
                        <div className="relative flex items-center">
                            <Lock size={18} className="absolute left-4 text-purple-300" />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-white border border-purple-100 text-sm font-bold rounded-2xl py-3.5 pl-11 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-purple-900 placeholder:text-purple-300 shadow-sm"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 text-purple-300 hover:text-purple-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {isLogin && (
                        <div className="flex justify-end">
                            <button type="button" className="text-xs font-bold text-purple-500 hover:text-purple-700 transition-colors">
                                Lupa password?
                            </button>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-4 mt-2 rounded-2xl font-extrabold text-white text-sm shadow-[0_4px_14px_rgba(192,132,252,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
                        style={{ background: "linear-gradient(135deg, #c084fc, #f9a8d4)" }}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {isLogin ? "Masuk ke Dashboard" : "Buat Akun Sekarang"} <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 flex items-center gap-3">
                    <div className="flex-1 h-px bg-purple-100"></div>
                    <span className="text-xs font-bold text-purple-300">
                        Atau {isLogin ? 'masuk' : 'daftar'} dengan
                    </span>
                    <div className="flex-1 h-px bg-purple-100"></div>
                </div>

                <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="mt-4 w-full py-3.5 rounded-2xl font-extrabold text-sm bg-white border border-purple-100 shadow-sm flex justify-center items-center gap-3 hover:bg-purple-50 transition-colors text-purple-900 disabled:opacity-70"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                </button>

                <div className="mt-8 pt-6 border-t border-purple-50 text-center">
                    <p className="text-xs font-bold text-purple-400">
                        {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
                        <button 
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setErrorMsg("");
                                setSuccessMsg("");
                                setName("");
                                setEmail("");
                                setPassword("");
                            }}
                            className="text-purple-600 hover:text-purple-800 transition-colors"
                        >
                            {isLogin ? "Daftar di sini" : "Masuk di sini"}
                        </button>
                    </p>
                </div>

            </div>
        </div>
    );
}