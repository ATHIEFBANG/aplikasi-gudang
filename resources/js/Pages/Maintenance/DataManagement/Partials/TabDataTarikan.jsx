import React, { useState } from 'react';
import { router } from '@inertiajs/react'; // <--- Tambahkan router di sini
import { Wand2, DatabaseZap, CheckCircle2, ArrowRightLeft } from 'lucide-react';

export default function TabDataTarikanEngine() {
    const [fileRpm, setFileRpm] = useState(null);
    const [fileSmartkey, setFileSmartkey] = useState(null);
    const [processingRpm, setProcessingRpm] = useState(false);
    const [processingSmartkey, setProcessingSmartkey] = useState(false);

    const handleProcessRPM = (e) => {
        e.preventDefault();
        if (!fileRpm) return alert("Silakan pilih file Excel RPM terlebih dahulu!");

        setProcessingRpm(true);

        router.post(route('maintenance.data-management.process-rpm'), {
            file_rpm: fileRpm,
        }, {
            forceFormData: true,
            onFinish: () => setProcessingRpm(false),
            onSuccess: () => alert('Proses Rekonsiliasi & Cleansing RPM Selesai!'),
            onError: (errors) => {
                console.error(errors);
                alert('Gagal memproses RPM. Cek kolom Excel kamu!');
            }
        });
    };

    const handleProcessSmartkey = (e) => {
        e.preventDefault();
        if (!fileSmartkey) return alert("Silakan pilih file Lock History terlebih dahulu!");

        setProcessingSmartkey(true);

        router.post(route('maintenance.data-management.process-smartkey'), {
            file_smartkey: fileSmartkey,
        }, {
            forceFormData: true,
            onFinish: () => setProcessingSmartkey(false),
            onSuccess: () => alert('Proses Sinkronisasi Smart Key Selesai!'),
            onError: (errors) => {
                console.error(errors);
                alert('Gagal memproses Smart Key. Cek kolom Excel kamu!');
            }
        });
    };


    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* --- PANEL TARIKAN RPM --- */}
            <form onSubmit={handleProcessRPM} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-blue-50/50 dark:bg-blue-500/5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <DatabaseZap className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upload & Olah Tarikan RPM</h2>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Cleansing + Auto VLOOKUP & XLOOKUP RPM ke Master.</p>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">File Tarikan RPM (.xlsx / .csv):</label>
                            <input 
                                type="file" 
                                accept=".xlsx,.xls,.csv" 
                                onChange={(e) => setFileRpm(e.target.files[0])}
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-400" 
                            />
                        </div>

                        <div className="pt-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Aturan Engine Auto-Cleansing:</h3>
                            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Trim spasi & perbaiki typo tahun (20205 $\rightarrow$ 2025)</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Filter/Hapus data tahun 2020-2024 & RTP 'Jakarta'</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Auto-Insert Site ID baru & XLOOKUP update status Approve</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-200 dark:border-white/10">
                    <button 
                        type="submit"
                        disabled={processingRpm}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all disabled:opacity-50"
                    >
                        <Wand2 className={`w-5 h-5 ${processingRpm ? 'animate-spin' : ''}`} />
                        {processingRpm ? 'Memproses RPM...' : 'Proses Tarikan RPM'}
                    </button>
                </div>
            </form>

            {/* --- PANEL TARIKAN SMART KEY --- */}
            <form onSubmit={handleProcessSmartkey} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-emerald-50/50 dark:bg-emerald-500/5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <ArrowRightLeft className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upload & Sinkron Smart Key</h2>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Match Lock History ke Master Smart Key.</p>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">File Lock History (.xlsx / .csv):</label>
                            <input 
                                type="file" 
                                accept=".xlsx,.xls,.csv" 
                                onChange={(e) => setFileSmartkey(e.target.files[0])}
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-slate-800 dark:file:text-emerald-400" 
                            />
                        </div>

                        <div className="pt-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Aturan Engine Auto-Sync:</h3>
                            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Match Lock ID dengan Serial Number Master</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Auto-Create Unit baru jika Serial Number belum ada</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sync Status Aktifitas & Geolocation Long Lat</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-200 dark:border-white/10">
                    <button 
                        type="submit"
                        disabled={processingSmartkey}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all disabled:opacity-50"
                    >
                        <Wand2 className={`w-5 h-5 ${processingSmartkey ? 'animate-spin' : ''}`} />
                        {processingSmartkey ? 'Memproses Smart Key...' : 'Proses Tarikan Smart Key'}
                    </button>
                </div>
            </form>

        </div>
    );
}