import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    ChevronRight,
    ClipboardList,
    FileSpreadsheet,
    History,
    LayoutDashboard,
    Package,
    Search,
    ShieldCheck,
    Warehouse,
    X,
    ArrowDownToLine,
    ArrowUpFromLine,
    ArrowLeftRight,
    FolderKanban,
    Users,
    RotateCcw,
    Info,
} from 'lucide-react';

const guides = [
    {
        id: 'items', category: 'Mulai', title: 'Mengenal aplikasi', description: 'Gambaran umum menu dan alur kerja aplikasi gudang.', icon: LayoutDashboard,
        intro: 'Aplikasi ini digunakan untuk memantau data persediaan, mencatat pergerakan barang, dan melihat riwayat serta laporan operasional.',
        sections: [
            { heading: 'Bagian utama aplikasi', body: 'Gunakan menu navigasi di bagian atas untuk berpindah antara Dashboard, Master Barang, Transaksi Stok, History Moving, dan Laporan Bulanan. Master data Gudang dan Proyek dapat diakses dari area yang tersedia pada Dashboard.', imageGroup: 'loginn', },
            { heading: 'Cara membaca panduan', body: 'Pilih topik pada panel sebelah kiri. Gunakan kolom pencarian untuk menemukan istilah atau fitur tertentu. Isi panduan akan tampil di area ini.' },
            { heading: 'Hak akses pengguna',  content: [
        {
            type: 'text',
            value: 'Pertama, buka halaman Master Barang.'
        },
        {
            type: 'image',
            group: 'loginn'
        },
        {
            type: 'text',
            value: 'Kemudian tekan tombol Tambah Data Baru.'
        },
        {
            type: 'image',
            group: 'form-barang'
        },
        {
            type: 'text',
            value: 'Lengkapi formulir dan periksa kembali sebelum menyimpan.'
        },
    ],
}
        ],
        steps: ['Masuk menggunakan akun yang telah diberikan oleh Admin.', 'Periksa Dashboard untuk melihat ringkasan dan akses modul.', 'Pilih modul sesuai pekerjaan yang akan dilakukan.', 'Pastikan data yang dimasukkan sudah benar sebelum disimpan.'],
        note: 'Data transaksi yang tersimpan menjadi bagian dari catatan persediaan. Periksa kembali barang, jumlah, dan tujuan sebelum menyimpan transaksi.',
    },
    {
        id: 'roles', category: 'Mulai', title: 'Peran dan hak akses', description: 'Perbedaan akses Admin, Supervisi, dan Pelaksana.', icon: ShieldCheck,
        intro: 'Setiap pengguna memiliki peran yang menentukan tindakan yang dapat dilakukan di dalam aplikasi.',
        sections: [
            { heading: 'Admin', body: 'Memiliki akses pengelolaan aplikasi, termasuk manajemen pengguna dan penambahan lokasi gudang. Admin juga dapat membuat, mengubah, dan menghapus data sesuai modul.' },
            { heading: 'Supervisi', body: 'Dapat menjalankan operasional serta mengubah dan menghapus data yang diizinkan. Supervisi dapat mengelola lokasi gudang yang sudah tersedia, tetapi tidak menambahkan lokasi gudang baru.' },
            { heading: 'Pelaksana', body: 'Dapat melihat data dan membuat transaksi atau data operasional yang diizinkan. Pelaksana tidak dapat mengubah atau menghapus data tersimpan, tidak dapat menambah lokasi gudang, dan pengembalian barang dilakukan melalui sumber proyek, bukan manual.' },
        ],
        steps: ['Periksa nama dan peran akun melalui menu profil di kanan atas.', 'Gunakan menu yang tersedia sesuai tanggung jawab pekerjaan.', 'Hubungi Admin aplikasi apabila peran atau akses akun perlu diperbarui.'],
        note: 'Pembatasan akses juga diterapkan pada sisi server. Mengetik alamat halaman atau endpoint secara langsung tidak memberikan hak akses tambahan.',
    },
    {
        id: 'warehouse', category: 'Master Data', title: 'Master Data Gudang', description: 'Mengelola lokasi gudang yang digunakan dalam operasional.', icon: Warehouse,
        intro: 'Master Data Gudang menyimpan daftar lokasi gudang yang menjadi referensi dalam pengelolaan persediaan.',
        sections: [
            { heading: 'Melihat lokasi gudang', body: 'Buka Dashboard dan temukan bagian peta atau daftar gudang. Pilih lokasi untuk melihat informasi yang tersedia.' },
            { heading: 'Menambahkan lokasi', body: 'Penambahan lokasi gudang hanya dapat dilakukan oleh Admin. Supervisi dan Pelaksana tidak memiliki akses untuk membuat lokasi baru.' },
            { heading: 'Mengubah atau menghapus lokasi', body: 'Admin dan Supervisi dapat mengelola lokasi yang sudah ada. Pelaksana hanya dapat melihat data lokasi.' },
        ],
        steps: ['Buka Dashboard.', 'Pilih lokasi gudang yang ingin diperiksa.', 'Untuk perubahan data, gunakan tindakan yang tersedia pada akun Admin atau Supervisi.', 'Pastikan lokasi yang dipilih benar sebelum menyimpan perubahan.'],
        note: 'Perubahan lokasi gudang dapat memengaruhi referensi transaksi. Pastikan koordinasi dengan pihak operasional sebelum mengubah atau menghapus lokasi.',
    },
    {
        id: 'itemss', category: 'Master Data', title: 'Master Barang', description: 'Melihat dan mengelola daftar barang persediaan.', icon: Package,
        intro: 'Master Barang merupakan daftar referensi barang yang digunakan pada transaksi masuk, keluar, transfer, dan pengembalian.',
        sections: [
            { heading: 'Mencari barang', body: 'Gunakan pencarian dan filter yang tersedia pada tabel untuk menemukan barang berdasarkan informasi yang tercatat.' },
            { heading: 'Menambahkan barang', body: 'Pengguna dengan akses operasional dapat menambahkan data barang melalui tombol Tambah Data Baru. Lengkapi informasi yang diminta pada formulir.' },
            { heading: 'Mengubah dan menghapus', body: 'Pengubahan dan penghapusan data tersimpan hanya tersedia untuk Admin dan Supervisi. Pelaksana tetap dapat melihat data dan melakukan penambahan yang diizinkan.' },
        ],
        steps: ['Buka menu Master Barang.', 'Gunakan pencarian atau filter untuk menemukan barang.', 'Pilih Tambah Data Baru untuk mencatat barang baru apabila tombol tersedia.', 'Periksa kembali informasi barang sebelum menyimpan.'],
        note: 'Pastikan identitas barang dan informasi satuannya konsisten agar pencatatan transaksi berikutnya tetap akurat.',
    },
    {
        id: 'projects', category: 'Master Data', title: 'Master Data Proyek', description: 'Daftar proyek sebagai referensi transaksi barang.', icon: FolderKanban,
        intro: 'Master Data Proyek menyimpan data proyek yang digunakan sebagai tujuan atau referensi pada aktivitas operasional.',
        sections: [
            { heading: 'Melihat proyek', body: 'Buka bagian Master Data Proyek dari Dashboard untuk melihat daftar proyek yang tersedia.' },
            { heading: 'Menambahkan proyek', body: 'Pengguna operasional termasuk Pelaksana dapat menambahkan proyek melalui tombol Tambah Proyek.' },
            { heading: 'Mengubah dan menghapus', body: 'Tindakan ubah dan hapus hanya tersedia bagi Admin dan Supervisi. Pelaksana dapat melihat dan menambahkan data proyek, tetapi tidak mengubah atau menghapus data tersimpan.' },
        ],
        steps: ['Buka Dashboard dan masuk ke Master Data Proyek.', 'Cari proyek melalui daftar yang tersedia.', 'Pilih Tambah Proyek untuk mencatat proyek baru jika diperlukan.', 'Periksa kode dan nama proyek sebelum menyimpan.'],
        note: 'Gunakan kode proyek yang benar saat mencatat transaksi agar penelusuran barang berdasarkan proyek dapat dilakukan dengan konsisten.',
    },
    {
        id: 'inbound', category: 'Transaksi', title: 'Barang Masuk', description: 'Mencatat penerimaan barang ke gudang.', icon: ArrowDownToLine,
        intro: 'Transaksi Barang Masuk digunakan untuk mencatat barang yang diterima dan menambah persediaan gudang.',
        sections: [
            { heading: 'Penerimaan barang', body: 'Pilih proses Barang Masuk, tentukan data barang dan gudang penerima, kemudian lengkapi informasi transaksi sesuai formulir yang tampil.' },
            { heading: 'Pengembalian barang', body: 'Pengembalian dari proyek dicatat melalui jenis transaksi Pengembalian. Untuk barang berserial, pemilihan SN/No. SN menjadi dasar pencatatan jumlah unit yang dikembalikan.' },
            { heading: 'Sumber pengembalian', body: 'Pengembalian dapat menggunakan sumber proyek. Pengembalian dengan sumber manual hanya tersedia untuk Admin dan Supervisi; Pelaksana menggunakan sumber proyek.' },
        ],
        steps: ['Buka menu Transaksi Stok.', 'Pilih proses Barang Masuk.', 'Lengkapi data penerimaan sesuai jenis transaksi.', 'Periksa barang, jumlah, dan gudang tujuan.', 'Simpan transaksi setelah seluruh informasi sesuai.'],
        note: 'Untuk pengembalian barang berserial, pastikan SN/No. SN yang dipilih sesuai dengan unit fisik yang benar-benar diterima.',
    },
    {
        id: 'outbound', category: 'Transaksi', title: 'Barang Keluar', description: 'Mencatat barang yang dikeluarkan dari gudang.', icon: ArrowUpFromLine,
        intro: 'Transaksi Barang Keluar digunakan untuk mencatat pengeluaran barang dari persediaan gudang, termasuk pengeluaran yang ditujukan ke proyek.',
        sections: [
            { heading: 'Pencatatan pengeluaran', body: 'Pilih Barang Keluar, tentukan barang dan informasi tujuan sesuai formulir, lalu periksa jumlah yang akan dikeluarkan.' },
            { heading: 'Dampak terhadap stok', body: 'Barang yang berhasil dicatat keluar akan mengurangi stok gudang sesuai jumlah transaksi.' },
            { heading: 'Pemeriksaan sebelum menyimpan', body: 'Pastikan barang, gudang asal, tujuan, dan kuantitas sudah benar. Ketidaksesuaian data dapat memengaruhi laporan persediaan.' },
        ],
        steps: ['Buka Transaksi Stok dan pilih Barang Keluar.', 'Pilih barang yang akan dikeluarkan.', 'Lengkapi informasi sumber, tujuan, serta jumlah.', 'Periksa kembali ringkasan transaksi.', 'Simpan transaksi.'],
        note: 'Pengeluaran barang ke proyek akan tercatat sebagai pergerakan stok dan dapat ditelusuri melalui History Moving.',
    },
    {
        id: 'transfer', category: 'Transaksi', title: 'Transfer Gudang', description: 'Memindahkan barang ke gudang lain atau ke proyek.', icon: ArrowLeftRight,
        intro: 'Transfer digunakan untuk mencatat perpindahan barang dari gudang asal menuju gudang lain atau proyek.',
        sections: [
            { heading: 'Tentukan jenis tujuan', body: 'Pilih apakah tujuan transfer adalah Gudang atau Proyek. Pilihan tujuan menentukan informasi lanjutan yang perlu dilengkapi.' },
            { heading: 'Tujuan gudang', body: 'Untuk transfer ke gudang, pilih gudang penerima yang sesuai.' },
            { heading: 'Tujuan proyek', body: 'Untuk transfer ke proyek, pilih kode proyek yang menjadi tujuan. Isian yang khusus untuk tujuan gudang tidak perlu digunakan pada alur tujuan proyek.' },
            { heading: 'Dampak terhadap stok', body: 'Transfer ke proyek mengurangi stok gudang asal. Pergerakan ke gudang lain dicatat sebagai perpindahan persediaan antar lokasi.' },
        ],
        steps: ['Buka Transaksi Stok dan pilih Transfer Gudang.', 'Pilih barang serta gudang asal.', 'Tentukan kategori tujuan: Gudang atau Proyek.', 'Pilih tujuan yang sesuai dan masukkan jumlah.', 'Periksa ringkasan sebelum menyimpan.'],
        note: 'Pastikan kategori tujuan dan lokasi/proyek tujuan sudah benar. Kesalahan tujuan dapat membuat penelusuran persediaan menjadi tidak sesuai.',
    },
    {
        id: 'return', category: 'Transaksi', title: 'Pengembalian Barang', description: 'Mencatat barang yang kembali dari proyek ke gudang.', icon: RotateCcw,
        intro: 'Pengembalian digunakan saat barang yang sebelumnya dibawa ke proyek dikembalikan ke gudang.',
        sections: [
            { heading: 'Pilih sumber barang', body: 'Pilih sumber proyek yang sesuai agar riwayat asal barang tetap dapat ditelusuri. Admin dan Supervisi juga dapat menggunakan sumber manual sesuai kebutuhan operasional.' },
            { heading: 'Barang berserial', body: 'Pilih SN/No. SN yang benar-benar dikembalikan. Jumlah unit mengikuti pilihan serial yang ditambahkan atau dilepas, sehingga kuantitas tidak perlu dihitung terpisah secara manual.' },
            { heading: 'Pemeriksaan', body: 'Pastikan asal barang, barang, serial, jumlah, dan gudang penerima sudah sesuai sebelum transaksi disimpan.' },
        ],
        steps: ['Buka Transaksi Stok dan pilih proses Pengembalian pada Barang Masuk.', 'Pilih sumber proyek atau sumber manual jika akun memiliki izin.', 'Pilih barang yang dikembalikan.', 'Untuk barang berserial, pilih SN/No. SN yang sesuai.', 'Periksa jumlah dan gudang penerima, kemudian simpan.'],
        note: 'Pelaksana hanya dapat mencatat pengembalian dengan sumber proyek. Opsi sumber manual tidak tersedia untuk peran tersebut.',
    },
    {
        id: 'history', category: 'Riwayat & Laporan', title: 'History Moving', description: 'Menelusuri riwayat pergerakan barang.', icon: History,
        intro: 'History Moving membantu pengguna menelusuri pergerakan barang berdasarkan catatan transaksi yang telah tersimpan.',
        sections: [
            { heading: 'Menelusuri data', body: 'Buka menu History Moving, kemudian gunakan pencarian atau filter yang tersedia untuk mempersempit data yang ingin diperiksa.' },
            { heading: 'Memeriksa detail', body: 'Perhatikan informasi barang, jenis pergerakan, waktu, serta sumber dan tujuan yang tersedia pada tabel.' },
            { heading: 'Ekspor', body: 'Gunakan fitur ekspor apabila tersedia dan diperlukan untuk kebutuhan pemeriksaan atau dokumentasi.' },
        ],
        steps: ['Buka menu History Moving.', 'Tentukan kata kunci atau filter yang ingin digunakan.', 'Periksa baris transaksi yang relevan.', 'Gunakan ekspor untuk menyimpan rekap jika diperlukan.'],
        note: 'History Moving merupakan sarana penelusuran. Untuk koreksi data transaksi, ikuti prosedur operasional dan gunakan akun yang memiliki hak akses perubahan.',
    },
    {
        id: 'reports', category: 'Riwayat & Laporan', title: 'Laporan Bulanan', description: 'Melihat rekap persediaan dan aktivitas per periode.', icon: FileSpreadsheet,
        intro: 'Laporan Bulanan menyajikan ringkasan data persediaan dan aktivitas untuk membantu pemeriksaan operasional per periode.',
        sections: [
            { heading: 'Memilih periode', body: 'Buka menu Laporan Bulanan dan pilih periode yang ingin ditinjau melalui kontrol yang tersedia.' },
            { heading: 'Membaca rincian', body: 'Periksa ringkasan dan rincian aset yang ditampilkan. Gunakan informasi pendukung pada tabel untuk memahami komposisi data.' },
            { heading: 'Ekspor laporan', body: 'Apabila dibutuhkan, gunakan fitur ekspor untuk menyimpan laporan sesuai periode yang sedang ditinjau.' },
        ],
        steps: ['Buka menu Laporan Bulanan.', 'Pilih periode laporan.', 'Tinjau ringkasan dan tabel rincian.', 'Ekspor laporan apabila diperlukan.'],
        note: 'Pastikan periode yang dipilih sudah sesuai sebelum menggunakan angka laporan sebagai bahan rekap atau evaluasi.',
    },
    {
        id: 'users', category: 'Administrasi', title: 'Manajemen Pengguna', description: 'Mengelola akun dan peran pengguna aplikasi.', icon: Users,
        intro: 'Manajemen Pengguna digunakan Admin untuk mengelola akun yang dapat mengakses aplikasi.',
        sections: [
            { heading: 'Akses halaman', body: 'Menu Admin Panel dan Manajemen Pengguna hanya tersedia untuk Admin.' },
            { heading: 'Peran akun', body: 'Peran yang digunakan adalah Admin, Supervisi, dan Pelaksana. Pilih peran sesuai tanggung jawab pengguna.' },
            { heading: 'Keamanan akun', body: 'Berikan akun hanya kepada pengguna yang berwenang. Jangan membagikan kata sandi dan lakukan pembaruan akses melalui Admin apabila tanggung jawab pengguna berubah.' },
        ],
        steps: ['Masuk menggunakan akun Admin.', 'Buka Admin Panel atau Manajemen Pengguna.', 'Tambahkan atau perbarui informasi pengguna sesuai kebutuhan.', 'Tentukan peran yang sesuai.', 'Periksa kembali perubahan sebelum menyimpan.'],
        note: 'Hanya Admin yang dapat membuka halaman Manajemen Pengguna. Supervisi dan Pelaksana tidak memiliki akses ke menu ini.',
    },
];

const categories = ['Semua topik', 'Mulai', 'Master Data', 'Transaksi', 'Riwayat & Laporan', 'Administrasi'];

// Vite akan mendaftarkan semua gambar WebP di folder images, termasuk subfolder.
// Penambahan gambar baru tidak memerlukan import atau perubahan daftar di bawah ini.
const helpImageFiles = import.meta.glob('../../../images/**/*.webp', {
    eager: true,
    query: '?url',
    import: 'default',
});

function getGuideImages(guideId, group = null) {
    const guideFolder = `../../../images/${guideId}/`;
    const normalizedGroup = group
        ? String(group).replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
        : '';
    const targetFolder = normalizedGroup ? `${guideFolder}${normalizedGroup}/` : guideFolder;

    return Object.entries(helpImageFiles)
        .filter(([filePath]) => filePath.startsWith(targetFolder))
        .sort(([pathA], [pathB]) => pathA.localeCompare(pathB, undefined, { numeric: true, sensitivity: 'base' }))
        .map(([filePath, src], index) => {
            const fileName = filePath.split('/').pop() || '';
            const readableName = fileName
                .replace(/\.webp$/i, '')
                .replace(/^\d+[-_.\s]*/, '')
                .replace(/[-_]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            return {
                key: filePath,
                src,
                caption: readableName
                    ? readableName.charAt(0).toUpperCase() + readableName.slice(1)
                    : `Gambar ${index + 1}`,
            };
        });
}

function SectionHeading({ children }) {
    return <h3 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">{children}</h3>;
}

export default function HelpIndex() {
    const [activeCategory, setActiveCategory] = useState('Semua topik');
    const [search, setSearch] = useState('');
    const [activeId, setActiveId] = useState('overview');
    const [selectedImage, setSelectedImage] = useState(null);

    const filteredGuides = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return guides.filter((guide) => {
            const matchCategory = activeCategory === 'Semua topik' || guide.category === activeCategory;
            const searchable = `${guide.title} ${guide.description} ${guide.category} ${guide.intro}`.toLowerCase();
            return matchCategory && (!keyword || searchable.includes(keyword));
        });
    }, [activeCategory, search]);

    const activeGuide = guides.find((guide) => guide.id === activeId) || guides[0];
    const currentIndex = guides.findIndex((guide) => guide.id === activeGuide.id);
    const previousGuide = guides[currentIndex - 1];
    const nextGuide = guides[currentIndex + 1];
    const ActiveIcon = activeGuide.icon;
    // Tetap mendukung galeri lama di root folder topik. Jika sebuah panduan
    // memakai imageGroup/content, gambar akan ditempatkan sesuai konfigurasi section.
    const activeImages = useMemo(() => getGuideImages(activeGuide.id), [activeGuide.id]);
    const hasInlineImages = activeGuide.sections.some((section) => (
        Boolean(section.imageGroup)
        || (Array.isArray(section.content) && section.content.some((item) => item.type === 'image'))
    ));

    const renderImageGroup = (group, key) => {
        if (group === undefined) return null;
        const images = getGuideImages(activeGuide.id, group);
        if (images.length === 0) return null;

        return (
            <div key={key} className="mt-4 space-y-3">
                {images.length > 1 && (
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {images.length} gambar
                    </p>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {images.map((image, index) => (
                        <figure key={image.key} className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-950/40">
                            <button
                                type="button"
                                onClick={() => setSelectedImage({ ...image, guideTitle: activeGuide.title })}
                                className="group relative block w-full cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                                aria-label={`Perbesar gambar ${image.caption}`}
                            >
                                <img
                                    src={image.src}
                                    alt={`${activeGuide.title} — ${image.caption}`}
                                    loading="lazy"
                                    decoding="async"
                                    className="max-h-[360px] w-full bg-white object-contain transition-opacity group-hover:opacity-90 dark:bg-slate-950"
                                />
                                <span className="absolute bottom-2 right-2 rounded-md bg-slate-950/75 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                                    Klik untuk perbesar
                                </span>
                            </button>
                            <figcaption className="flex items-start gap-2 border-t border-slate-200 px-3 py-2.5 dark:border-white/10">
                                <span className="mt-0.5 text-[10px] font-semibold tabular-nums text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{image.caption}</span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        );
    };

    useEffect(() => {
        if (!selectedImage) return undefined;
        const handleEscape = (event) => {
            if (event.key === 'Escape') setSelectedImage(null);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [selectedImage]);

    const chooseCategory = (category) => {
        setActiveCategory(category);
        setSearch('');
        const nextGuide = guides.find((guide) => category === 'Semua topik' || guide.category === category);
        if (nextGuide) setActiveId(nextGuide.id);
    };

    const chooseSearch = (value) => {
        setSearch(value);
        if (value.trim()) {
            setActiveCategory('Semua topik');
            const match = guides.find((guide) => `${guide.title} ${guide.description} ${guide.category} ${guide.intro}`.toLowerCase().includes(value.trim().toLowerCase()));
            if (match) setActiveId(match.id);
        }
    };

    return (
        <AuthenticatedLayout header="Pusat Bantuan">
            <Head title="Pusat Bantuan" />
            <div className="mx-auto w-full max-w-7xl space-y-5">
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <Link href="/dashboard" className="transition hover:text-blue-600 dark:hover:text-amber-400">Dashboard</Link>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span className="text-slate-700 dark:text-slate-200">Pusat Bantuan</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Pusat Bantuan</h1>
                        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Panduan penggunaan aplikasi pengelolaan gudang dan persediaan.</p>
                    </div>
                    <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300">
                        <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span>{guides.length} panduan tersedia</span>
                    </div>
                </div>

                <div className="grid min-h-[680px] grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <aside className="h-fit overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/80 lg:sticky lg:top-24">
                        <div className="border-b border-slate-200 px-4 py-4 dark:border-white/10">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Telusuri panduan</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Cari berdasarkan topik atau fitur.</p>
                            <div className="relative mt-3">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => chooseSearch(event.target.value)}
                                    placeholder="Cari panduan..."
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-950"
                                />
                                {search && <button type="button" onClick={() => setSearch('')} aria-label="Hapus pencarian" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"><X className="h-3.5 w-3.5" /></button>}
                            </div>
                        </div>

                        <div className="px-3 py-3">
                            <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Kategori</p>
                            <div className="space-y-1">
                                {categories.map((category) => {
                                    const selected = activeCategory === category;
                                    return (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => chooseCategory(category)}
                                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${selected ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-100'}`}
                                        >
                                            <span>{category}</span>
                                            {selected && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="border-t border-slate-200 px-3 py-3 dark:border-white/10">
                            <div className="flex items-center justify-between px-2 pb-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Topik panduan</p>
                                <span className="text-[11px] tabular-nums text-slate-400">{filteredGuides.length}</span>
                            </div>
                            <div className="max-h-[360px] space-y-1 overflow-y-auto pr-1">
                                {filteredGuides.map((guide) => {
                                    const GuideIcon = guide.icon;
                                    const selected = activeGuide.id === guide.id;
                                    return (
                                        <button
                                            key={guide.id}
                                            type="button"
                                            onClick={() => setActiveId(guide.id)}
                                            className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition ${selected ? 'bg-slate-100 text-slate-900 dark:bg-white/[0.07] dark:text-white' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/[0.035]'}`}
                                        >
                                            <GuideIcon className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                                            <span className="min-w-0 flex-1">
                                                <span className={`block text-[13px] ${selected ? 'font-semibold' : 'font-medium'}`}>{guide.title}</span>
                                                <span className="mt-0.5 block truncate text-[11px] text-slate-400">{guide.category}</span>
                                            </span>
                                            {selected && <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />}
                                        </button>
                                    );
                                })}
                                {filteredGuides.length === 0 && <p className="px-2 py-5 text-center text-xs leading-5 text-slate-500">Tidak ada panduan yang cocok. Coba kata kunci lain.</p>}
                            </div>
                        </div>
                    </aside>

                    <article className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/80">
                        <div className="border-b border-slate-200 px-5 py-5 dark:border-white/10 sm:px-7 sm:py-6">
                            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>Panduan</span><ChevronRight className="h-3.5 w-3.5" /><span>{activeGuide.category}</span>
                            </div>
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-blue-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-blue-300"><ActiveIcon className="h-5 w-5" /></div>
                                <div className="min-w-0">
                                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">{activeGuide.title}</h2>
                                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{activeGuide.description}</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-6 sm:px-7 sm:py-7">
                            <p className="max-w-3xl text-[15px] leading-7 text-slate-700 dark:text-slate-300">{activeGuide.intro}</p>

                            <div className="mt-7 space-y-6">
                                {activeGuide.sections.map((section) => (
                                    <section key={section.heading} className="max-w-3xl">
                                        <SectionHeading>{section.heading}</SectionHeading>

                                        {Array.isArray(section.content) ? (
                                            <div className="mt-2 space-y-4">
                                                {section.content.map((item, index) => {
                                                    if (item.type === 'image') {
                                                        return renderImageGroup(item.group, `${section.heading}-image-${index}`);
                                                    }

                                                    if (item.type === 'text') {
                                                        return (
                                                            <p key={`${section.heading}-text-${index}`} className="text-sm leading-7 text-slate-600 dark:text-slate-400">
                                                                {item.value}
                                                            </p>
                                                        );
                                                    }

                                                    return null;
                                                })}
                                            </div>
                                        ) : (
                                            <>
                                                {section.body && (
                                                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{section.body}</p>
                                                )}
                                                {section.imageGroup && renderImageGroup(section.imageGroup, `${section.heading}-imageGroup`)}
                                            </>
                                        )}
                                    </section>
                                ))}
                            </div>

                            {!hasInlineImages && activeImages.length > 0 && (
                                <section className="mt-8 border-t border-slate-200 pt-6 dark:border-white/10">
                                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Gambar panduan</h3>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tangkapan layar untuk membantu menjelaskan langkah penggunaan.</p>
                                        </div>
                                        <span className="text-[11px] text-slate-400">{activeImages.length} gambar</span>
                                    </div>
                                    {renderImageGroup('', `${activeGuide.id}-legacy-gallery`)}
                                </section>
                            )}

                            <div className="mt-8 border-t border-slate-200 pt-6 dark:border-white/10">
                                <div className="mb-4 flex items-center gap-2">
                                    <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Alur penggunaan</h3>
                                </div>
                                <ol className="space-y-3">
                                    {activeGuide.steps.map((step, index) => (
                                        <li key={`${activeGuide.id}-${index}`} className="flex items-start gap-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[11px] font-semibold tabular-nums text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">{index + 1}</span>
                                            <p className="pt-0.5 text-sm leading-6 text-slate-600 dark:text-slate-400">{step}</p>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            <div className="mt-7 flex items-start gap-3 rounded-lg border border-blue-200/80 bg-blue-50/70 px-4 py-3.5 dark:border-blue-400/20 dark:bg-blue-500/[0.06]">
                                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-300" />
                                <div>
                                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">Catatan</p>
                                    <p className="mt-1 text-sm leading-6 text-blue-900/80 dark:text-blue-100/70">{activeGuide.note}</p>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-xs text-slate-400">Topik {currentIndex + 1} dari {guides.length}</div>
                                <div className="flex items-center justify-between gap-2 sm:justify-end">
                                    {previousGuide ? (
                                        <button type="button" onClick={() => setActiveId(previousGuide.id)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.04]"><ArrowLeft className="h-3.5 w-3.5" /> Sebelumnya</button>
                                    ) : <span />}
                                    {nextGuide && <button type="button" onClick={() => setActiveId(nextGuide.id)} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500">Berikutnya <ArrowRight className="h-3.5 w-3.5" /></button>}
                                </div>
                            </div>
                        </div>
                    </article>
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                    <span>Belum menemukan informasi yang dicari?</span>
                    <span>Hubungi Admin aplikasi untuk bantuan akun atau hak akses.</span>
                </div>
            </div>

            {selectedImage && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Pratinjau gambar ${selectedImage.caption}`}
                    onClick={() => setSelectedImage(null)}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
                >
                    <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        aria-label="Tutup gambar"
                        className="absolute right-4 top-4 z-10 rounded-lg border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="flex max-h-full w-full max-w-6xl flex-col items-center gap-3" onClick={(event) => event.stopPropagation()}>
                        <img
                            src={selectedImage.src}
                            alt={`${selectedImage.guideTitle || activeGuide.title} — ${selectedImage.caption}`}
                            className="max-h-[82vh] max-w-full rounded-lg bg-white object-contain shadow-2xl"
                        />
                        <p className="text-center text-sm font-medium text-white">{selectedImage.caption}</p>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
