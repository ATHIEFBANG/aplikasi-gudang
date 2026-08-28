import React, { useMemo } from 'react';
import GrafikBatangLogistik from './GrafikBatang';
import GrafikDonutDistribusi from './GrafikDonut';
import GrafikLineKondisi from './GrafikLine';

export default function GrafikTransaksi({ chartData = [], kondisiChartData = [] }) {
    const formattedBarData = useMemo(() => {
        return chartData.map((item) => ({
            ...item,
            total: Number(item.MASUK || 0) + Number(item.KELUAR || 0) + Number(item.TRANSFER || 0),
        }));
    }, [chartData]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <GrafikBatangLogistik data={formattedBarData} />
                <GrafikDonutDistribusi chartData={chartData} />
            </div>
            <GrafikLineKondisi data={kondisiChartData} />
        </div>
    );
}