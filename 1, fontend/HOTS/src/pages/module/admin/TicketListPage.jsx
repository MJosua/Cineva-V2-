    import { useEffect, useState } from "react";
    import { API_URL } from "@/config/sourceConfig";
    import { Button } from "@/components/ui/button";
    import { useNavigate } from "react-router-dom";

    export default function TicketListViewPage() {
        const [rows, setRows] = useState([]);
        const navigate = useNavigate();

        useEffect(() => {
            load();
        }, []);

        async function load() {
            const token = localStorage.getItem("tokek");  // adjust to your token name

            const res = await fetch(`${API_URL}/engine/tickets`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            });

            const json = await res.json();
            setRows(json.tickets || json.rows || []);
        }

        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Tickets</h1>

                <table className="w-full border text-sm">
                    <thead className="bg-neutral-100">
                        <tr>
                            <th className="p-2 text-left">ID</th>
                            <th className="p-2 text-left">Title</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left">Created By</th>
                            <th className="p-2 text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((t) => (
                            <tr key={t.ticket_id} className="border-b">
                                <td className="p-2">{t.ticket_id}</td>
                                <td className="p-2">{t.title}</td>
                                <td className="p-2 capitalize">{t.status}</td>
                                <td className="p-2">{t.creator_name}</td>
                                <td className="p-2 text-center">
                                    <Button size="sm" onClick={() => navigate(`/tickets/${t.ticket_id}`)}>
                                        View
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
