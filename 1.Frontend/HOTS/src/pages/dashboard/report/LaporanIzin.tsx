import React from 'react';
import GenericReportPanel from '../panels/GenericReportPanel';

const LaporanIzin: React.FC = () => {
    return (
        <GenericReportPanel
            config={{
                apiEndpoint: '/hotsdashboard/service_tickets/2',
                ticketKey: 'ticket_id'
            }}
            serviceId={2}
        />
    );
};

export default LaporanIzin;
