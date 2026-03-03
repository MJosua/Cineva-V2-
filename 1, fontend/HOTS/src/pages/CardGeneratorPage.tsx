// pages/CardGeneratorPage.tsx
// Dedicated page for Card Name Generator (HR Tools)

import React from 'react';
// import { AppLayout } from '@/components/layout/AppLayout';
import CardNameGenerator from '@/widgets/CardNameGenerator';
import { CreditCard } from 'lucide-react';

const CardGeneratorPage: React.FC = () => {
    return (
        <div className="card-generator-page">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                        <CreditCard className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">User Name Card Generator</h1>
                </div>
                <p className="text-slate-400">
                    Generate official business cards for employees. Search by name or NIK, review employee information, and generate printable PDF cards.
                </p>
            </div>

            {/* Widget Container */}
            <CardNameGenerator />
        </div>
    );
};

export default CardGeneratorPage;
