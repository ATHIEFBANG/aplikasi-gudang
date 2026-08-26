import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { router } from '@inertiajs/react';

export default function ModalGudang({
    isOpen,
    onClose,
    isEditMode = false,
    selectedItem = null
}) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        kode_gudang: '',
        nama_gudang: '',
        lokasi: '',
        latitude: '',
        longitude: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && selectedItem) {
                setFormData({
                    id: selectedItem.id,
                    kode_gudang: selectedItem.kode_gudang || '',
                    nama_gudang: selectedItem.nama_gudang || '',
                    lokasi: selectedItem.lokasi || '',
                    latitude: selectedItem.latitude !== undefined ? String(selectedItem.latitude) : '',
                    longitude: selectedItem.longitude !== undefined ? String(selectedItem.longitude) : ''
                });
            } else {
                setFormData({
                    kode_gudang: '',
                    nama_gudang: '',
                    lokasi: '',
                    latitude: '',
                    longitude: ''
                });
            }
        } else {
            setIsProcessing(false);
        }
    }, [isOpen, isEditMode, selectedItem]);

    const handleSubmit = (e) => {
        e?.preventDefault();

        if (!formData.kode_gudang.trim() || !formData.nama_gudang.trim() || !formData.latitude || !formData.longitude) {
            alert('Harap isi Kode Gudang, Nama Gudang, serta Koordinat Latitude & Longitude.');
            return;
        }

        setIsProcessing(true);

        const url = isEditMode ? `/gudang/${formData.id}` : '/gudang';
        const method = isEditMode ? 'put' : 'post';

        router[method](url, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsProcessing(false);
                onClose();
            },
            onError: () => setIsProcessing(false),
            onFinish: () => setIsProcessing(false)
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Lokasi Gudang' : 'Tambah Lokasi Gudang Baru'}
            onSubmit={handleSubmit}
            submitLabel={isEditMode ? 'Simpan Perubahan' : 'Simpan Gudang'}
            isProcessing={isProcessing}
            maxWidth="max-w-lg"
        >
            <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            Kode Gudang <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            placeholder="Contoh: GDR-009"
                            value={formData.kode_gudang}
                            onChange={(e) => setFormData({ ...formData, kode_gudang: e.target.value.toUpperCase() })}
                            disabled={isProcessing}
                            className="font-mono font-bold"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            Nama Gudang / Hub <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            placeholder="Contoh: Gudang Semarang"
                            value={formData.nama_gudang}
                            onChange={(e) => setFormData({ ...formData, nama_gudang: e.target.value })}
                            disabled={isProcessing}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Alamat / Lokasi Wilayah
                    </Label>
                    <Input
                        placeholder="Contoh: Jl. Industri No. 12, Semarang, Jawa Tengah"
                        value={formData.lokasi}
                        onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                        disabled={isProcessing}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            Latitude <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="number"
                            step="any"
                            placeholder="Contoh: -6.9932"
                            value={formData.latitude}
                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                            disabled={isProcessing}
                            className="font-mono text-xs"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            Longitude <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="number"
                            step="any"
                            placeholder="Contoh: 110.4203"
                            value={formData.longitude}
                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                            disabled={isProcessing}
                            className="font-mono text-xs"
                            required
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
}