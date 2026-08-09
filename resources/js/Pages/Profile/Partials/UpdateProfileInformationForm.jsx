import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge'; // 🟢 Tambahkan Badge Shadcn
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformationForm({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user; // 🟢 Mengambil data user termasuk role

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    // Helper warna Badge berdasarkan Role
    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-red-600 hover:bg-red-700 text-white uppercase">{role}</Badge>;
            case 'staff':
                return <Badge className="bg-blue-600 hover:bg-blue-700 text-white uppercase">{role}</Badge>;
            default:
                return <Badge variant="secondary" className="uppercase">{role || 'view'}</Badge>;
        }
    };

    return (
        <section className={className}>
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Informasi Profil
                    </h2>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Perbarui informasi nama dan alamat email akun Anda.
                    </p>
                </div>

                {/* 🟢 Menampilkan Badge Hak Akses Role Pengguna */}
                <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">Hak Akses:</span>
                    {getRoleBadge(user.role)}
                </div>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                    />
                    {errors.name && (
                        <p className="text-xs font-medium text-red-500 mt-1">{errors.name}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Alamat Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    {errors.email && (
                        <p className="text-xs font-medium text-red-500 mt-1">{errors.email}</p>
                    )}
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-slate-800 dark:text-slate-200">
                            Alamat email Anda belum diverifikasi.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="ml-1 rounded-md text-sm text-slate-600 dark:text-slate-400 underline hover:text-slate-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                Klik di sini untuk mengirim ulang email verifikasi.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                Tautan verifikasi baru telah dikirim ke alamat email Anda.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={processing} className="bg-red-600 hover:bg-red-700 text-white">
                        Simpan Perubahan
                    </Button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Tersimpan.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}