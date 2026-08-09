import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { ShieldAlert } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout header="Profile">
            <Head title="Profile" />

            <div className="py-2 space-y-6 max-w-4xl mx-auto">
                {/* Card 1: Informasi Profil & Role Badge */}
                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm rounded-2xl p-6 sm:p-8 transition-colors duration-300">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="w-full"
                    />
                </div>

                {/* Card 2: Update Password */}
                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm rounded-2xl p-6 sm:p-8 transition-colors duration-300">
                    <UpdatePasswordForm className="w-full" />
                </div>

                {/* Card 3: Info Pengelolaan Akun (Pengganti Delete Account) */}
                <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-700 dark:text-amber-400">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Pengelolaan Akun Perusahaan</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                Untuk penutupan akun atau perubahan role hak akses (`Admin`, `Staff`, `View`), silakan ajukan permohonan resmi ke tim <strong>Administrator IT / HR Perusahaan</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}