import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, X, AlertCircle } from 'lucide-react';

export default function ExcelUploader({
    onFileSelect,
    accept = '.xlsx, .xls, .csv',
    maxSizeMB = 10,
    title = 'Upload File Excel',
    description = 'Drag & drop file Excel (.xlsx / .csv) di sini, atau klik untuk memilih file',
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const validateAndSetFile = (file) => {
        setError(null);
        if (!file) return;

        const sizeInMB = file.size / (1024 * 1024);
        if (sizeInMB > maxSizeMB) {
            setError(`Ukuran file melebihi batas maksimal (${maxSizeMB} MB)`);
            return;
        }

        setSelectedFile(file);
        if (onFileSelect) onFileSelect(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleRemoveFile = (e) => {
        e.stopPropagation();
        setSelectedFile(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onFileSelect) onFileSelect(null);
    };

    return (
        <div className="w-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={accept}
                className="hidden"
            />

            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                        ? 'border-red-500 bg-red-500/10'
                        : selectedFile
                        ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10'
                        : 'border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-red-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
            >
                {selectedFile ? (
                    <div className="flex items-center justify-between gap-4 p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-500/30 shadow-sm">
                        <div className="flex items-center gap-3 truncate">
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                <FileSpreadsheet className="w-6 h-6" />
                            </div>
                            <div className="text-left truncate">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition"
                            title="Hapus File"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
                            <UploadCloud className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">{title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                                {description}
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 mt-1">
                            Maksimal {maxSizeMB} MB
                        </span>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}