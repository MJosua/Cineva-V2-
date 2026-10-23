import React from 'react';
import { DiffWidget } from './DiffWidget';
import { DetailTableWidget } from './DetailTableWidget';

interface SpecialFuncFactoryProps {
    data: {
        element_type: string;
        config: any;
        title?: string;
    };
    globalValues: Record<string, any>;
    setGlobalValues: (values: any) => void;
    id: string; // The component ID in form structure
}

export const SpecialFuncFactory: React.FC<SpecialFuncFactoryProps> = ({ data, globalValues, setGlobalValues, id }) => {

    // Safety check
    if (!data || !data.element_type) {
        return <div className="p-4 border border-red-200 bg-red-50 text-red-600 rounded">Error: Invalid Widget Configuration</div>;
    }

    switch (data.element_type) {
        case 'diff_table':
            return (
                <div className="my-4">
                    {data.title && <h3 className="text-sm font-semibold mb-2 text-gray-700">{data.title}</h3>}
                    <DiffWidget
                        config={data.config}
                        globalValues={globalValues}
                        setGlobalValues={setGlobalValues}
                        id={id}
                    />
                </div>
            );

        case 'detail_table':
            return (
                <div className="my-4">
                    {data.title && <h3 className="text-sm font-semibold mb-2 text-gray-700">{data.title}</h3>}
                    <DetailTableWidget
                        config={data.config}
                        globalValues={globalValues}
                        setGlobalValues={setGlobalValues}
                        id={id}
                    />
                </div>
            );

        default:
            return (
                <div className="p-4 border border-dashed border-gray-300 rounded text-center text-gray-400">
                    Unknown Widget Type: {data.element_type}
                </div>
            );
    }
};
