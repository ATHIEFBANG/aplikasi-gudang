import React, { useState, useEffect } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

// Icons
import { 
    Search, ArrowUpDown, Trash2, Pencil, UserPlus, 
    Shield, UserCheck, Eye, X, Loader2, CheckCircle2, 
    AlertTriangle 
} from 'lucide-react';

export default function UserIndex({ users = { data: [] }, filters = {} }) {
    const { flash } = usePage().props;

    // State Filter & Search
    const [search, setSearch] = useState(filters?.search || '');
    const [roleFilter, setRoleFilter] = useState(filters?.role || 'all');
    const [sortOrder, setSortOrder] = useState(filters?.sort || 'asc');

    // State Checkbox Multi-select
    const [selectedIds, setSelectedIds] = useState([]);

    // State Dialog Add/Edit
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // State Confirm Modal (Pojok Kanan Bawah)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    // State Toast Notification (Pojok Kanan Bawah)
    const [toast, setToast] = useState({
        isOpen: false,
        type: 'success', // 'success' | 'error' | 'info'
        title: '',
        message: '',
    });

    // AUTO-CLOSE TOAST (Hilang otomatis setelah 4 detik)
    useEffect(() => {
        if (toast.isOpen) {
            const timer = setTimeout(() => {
                closeToast();
            }, 4000); // 4000 milidetik = 4 detik

            return () => clearTimeout(timer); // bersihkan timer jika komponen unmount atau status berubah
        }
    }, [toast.isOpen]);

    // Inertia Flash Message Trigger
    useEffect(() => {
        if (flash?.success) {
            showToast('success', 'Berhasil!', flash.success);
        } else if (flash?.error) {
            showToast('error', 'Gagal!', flash.error);
        }
    }, [flash]);

    const showToast = (type, title, message) => {
        setToast({ isOpen: true, type, title, message });
    };

    const closeToast = () => {
        setToast((prev) => ({ ...prev, isOpen: false }));
    };

    // Form Hook (Inertia)
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'staff',
    });

    // Filter & Reload Data
    const handleFilterChange = (newSearch = search, newRole = roleFilter, newSort = sortOrder) => {
        router.get(
            route('admin.users.index'),
            {
                search: newSearch,
                role: newRole === 'all' ? '' : newRole,
                sort: newSort,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleToggleSort = () => {
        const nextSort = sortOrder === 'asc' ? 'desc' : 'asc';
        setSortOrder(nextSort);
        handleFilterChange(search, roleFilter, nextSort);
    };

    // Selection Handlers
    const userData = users?.data || [];
    const isAllSelected = userData.length > 0 && userData.every((item) => selectedIds.includes(item.id));

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(userData.map((item) => item.id));
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
        );
    };

    // Modal Add / Edit Openers
    const openAddModal = () => {
        reset();
        clearErrors();
        setEditingUser(null);
        setIsFormOpen(true);
    };

    const openEditModal = (user) => {
        clearErrors();
        setEditingUser(user);
        setData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role || 'view',
        });
        setIsFormOpen(true);
    };

    // Form Submit
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingUser) {
            put(route('admin.users.update', editingUser.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFormOpen(false);
                    showToast('success', 'Data Diperbarui', 'Data pengguna telah berhasil diperbarui.');
                },
            });
        } else {
            post(route('admin.users.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFormOpen(false);
                    reset();
                    showToast('success', 'User Ditambahkan', 'Pengguna baru berhasil didaftarkan.');
                },
            });
        }
    };

    // Execute Delete (Via Checkbox)
    const handleExecuteDelete = () => {
        const count = selectedIds.length;
        router.post(
            route('admin.users.bulk-delete'),
            { ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDeleteConfirmOpen(false);
                    setSelectedIds([]);
                    showToast('success', 'Berhasil Dihapus', `${count} data pengguna telah dihapus.`);
                },
                onError: () => {
                    setIsDeleteConfirmOpen(false);
                    showToast('error', 'Gagal Menghapus', 'Terjadi kesalahan saat menghapus data.');
                }
            }
        );
    };

    // Render Badge Role
    const renderRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return (
                    <Badge className="bg-red-600 hover:bg-red-700 text-white uppercase text-[10px]">
                        <Shield className="w-3 h-3 mr-1" /> Admin
                    </Badge>
                );
            case 'staff':
                return (
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white uppercase text-[10px]">
                        <UserCheck className="w-3 h-3 mr-1" /> Staff
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary" className="uppercase text-[10px]">
                        <Eye className="w-3 h-3 mr-1" /> View
                    </Badge>
                );
        }
    };

    return (
        <AuthenticatedLayout header="Kelola User">
            <Head title="Admin - Kelola User" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Manajemen Pengguna
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Kelola akun staf, atur ulang role, atau ubah kata sandi.
                    </p>
                </div>

                <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
                    {/* TOOLBAR */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        {/* AREA KIRI: Search, Sort & Role Switch */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <form onSubmit={(e) => e.preventDefault()} className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        handleFilterChange(e.target.value, roleFilter, sortOrder);
                                    }}
                                    placeholder="Cari nama atau email..."
                                    className="pl-9 pr-8 w-full sm:w-56 h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            handleFilterChange('', roleFilter, sortOrder);
                                        }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </form>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleToggleSort}
                                className="h-9 gap-1 text-xs dark:border-slate-800"
                            >
                                <ArrowUpDown className="w-3.5 h-3.5 text-blue-500" />
                                <span className="uppercase">{sortOrder}</span>
                            </Button>

                            <div className="w-32">
                                <Select
                                    value={roleFilter}
                                    onValueChange={(val) => {
                                        setRoleFilter(val);
                                        handleFilterChange(search, val, sortOrder);
                                    }}
                                >
                                    <SelectTrigger className="h-9 text-xs dark:border-slate-800">
                                        <SelectValue placeholder="Semua Role" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-slate-900 border-slate-800 text-xs">
                                        <SelectItem value="all">Semua Role</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="staff">Staff</SelectItem>
                                        <SelectItem value="view">View</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* AREA KANAN: Hapus Terpilih & Tambah User */}
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                            {selectedIds.length > 0 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setIsDeleteConfirmOpen(true)}
                                    className="h-9 gap-1.5 text-xs animate-in fade-in duration-200"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus ({selectedIds.length})</span>
                                </Button>
                            )}

                            <Button
                                onClick={openAddModal}
                                className="bg-red-600 hover:bg-red-700 text-white shadow-md h-9 text-xs font-medium gap-1.5"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Tambah User</span>
                            </Button>
                        </div>
                    </div>

                    {/* TABEL */}
                    <div className="relative overflow-x-auto rounded-b-xl border-t-0">
                        <Table>
                            <TableHeader className="bg-slate-100/80 dark:bg-slate-800/80">
                                <TableRow>
                                    {/* KOLOM AKSI & CHECKBOX */}
                                    <TableHead className="w-16 text-center sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center justify-center gap-2">
                                            <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
                                            <span>Aksi</span>
                                        </div>
                                    </TableHead>

                                    {/* KOLOM NOMOR */}
                                    <TableHead className="w-12 text-center">No</TableHead>

                                    {/* KOLOM ISI */}
                                    <TableHead className="font-semibold text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">Nama User</TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">Email Perusahaan</TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">Role / Hak Akses</TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">Dibuat Pada</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {userData.length > 0 ? (
                                    userData.map((user, index) => {
                                        const isSelected = selectedIds.includes(user.id);

                                        return (
                                            <TableRow key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                {/* CELL AKSI & CHECKBOX */}
                                                <TableCell className="sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-100/90 dark:group-hover:bg-slate-800/90 border-r border-slate-200 dark:border-slate-800 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => handleSelectRow(user.id)}
                                                        />

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                                            onClick={() => openEditModal(user)}
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>

                                                {/* CELL NOMOR */}
                                                <TableCell className="font-mono text-xs text-slate-400 text-center font-bold">
                                                    {index + 1}
                                                </TableCell>

                                                {/* DATA CELLS */}
                                                <TableCell className="whitespace-nowrap font-semibold text-xs">{user.name}</TableCell>
                                                <TableCell className="whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">{user.email}</TableCell>
                                                <TableCell className="whitespace-nowrap">{renderRoleBadge(user.role)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-xs text-slate-500">
                                                    {new Date(user.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-400 dark:text-slate-500">
                                            Tidak ada data pengguna ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            {/* MODAL ADD / EDIT */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-md max-h-[85vh] h-auto flex flex-col p-6 gap-0 overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xl z-50">
                    <DialogHeader className="shrink-0 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between pr-6">
                            <span>{editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {editingUser
                                ? 'Perbarui profil atau role pengguna.'
                                : 'Buatkan akun baru staf untuk mengelola sistem.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form id="user-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 pr-1 space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs">
                                Nama Lengkap
                            </Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="h-9 text-xs"
                                required
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-xs">
                                Email Perusahaan
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="h-9 text-xs"
                                required
                            />
                            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="role" className="text-xs">
                                Role / Peran Akses
                            </Label>
                            <Select value={data.role} onValueChange={(val) => setData('role', val)}>
                                <SelectTrigger className="h-9 text-xs w-full">
                                    <SelectValue placeholder="Pilih Role" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-900 border-slate-800 text-xs">
                                    <SelectItem value="admin">Admin (Akses Penuh)</SelectItem>
                                    <SelectItem value="staff">Staff (Input & Edit)</SelectItem>
                                    <SelectItem value="view">View (Read-Only)</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-xs">
                                {editingUser ? 'Password Baru (Opsional)' : 'Password'}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Masukkan password'}
                                className="h-9 text-xs"
                                required={!editingUser}
                            />
                            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                        </div>
                    </form>

                    <DialogFooter className="shrink-0 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-white dark:bg-slate-900">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsFormOpen(false)}
                            disabled={processing}
                            className="h-9 text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="user-form"
                            disabled={processing}
                            className="h-9 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors"
                        >
                            {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>{editingUser ? 'Simpan Perubahan' : 'Buat User'}</span>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CONFIRM MODAL (POJOK KANAN BAWAH) */}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
                    <div 
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity pointer-events-auto"
                        onClick={() => setIsDeleteConfirmOpen(false)}
                    />

                    <div className="relative pointer-events-auto w-full max-w-md bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-6 z-10 animate-in slide-in-from-bottom-5 fade-in duration-300">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-100">Hapus Pengguna Terpilih</h3>
                                    <p className="text-[11px] text-slate-400 font-medium">Tindakan ini memerlukan konfirmasi</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 mb-5">
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Apakah Anda yakin ingin menghapus <strong>{selectedIds.length}</strong> pengguna yang Anda centang secara permanen?
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                className="text-xs text-slate-400 hover:text-white hover:bg-slate-800 h-9 px-4 font-medium"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleExecuteDelete}
                                className="text-xs h-9 px-5 font-bold transition-all shadow-md bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/30"
                            >
                                Ya, Hapus
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST NOTIFICATION (AUTO HILANG DALAM 4 DETIK) */}
            {toast.isOpen && (
                <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className={`p-4 rounded-2xl border shadow-xl flex items-start gap-3 bg-white dark:bg-slate-900 ${
                        toast.type === 'error' ? 'border-rose-500/30 dark:border-rose-500/20' : 'border-emerald-500/30 dark:border-emerald-500/20'
                    }`}>
                        <div className={`p-2 rounded-xl shrink-0 ${
                            toast.type === 'error' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 pr-2">
                            <h4 className={`text-sm font-bold ${toast.type === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {toast.title}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
                        </div>
                        <button 
                            onClick={closeToast}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}