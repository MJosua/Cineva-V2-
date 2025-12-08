import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ApproveRejectModal from "@/components/approval/ApproveRejectModal";
import ApprovalHistory from "@/components/approval/ApprovalHistory";

import { toast } from "@/components/ui/use-toast";
import { API_URL } from "@/config/sourceConfig";

export default function TicketApprovalPage() {
  const { ticket_id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [fields, setFields] = useState([]);
  const [history, setHistory] = useState([]);

  const [modalAction, setModalAction] = useState(null);

  useEffect(() => {
    load();
  }, [ticket_id]);

  async function load() {
    try {
      const res = await fetch(`${API_URL}/engine/ticket/status/${ticket_id}`);
      const json = await res.json();

      if (!json.ok) {
        toast({ title: "Error", description: json.message });
        return;
      }

      setTicket(json.ticket);
      setFields(json.fields);
      setHistory(json.history);

    } catch (err) {
      toast({ title: "Error", description: err.message });
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      
      <h1 className="text-2xl font-bold">Ticket Approval</h1>

      {/* Ticket Metadata */}
      <div className="border p-4 rounded-md bg-white shadow-sm">
        <div className="font-semibold text-lg">{ticket?.service_name}</div>
        <div className="text-sm text-gray-600">Ticket ID: {ticket_id}</div>
        <div className="mt-2">
          <Badge variant="outline">{ticket?.status}</Badge>
        </div>
      </div>

      {/* Ticket Fields */}
      <div className="border p-4 rounded-md bg-white shadow-sm">
        <h2 className="font-semibold mb-3">Submitted Data</h2>
        <div className="grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.cstm_col}>
              <div className="text-sm text-gray-600">{f.lbl_col}</div>
              <div className="font-medium">{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Approval History */}
      <ApprovalHistory events={history} />

      {/* Action Buttons */}
      {ticket?.can_approve && (
        <div className="flex gap-3 pt-4">
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => setModalAction("approve")}>
            Approve
          </Button>
          <Button variant="destructive" onClick={() => setModalAction("reject")}>
            Reject
          </Button>
        </div>
      )}

      {/* Modal */}
      <ApproveRejectModal
        action={modalAction}
        onClose={() => setModalAction(null)}
        ticket_id={ticket_id}
        onDone={load}
      />
    </div>
  );
}
