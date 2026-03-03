import React from 'react';
import GenericReportPanel from '../panels/GenericReportPanel';

const LaporanKoreksi: React.FC = () => {
    return (
        <GenericReportPanel
            config={{
                apiEndpoint: '/hotsdashboard/service_tickets/18',
                ticketKey: 'ticket_id'
            }}
            serviceId={18}
        />
    );
};

export default LaporanKoreksi;
