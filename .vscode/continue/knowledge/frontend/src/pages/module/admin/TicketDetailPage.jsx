import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_URL } from "@/config/sourceConfig";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function TicketDetailPage() {
  const { ticket_id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch(`${API_URL}/engine/status/${ticket_id}`);
    const json = await res.json();
    console.log("Ticket Detail:", json);
    setTicket(json.ticket);
    setEvents(json.events);
  }
  const token = localStorage.getItem("tokek");

  async function doApprove() {
    const res = await fetch(`${API_URL}/engine/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },

      body: JSON.stringify({ ticket_id, approver_id: 2 }) // TEMP
    });

    toast({ title: "Approved" });
    load();
  }

  async function doReject() {
    const res = await fetch(`${API_URL}/engine/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },

      body: JSON.stringify({ ticket_id, approver_id: 2, note: "Reason" })
    });

    toast({ title: "Rejected" });
    load();
  }

  if (!ticket) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Ticket #{ticket_id}</h1>

      <div className="border p-4 rounded bg-neutral-50">
        <div><b>Title:</b> {ticket.title}</div>
        <div><b>Status:</b> {ticket.status}</div>
        <div><b>Created By:</b> {ticket.creator_name}</div>
      </div>

      <h2 className="text-xl font-semibold">Approval Timeline</h2>

      <div className="space-y-3">
        {events.map((ev) => (
          <div key={ev.event_id} className="border p-3 rounded">
            <div><b>Level:</b> {ev.approval_order}</div>
            <div><b>Actor:</b> {ev.actor_name || "-"}</div>
            <div><b>Status:</b> {ev.status}</div>
            <div><b>Note:</b> {ev.note || "-"}</div>
          </div>
        ))}
      </div>

      {/* SHOW BUTTONS ONLY IF CURRENT APPROVER */}
      {ticket.next_actor_id === 2 && ( // TEMP: logged in user ID
        <div className="flex gap-3">
          <Button onClick={doApprove}>Approve</Button>
          <Button variant="destructive" onClick={doReject}>Reject</Button>
        </div>
      )}
    </div>
  );
}
