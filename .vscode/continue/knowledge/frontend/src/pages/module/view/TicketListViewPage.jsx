import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "@/config/sourceConfig";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function TicketListPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMine, setFilterMine] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  async function load() {
    setLoading(true);

    const params = new URLSearchParams();
    if (filterMine) params.append("mine", "true");
    if (filterStatus) params.append("status", filterStatus);

    try {
      const res = await fetch(`${API_URL}/engine/tickets?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("tokek")}`
        }
      });

      const json = await res.json();

      // REAL backend uses json.rows
      setTickets(json.rows || []);
    } catch (err) {
      console.error("Ticket list error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filterMine, filterStatus]);

  const filtered = tickets.filter(t =>
    (t.service_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.ticket_id || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tickets</h1>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by ID or service..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <select
          className="border rounded px-3 py-2"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_approval">In Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <Button
          variant={filterMine ? "default" : "outline"}
          onClick={() => setFilterMine(!filterMine)}
        >
          {filterMine ? "Showing My Requests" : "My Requests"}
        </Button>
      </div>

      <div className="border rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 border-b">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Created By</th>
              <th className="text-left p-3">Created</th>
              <th className="text-center p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="6" className="p-6 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" />
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-500">
                  No tickets found.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map(t => (
                <tr key={t.ticket_id} className="border-b hover:bg-neutral-50">
                  <td className="p-3 font-medium">{t.ticket_id}</td>

                  <td className="p-3">{t.service_name || "-"}</td>

                  <td className="p-3">
                    <Badge className="capitalize">{t.status}</Badge>
                  </td>

                  <td className="p-3">{t.creator_name || "-"}</td>

                  <td className="p-3">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>

                  <td className="p-3 text-center">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/tickets/${t.ticket_id}`)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
