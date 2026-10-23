import React from 'react';
import GenericReportPanel from '../panels/GenericReportPanel';

const LaporanLembur: React.FC = () => {
    return (
        <GenericReportPanel
            config={{
                apiEndpoint: '/hotsdashboard/service_tickets/22',
                ticketKey: 'ticket_id'
            }}
            serviceId={22}
        />
    );
};

export default LaporanLembur;
