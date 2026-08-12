import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import TabMasterData from './MasterData/TabMasterData';

export default function AssetsDataManagementIndex({ combatMasters, templateMasters, filters }) {
    return (
        <AuthenticatedLayout header="Assets Data Management">
            <Head title="Assets Data Management" />

            <div className="space-y-6">
                <TabMasterData 
                    combatMasters={combatMasters} 
                    templateMasters={templateMasters} 
                    filters={filters} 
                />
            </div>
        </AuthenticatedLayout>
    );
}