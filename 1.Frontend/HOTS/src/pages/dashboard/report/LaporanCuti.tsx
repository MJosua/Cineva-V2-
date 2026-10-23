import React from 'react';
import GenericReportPanel from '../panels/GenericReportPanel';

const LaporanCuti: React.FC = () => {
    return (
        <GenericReportPanel
            config={{
                apiEndpoint: '/hotsdashboard/service_tickets/1',
                ticketKey: 'ticket_id'
            }}
            serviceId={1}
        />
    );
};

export default LaporanCuti;
