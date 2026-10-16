import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import FormModal from '@/components/gabungan/FormModal';
import Tabel from '@/components/gabungan/Tabel';

const EMPTY_FORM = {
    kode_projek: '',
    nama_projek: '',
    nama_customer: '',
    lokasi: '',
    is_active: true,
};

export default function MasterDataProyek({ proyekData = [] }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role || 'view';
    const canWrite = role === 'admin' || role === 'staff';

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [perPageInput, setPerPageInput] = useState(10);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleting, setDeleting] = useState(false);

    const totalData = proyekData.length;
    const totalPages = Math.max(1, Math.ceil(totalData / perPage));
    const currentPage = Math.min(page, totalPages);
    const visible = proyekData.slice((currentPage - 1) * perPage, currentPage * perPage);
    const from = totalData ? (currentPage - 1) * perPage + 1 : 0;
    const to = Math.min(currentPage * perPage, totalData);

    const visibleIds = visible.map(item => item.id);
    const handleSelectRow = id => setSelectedIds(previous => previous.includes(id) ? previous.filter(selectedId => selectedId !== id) : [...previous, id]);
    const handleSelectAll = checked => setSelectedIds(previous => checked ? [...new Set([...previous, ...visibleIds])] : previous.filter(id => !visibleIds.includes(id)));

    const handleDeleteSelected = () => {
        if (!canWrite || !selectedIds.length || deleting) return;
        const selectedProjects = proyekData.filter(item => selectedIds.includes(item.id));
        const names = selectedProjects.map(item => item.kode_projek).join(', ');
        if (!window.confirm(`Hapus ${selectedProjects.length} proyek terpilih (${names})? Proyek yang sudah digunakan pada transaksi atau data serial tidak dapat dihapus.`)) return;

        setDeleting(true);
        const queue = [...selectedProjects];
        const deleteNext = () => {
            const item = queue.shift();
            if (!item) {
                setSelectedIds([]);
                setDeleting(false);
                router.reload({ only: ['proyekData'], preserveScroll: true });
                return;
            }
            router.delete(`/proyek/${item.id}`, {
                preserveScroll: true,
                onSuccess: deleteNext,
                onError: () => setDeleting(false),
                onFinish: () => {},
            });
        };
        deleteNext();
    };

    const handlePerPageSubmit = () => {
        let value = parseInt(perPageInput, 10);
        if (isNaN(value) || value < 1) value = 10;
        else if (value > 100) value = 100;
        setPerPageInput(value);
        setPerPage(value);
        setPage(1);
    };

    const openCreate = () => {
        if (!canWrite) return;
        setEditing(null);
        setForm({ ...EMPTY_FORM });
        setErrors({});
        setModalOpen(true);
    };

    const openEdit = (item) => {
        if (!canWrite || !item) return;

        setEditing(item);
        setForm({
            kode_projek: item.kode_projek || '',
            nama_projek: item.nama_projek || '',
            nama_customer: item.nama_customer || '',
            lokasi: item.lokasi || '',
            is_active: Boolean(item.is_active),
        });
        setErrors({});
        setModalOpen(true);
    };

    const closeModal = () => {
        if (processing) return;
        setModalOpen(false);
        setEditing(null);
        setForm({ ...EMPTY_FORM });
        setErrors({});
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!form.kode_projek.trim() || !form.nama_projek.trim()) {
            setErrors({
                ...(form.kode_projek.trim() ? {} : {
                    kode_projek: 'Kode proyek wajib diisi.',
                }),
                ...(form.nama_projek.trim() ? {} : {
                    nama_projek: 'Nama proyek wajib diisi.',
                }),
            });
            return;
        }

        setProcessing(true);

        const payload = {
            ...form,
            kode_projek: form.kode_projek.trim().toUpperCase(),
            nama_projek: form.nama_projek.trim(),
            nama_customer: form.nama_customer.trim(),
            lokasi: form.lokasi.trim(),
        };

        const options = {
            preserveScroll: true,
            onError: (serverErrors) => setErrors(serverErrors || {}),
            onSuccess: () => {
                setModalOpen(false);
                setEditing(null);
                setForm({ ...EMPTY_FORM });
                setErrors({});
            },
            onFinish: () => setProcessing(false),
        };

        if (editing) {
            router.put(`/proyek/${editing.id}`, payload, options);
        } else {
            router.post('/proyek', payload, options);
        }
    };

    return (
        <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <CardContent className="p-0">
                {/* Sub-Header Tabel */}
                <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Daftar Data Proyek Operasional
                    </span>
                    {canWrite && (
                        <div className="flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <Button type="button" size="sm" variant="outline" onClick={handleDeleteSelected} disabled={deleting} className="h-8 gap-1.5 border-rose-300 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/30">
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>{deleting ? 'Menghapus…' : `Hapus Terpilih (${selectedIds.length})`}</span>
                                </Button>
                            )}
                            <Button type="button" size="sm" onClick={openCreate} className="h-8 gap-1.5 bg-rose-600 text-xs font-medium text-white shadow-sm transition-colors hover:bg-rose-700">
                                <Plus className="h-3.5 w-3.5" />
                                <span>Tambah Proyek</span>
                            </Button>
                        </div>
                    )}
                </div>

                <div className="w-full [&>div]:border-0 [&>div]:rounded-none [&>div]:shadow-none border-b border-slate-200 dark:border-slate-800">
                    <Tabel
                    data={visible}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectRow={handleSelectRow}
                    onEditRow={openEdit}
                    columns={[
                        {
                            key: 'kode_projek',
                            label: 'Kode Proyek',
                            className: 'whitespace-nowrap',
                            cellClassName: 'font-mono font-bold text-rose-600 dark:text-rose-400',
                        },
                        {
                            key: 'nama_projek',
                            label: 'Nama Proyek / Site',
                            cellClassName: 'font-semibold text-slate-800 dark:text-slate-100',
                        },
                        {
                            key: 'nama_customer',
                            label: 'Customer',
                            cellClassName: 'text-slate-600 dark:text-slate-300',
                        },
                        {
                            key: 'lokasi',
                            label: 'Lokasi',
                            render: item => (
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                    {item.lokasi || '—'}
                                </span>
                            ),
                            cellClassName: 'text-slate-600 dark:text-slate-300',
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            render: item => item.is_active ? (
                                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    Aktif
                                </Badge>
                            ) : (
                                <Badge variant="secondary">Nonaktif</Badge>
                            ),
                        },
                    ]}
                    getItemId={item => item.id}
                    getRowNumber={index => from + index}
                    emptyMessage="Belum ada data proyek terdaftar."
                    />
                </div>

                <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <span>Tampilkan</span>
                        <Input
                            type="number"
                            min={1}
                            max={100}
                            value={perPageInput}
                            onChange={e => {
                                const value = e.target.value;
                                if (value !== '' && Number(value) > 100) setPerPageInput(100);
                                else setPerPageInput(value);
                            }}
                            onBlur={handlePerPageSubmit}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handlePerPageSubmit();
                                }
                            }}
                            className="h-8 w-16 text-center text-xs font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span>data per halaman</span>
                    </div>

                    <div className="text-slate-500">
                        Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{from.toLocaleString('id-ID')}</span> - <span className="font-semibold text-slate-700 dark:text-slate-300">{to.toLocaleString('id-ID')}</span> dari <span className="font-semibold text-slate-700 dark:text-slate-300">{totalData.toLocaleString('id-ID')}</span> data
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            className="h-8 min-w-[32px] px-2 text-xs font-semibold dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map(pageNum => (
                            <Button
                                key={`page-${pageNum}`}
                                type="button"
                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPage(pageNum)}
                                className={`h-8 min-w-[32px] px-2 text-xs font-semibold dark:border-slate-800 ${
                                    currentPage === pageNum
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                {pageNum}
                            </Button>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                            className="h-8 min-w-[32px] px-2 text-xs font-semibold dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </CardContent>

            <FormModal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editing ? 'Edit Data Proyek' : 'Tambah Data Proyek'}
                description={editing ? 'Perbarui informasi proyek operasional di bawah ini.' : 'Lengkapi informasi proyek agar dapat digunakan pada transaksi dan rincian aset.'}
                onSubmit={() => document.getElementById('proyek-form')?.requestSubmit()}
                submitLabel={processing ? 'Menyimpan…' : 'Simpan Proyek'}
                cancelLabel="Batal"
                isProcessing={processing}
                maxWidth="sm:max-w-2xl"
            >
                <form id="proyek-form" onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Kode Proyek *
                            <Input
                                value={form.kode_projek}
                                onChange={e => setForm({ ...form, kode_projek: e.target.value.toUpperCase() })}
                                required
                                className="mt-1 font-mono"
                                disabled={processing}
                                aria-invalid={Boolean(errors.kode_projek)}
                            />
                            {errors.kode_projek && <p className="text-xs font-normal text-rose-500">{errors.kode_projek}</p>}
                        </label>

                        <label className="block space-y-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Nama Proyek / Site *
                            <Input
                                value={form.nama_projek}
                                onChange={e => setForm({ ...form, nama_projek: e.target.value })}
                                required
                                className="mt-1"
                                disabled={processing}
                                aria-invalid={Boolean(errors.nama_projek)}
                            />
                            {errors.nama_projek && <p className="text-xs font-normal text-rose-500">{errors.nama_projek}</p>}
                        </label>

                        <label className="block space-y-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Customer
                            <Input
                                value={form.nama_customer}
                                onChange={e => setForm({ ...form, nama_customer: e.target.value })}
                                className="mt-1"
                                disabled={processing}
                            />
                        </label>

                        <label className="block space-y-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Lokasi / Alamat Site
                            <Input
                                value={form.lokasi}
                                onChange={e => setForm({ ...form, lokasi: e.target.value })}
                                className="mt-1"
                                disabled={processing}
                            />
                        </label>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status Proyek</p>
                        <label className="flex cursor-pointer items-start gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                            <input
                                type="checkbox"
                                checked={Boolean(form.is_active)}
                                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                disabled={processing}
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-rose-600"
                            />
                            <span>
                                <span className="block">Aktif</span>
                                <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">Proyek tersedia untuk digunakan pada transaksi baru.</span>
                            </span>
                        </label>
                    </div>
                </form>
            </FormModal>
        </Card>
    );
}