import React, { useMemo } from "react";
import Tabel from "@/components/Tabel";
import { Badge } from "@/components/ui/badge";

export default function CrudTable({
    dataList = [],
    selectedIds = [],
    onSelectAll,
    onSelectRow,
    onEditRow,
    getRowNumber,
    zoomLevel = 100,
}) {
    const getItemId = (item) => item?.id;

    const columns = useMemo(
        () => [
            {
                key: "kode_barang",
                label: "Kode PPL",
                render: (item) => (
                    <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-400">
                        {item.kode_barang || "-"}
                    </span>
                ),
            },
            {
                key: "brand",
                label: "Brand / Merk",
                render: (item) => (
                    <div
                        className="max-w-[150px] whitespace-normal break-words text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug"
                        title={item.brand || "-"}
                    >
                        {item.brand || "-"}
                    </div>
                ),
            },
            {
                key: "tipe",
                label: "Kategori",
                render: (item) => (
                    <div
                        className="max-w-[180px] whitespace-normal break-words text-xs text-slate-700 dark:text-slate-300 leading-snug"
                        title={item.tipe || "-"}
                    >
                        {item.tipe || "-"}
                    </div>
                ),
            },
            {
                key: "kategori",
                label: "Nama Barang",
                render: (item) => (
                    <div
                        className="max-w-[280px] sm:max-w-[340px] whitespace-normal break-words text-xs text-slate-800 dark:text-slate-200 leading-relaxed py-0.5"
                        title={item.kategori || "-"}
                    >
                        {item.kategori || "-"}
                    </div>
                ),
            },
            {
                key: "part_number",
                label: "Part Number",
                render: (item) => (
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                        {item.part_number || "-"}
                    </span>
                ),
            },
            {
                key: "satuan",
                label: "Satuan",
                render: (item) => (
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {item.deskripsi || item.satuan || "Unit"}
                    </span>
                ),
            },
            {
                key: "status_sn_pn",
                label: "Keterangan SN / PN",
                render: (item) => {
                    const isSn = Boolean(item.is_wajib_sn);
                    const isPn = Boolean(item.is_wajib_pn);
                    return (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {isSn && (
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                                    # Wajib SN
                                </Badge>
                            )}
                            {isPn && (
                                <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-700/60 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                                    # Wajib PN
                                </Badge>
                            )}
                            {!isSn && !isPn && (
                                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">
                                    Standar
                                </span>
                            )}
                        </div>
                    );
                },
            },
        ],
        [],
    );

    return (
        <div
            className="w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm
            [&_thead]:!bg-[#1457f5] [&_thead_tr]:!bg-[#1457f5]
            [&_th]:!bg-[#1457f5] [&_th]:!text-white [&_th]:!font-bold [&_th]:!text-xs [&_th]:!border-none [&_th]:py-3
            [&_td]:!border-none [&_td]:py-2.5
            [&_tbody_tr:nth-child(even)]:!bg-[#f4f7fa] dark:[&_tbody_tr:nth-child(even)]:!bg-slate-800/40
            [&_tbody_tr:nth-child(odd)]:!bg-white dark:[&_tbody_tr:nth-child(odd)]:!bg-slate-900
            [&_tbody_tr:hover]:!bg-blue-50/80 dark:[&_tbody_tr:hover]:!bg-slate-800"
        >
            <Tabel
                data={dataList}
                columns={columns}
                selectedIds={selectedIds}
                onSelectAll={onSelectAll}
                onSelectRow={onSelectRow}
                onEditRow={onEditRow}
                getItemId={getItemId}
                getRowNumber={getRowNumber}
                zoomLevel={zoomLevel}
                emptyMessage="Belum ada data master barang."
            />
        </div>
    );
}
