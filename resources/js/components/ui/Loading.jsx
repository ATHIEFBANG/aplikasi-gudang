import React, { useEffect, useState } from 'react';
import loadingGif from '../../../images/loading.gif';

export default function Loading({ message = 'Memproses Data Gudang' }) {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => {
                if (prev === '') return '.';
                if (prev === '.') return '..';
                if (prev === '..') return '...';
                return '';
            });
        }, 450);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed bottom-5 left-5 z-[100] flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-300">
            <img
                src={loadingGif}
                alt="Loading"
                className="w-22 h-22 object-contain"
            />

            <div className="flex items-center justify-center mt-0.5">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-wide whitespace-nowrap">
                    {message}
                </span>

                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 w-[20px] text-left">
                    {dots}
                </span>
            </div>
        </div>
    );
}