import React, { useState, useEffect } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// UI base
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

// Komponen universal proyek
import Tabel from '@/components/gabungan/Tabel';
import HybridDropdown from '@/components/gabungan/HybridDropdown';

// Icons
import { 
    Search, ArrowUpDown, Trash2, UserPlus, ChevronLeft, ChevronRight,
    Shield, UserCheck, Eye, X, Loader2, CheckCircle2,
    AlertTriangle
} from 'lucide-react';

export default function UserIndex({ users = { data: [] }, filters = {}, editingUser: initialEditingUser = null }) {
    const { flash } = usePage().props;

    // State Filter & Search
    const [search, setSearch] = useState(filters?.search || '');
    const [roleFilter, setRoleFilter] = useState(filters?.role || 'all');
    const [sortOrder, setSortOrder] = useState(filters?.sort || 'asc');
    const [perPageInput, setPerPageInput] = useState(Number(users?.per_page ?? filters?.per_page ?? 10));

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
        role: 'pelaksana',
    });

    // Jika dibuka lewat URL /admin/users/{id}, route akan mengarahkan ke
    // /admin/users?edit={id}; buka modal edit secara otomatis.
    useEffect(() => {
        if (!initialEditingUser) return;

        setEditingUser(initialEditingUser);
        setData({
            name: initialEditingUser.name ?? '',
            email: initialEditingUser.email ?? '',
            password: '',
            role: initialEditingUser.role ?? 'pelaksana',
        });
        setIsFormOpen(true);
    }, [initialEditingUser]);

    // Filter & Reload Data
    const handleFilterChange = (newSearch = search, newRole = roleFilter, newSort = sortOrder, newPerPage = perPageInput) => {
        router.get(
            route('admin.users.index'),
            {
                search: newSearch,
                role: newRole === 'all' ? '' : newRole,
                sort: newSort,
                per_page: Number(newPerPage) || 10,
            },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handlePerPageSubmit = () => {
        let value = parseInt(perPageInput, 10);
        if (Number.isNaN(value) || value < 1) value = 10;
        else if (value > 100) value = 100;

        setPerPageInput(value);
        if (value !== Number(users?.per_page ?? filters?.per_page ?? 10)) {
            handleFilterChange(search, roleFilter, sortOrder, value);
        }
    };

    const handlePageChange = (pageNumber) => {
        const page = Math.max(1, Math.min(lastPage, Number(pageNumber) || 1));
        router.get(
            route('admin.users.index'),
            {
                search,
                role: roleFilter === 'all' ? '' : roleFilter,
                sort: sortOrder,
                per_page: Number(users?.per_page ?? perPageInput ?? 10),
                page,
            },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleToggleSort = () => {
        const nextSort = sortOrder === 'asc' ? 'desc' : 'asc';
        setSortOrder(nextSort);
        handleFilterChange(search, roleFilter, nextSort);
    };

    // Selection Handlers
    const userData = Array.isArray(users?.data) ? users.data : [];
    const totalUserCount = Number(users?.total ?? userData.length);
    const currentPage = Number(users?.current_page ?? 1);
    const lastPage = Number(users?.last_page ?? 1);
    const rangeFrom = Number(users?.from ?? (userData.length > 0 ? 1 : 0));
    const rangeTo = Number(users?.to ?? userData.length);

    const handleSelectAll = (checked) => {
        if (typeof checked === 'boolean') {
            setSelectedIds(checked ? userData.map((item) => item.id) : []);
            return;
        }
        setSelectedIds((prev) =>
            prev.length === userData.length ? [] : userData.map((item) => item.id)
        );
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
            role: user.role || 'pelaksana',
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

    // Render Badge Role (mendukung nilai lama sementara akun dimigrasikan manual oleh Admin)
    const renderRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return (
                    <Badge className="bg-red-600 hover:bg-red-700 text-white uppercase text-[10px]">
                        <Shield className="w-3 h-3 mr-1" /> Admin
                    </Badge>
                );
            case 'supervisi':
                return (
                    <Badge className="bg-violet-600 hover:bg-violet-700 text-white uppercase text-[10px]">
                        <Shield className="w-3 h-3 mr-1" /> Supervisi
                    </Badge>
                );
            case 'pelaksana':
                return (
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white uppercase text-[10px]">
                        <UserCheck className="w-3 h-3 mr-1" /> Pelaksana
                    </Badge>
                );
            case 'staff':
                return (
                    <Badge variant="outline" className="uppercase text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Staff Lama
                    </Badge>
                );
            case 'view':
                return (
                    <Badge variant="outline" className="uppercase text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="w-3 h-3 mr-1" /> View Lama
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary" className="uppercase text-[10px]">
                        <Eye className="w-3 h-3 mr-1" /> Role Tidak Dikenal
                    </Badge>
                );
        }
    };

    return (
        <AuthenticatedLayout header="Kelola User">
            <Head title="Admin - Kelola User" />

            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                            Manajemen Pengguna
                        </h1>
                        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Kelola akun, hak akses, dan role pengguna. Pilih role sesuai tanggung jawab operasional masing-masing.
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <UserCheck className="h-4 w-4 text-red-500" />
                        <span>Total Pengguna</span>
                        <span className="text-base font-bold tabular-nums text-slate-900 dark:text-white">{totalUserCount.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/30 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/10">
                    {/* TOOLBAR */}
                    <div className="flex flex-col gap-4 border-b border-slate-200/80 p-4 dark:border-slate-800 xl:flex-row xl:items-center xl:justify-between">
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

                            <div className="w-full sm:w-40">
                                <HybridDropdown
                                    value={roleFilter}
                                    options={[
                                        { value: 'all', label: 'Semua Role' },
                                        { value: 'admin', label: 'Admin' },
                                        { value: 'supervisi', label: 'Supervisi' },
                                        { value: 'pelaksana', label: 'Pelaksana' },
                                    ]}
                                    onChange={(value) => {
                                        const nextRole = value || 'all';
                                        setRoleFilter(nextRole);
                                        handleFilterChange(search, nextRole, sortOrder);
                                    }}
                                    placeholder="Semua Role"
                                    searchPlaceholder="Cari role..."
                                    allowCustom={false}
                                    portalMenu={true}
                                    direction="auto"
                                    className="w-full"
                                    inputClassName="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                />
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
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md h-9 text-xs font-medium gap-1.5"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Tambah User</span>
                            </Button>
                        </div>
                    </div>

                    {/* TABEL UNIVERSAL */}
                    <div className="overflow-hidden">
                        <Tabel
                            data={userData}
                            columns={[
                                {
                                    key: 'name',
                                    label: 'Nama Pengguna',
                                    className: 'min-w-[190px]',
                                    cellClassName: 'min-w-[190px]',
                                    render: (user) => (
                                        <div className="flex items-center gap-2.5 py-0.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-900 text-xs font-bold text-white shadow-sm shadow-yellow-500/20">
                                                {(user.name || '?').trim().charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{user.name || '-'}</p>
                                                <p className="mt-0.5 text-[10px] font-medium text-slate-400">ID Pengguna #{user.id}</p>
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    key: 'email',
                                    label: 'Email Perusahaan',
                                    className: 'min-w-[220px]',
                                    cellClassName: 'min-w-[220px] text-slate-600 dark:text-slate-400',
                                    render: (user) => <span>{user.email || '-'}</span>,
                                },
                                {
                                    key: 'role',
                                    label: 'Role / Hak Akses',
                                    className: 'min-w-[155px]',
                                    cellClassName: 'min-w-[155px]',
                                    render: (user) => renderRoleBadge(user.role),
                                },
                                {
                                    key: 'created_at',
                                    label: 'Terdaftar',
                                    className: 'min-w-[125px]',
                                    cellClassName: 'min-w-[125px] text-slate-500 dark:text-slate-400',
                                    render: (user) => user.created_at
                                        ? new Date(user.created_at).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })
                                        : '-',
                                },
                            ]}
                            selectedIds={selectedIds}
                            onSelectAll={handleSelectAll}
                            onSelectRow={handleSelectRow}
                            onEditRow={openEditModal}
                            getItemId={(user) => user.id}
                            getRowNumber={(index) => rangeFrom > 0 ? rangeFrom + index : index + 1}
                            emptyMessage="Tidak ada pengguna yang cocok dengan pencarian atau filter saat ini."
                            zoomLevel={100}
                        />
                    </div>

                    {/* FOOTER TABEL / PAGINATION — mengikuti MasterDataProyek */}
                    <div className="flex flex-col items-center justify-between gap-4 bg-slate-50/50 p-4 text-xs text-slate-500 dark:bg-slate-900/50 md:flex-row">
                        <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">Tampilkan</span>
                            <Input
                                type="number"
                                min={1}
                                max={100}
                                value={perPageInput}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value !== '' && Number(value) > 100) setPerPageInput(100);
                                    else setPerPageInput(value);
                                }}
                                onBlur={handlePerPageSubmit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handlePerPageSubmit();
                                    }
                                }}
                                className="h-8 w-16 border-slate-200 bg-white text-center text-xs font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:border-slate-700 dark:bg-slate-800"
                                aria-label="Jumlah pengguna per halaman"
                            />
                            <span className="whitespace-nowrap">data per halaman</span>
                        </div>

                        <div className="text-center text-slate-500">
                            Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{rangeFrom.toLocaleString('id-ID')}</span> - <span className="font-semibold text-slate-700 dark:text-slate-300">{rangeTo.toLocaleString('id-ID')}</span> dari <span className="font-semibold text-slate-700 dark:text-slate-300">{totalUserCount.toLocaleString('id-ID')}</span> pengguna
                            {selectedIds.length > 0 && <span className="ml-2 text-blue-600 dark:text-blue-400">• {selectedIds.length} dipilih</span>}
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={currentPage <= 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                                className="h-8 min-w-[32px] px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                                aria-label="Halaman sebelumnya"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            {Array.from({ length: lastPage }, (_, index) => index + 1).map((pageNum) => (
                                <Button
                                    key={`page-${pageNum}`}
                                    type="button"
                                    variant={currentPage === pageNum ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`h-8 min-w-[32px] px-2 text-xs font-semibold dark:border-slate-800 ${
                                        currentPage === pageNum
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                    }`}
                                    aria-label={`Halaman ${pageNum}`}
                                    aria-current={currentPage === pageNum ? 'page' : undefined}
                                >
                                    {pageNum}
                                </Button>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= lastPage}
                                onClick={() => handlePageChange(currentPage + 1)}
                                className="h-8 min-w-[32px] px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                                aria-label="Halaman selanjutnya"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
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
                                : 'Buat akun baru dan tentukan hak aksesnya sesuai tanggung jawab.'}
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
                            <HybridDropdown
                                value={data.role}
                                options={[
                                    { value: 'admin', label: 'Admin', subLabel: 'Akses penuh termasuk Admin Panel' },
                                    { value: 'supervisi', label: 'Supervisi', subLabel: 'Kelola data operasional, tanpa tambah lokasi gudang' },
                                    { value: 'pelaksana', label: 'Pelaksana', subLabel: 'Input transaksi tanpa edit/hapus data tersimpan' },
                                ]}
                                onChange={(value) => setData('role', value)}
                                placeholder="Pilih role pengguna"
                                searchPlaceholder="Cari role..."
                                allowCustom={false}
                                portalMenu={true}
                                direction="auto"
                                className="w-full"
                                inputClassName="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                            />
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