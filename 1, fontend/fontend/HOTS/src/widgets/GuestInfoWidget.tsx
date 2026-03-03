import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { WidgetProps } from '@/types/widgetTypes';

const GuestInfoWidget: React.FC<WidgetProps> = () => {
    // Mock data for Guest Info
    const guests = [
        { id: 1, name: "John Doe", company: "TechCorp", purpose: "Meeting", host: "Alice Admin", checkIn: "09:00 AM", status: "Checked In" },
        { id: 2, name: "Jane Smith", company: "Vendor Inc", purpose: "Delivery", host: "Reception", checkIn: "10:15 AM", status: "Checked Out" },
        { id: 3, name: "Robert Johnson", company: "Consultants LLC", purpose: "Interview", host: "Bob Manager", checkIn: "11:30 AM", status: "Checked In" },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Guest Log (Today)</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Guest Name</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>Host</TableHead>
                            <TableHead>Check In</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {guests.map((guest) => (
                            <TableRow key={guest.id}>
                                <TableCell className="font-medium">{guest.name}</TableCell>
                                <TableCell>{guest.company}</TableCell>
                                <TableCell>{guest.purpose}</TableCell>
                                <TableCell>{guest.host}</TableCell>
                                <TableCell>{guest.checkIn}</TableCell>
                                <TableCell>
                                    <Badge variant={guest.status === 'Checked In' ? 'default' : 'secondary'}>
                                        {guest.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default GuestInfoWidget;
