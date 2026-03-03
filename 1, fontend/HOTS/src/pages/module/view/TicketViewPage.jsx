import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, RefreshCw, Undo2, XCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAppSelector } from "@/hooks/useAppSelector";
import TicketApprovalSection from "@/components/approval/TicketApprovalSection";
import { API_URL } from "@/config/sourceConfig";

export default function TicketViewPage() {
  const { ticket_id } = useParams();
  const navigate = useNavigate();

  const { user } = useAppSelector((s) => s.auth);

  const [ticket, setTicket] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Revision-related
  const [revisions, setRevisions] = useState([]);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [revisionForm, setRevisionForm] = useState(null);
  const [isLoadingRevision, setIsLoadingRevision] = useState(false);

  // Return / Reject dialogs
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnNote, setReturnNote] = useState("");

  const [cancelOpen, setCancelOpen] = useState(false);

  // Load ticket + events + revisions
  async function loadTicket() {
    try {
      const res = await fetch(`${API_URL}/engine/status/${ticket_id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("tokek")}`,
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();
      if (res.ok) {
        setTicket(json.ticket);
        setEvents(json.events);
      } else {
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load ticket.", variant: "destructive" });
    }
  }

  async function loadRevisions() {
    try {
      const res = await fetch(`${API_URL}/engine/ticket/revisions/${ticket_id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("tokek")}`,
        },
      });
      const json = await res.json();
      if (json.ok) {
        setRevisions(json.revisions);
        setSelectedRevision(json.latest);
      }
    } catch (err) {
      console.error("Revision load error:", err);
    }
  }

  async function loadRevisionData(rev) {
    setIsLoadingRevision(true);
    try {
      const res = await fetch(`${API_URL}/engine/ticket/revision/${ticket_id}/${rev}`);
      const json = await res.json();
      if (json.ok) {
        setRevisionForm(json.form_values);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load revision data." });
    }
    setIsLoadingRevision(false);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadTicket();
      await loadRevisions();
      setLoading(false);
    })();
  }, [ticket_id]);

  // Auto load revision form when revision changes
  useEffect(() => {
    if (selectedRevision != null) {
      loadRevisionData(selectedRevision);
    }
  }, [selectedRevision]);

  // Approve
  async function handleApprove() {
    try {
      const res = await fetch(`${API_URL}/engine/ticket/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("tokek")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticket_id: ticket.ticket_id,
          approver_id: user.user_id,
          note: null,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        toast({ title: "Approved", description: "Ticket approved." });
        loadTicket();
      } else {
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: err.message });
    }
  }

  // Return/Revision Request
  async function handleReturnSubmit() {
    try {
      const res = await fetch(`${API_URL}/engine/ticket/return`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("tokek")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticket_id: ticket.ticket_id,
          approver_id: user.user_id,
          note: returnNote,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        toast({ title: "Returned", description: "Revision requested." });
        setReturnOpen(false);
        loadTicket();
      } else {
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: err.message });
    }
  }

  // Cancel
  async function handleCancelSubmit() {
    try {
      const res = await fetch(`${API_URL}/engine/ticket/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("tokek")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticket_id: ticket.ticket_id,
          user_id: user.user_id,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        toast({ title: "Cancelled", description: "Ticket cancelled." });
        navigate(-1);
      } else {
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: err.message });
    }
  }

  // RESUBMIT flow
  async function handleResubmit() {
    try {
      const res = await fetch(`${API_URL}/engine/ticket/resubmit/${ticket.ticket_id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("tokek")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          form_data: revisionForm,
          user_id: user.user_id,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        toast({
          title: "Resubmitted",
          description: `Ticket submitted for revision (rev ${json.newRevision})`,
        });
        loadTicket();
      } else {
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: err.message });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return <div className="p-10 text-center">Ticket not found.</div>;
  }

  const isCreator = ticket.creator_id == user.user_id;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center space-x-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <h1 className="text-2xl font-bold">Ticket #{ticket.ticket_id}</h1>
        <Badge className="ml-2 capitalize">{ticket.status}</Badge>
      </div>

      {/* Revision Selector */}
      {revisions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Revisions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            {revisions.map((rev) => (
              <Button
                key={rev}
                variant={rev === selectedRevision ? "default" : "outline"}
                onClick={() => setSelectedRevision(rev)}
              >
                Rev {rev}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Ticket Details */}
      <Card>
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Creator</p>
            <p>{ticket.creator_email || "Unknown"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created At</p>
            <p>{new Date(ticket.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Service</p>
            <p>{ticket.service_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Title</p>
            <p>{ticket.title || "(no title)"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Approval Progress */}
      <TicketApprovalSection
        ticket={ticket}
        events={events}
        user={user}
        refresh={loadTicket}
        API_URL={API_URL}
      />

      {/* Action Buttons */}
      <div className="flex gap-3">
        {/* Cancel (only creator, only if still submitted) */}
        {isCreator && ticket.status === "submitted" && (
          <Button variant="destructive" onClick={() => setCancelOpen(true)}>
            <XCircle className="w-4 h-4 mr-2" /> Cancel Ticket
          </Button>
        )}

        {/* Return for revision */}
        {ticket.status === "in_approval" && (
          <Button variant="secondary" onClick={() => setReturnOpen(true)}>
            <Undo2 className="w-4 h-4 mr-2" /> Request Revision
          </Button>
        )}

        {/* RESUBMIT */}
        {ticket.status === "revision_requested" && (
          <Button onClick={handleResubmit} className="bg-blue-600 text-white">
            <RefreshCw className="w-4 h-4 mr-2" /> Resubmit Revision
          </Button>
        )}
      </div>

      {/* ==== RETURN DIALOG ==== */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
          </DialogHeader>

          <Textarea
            placeholder="Explain why revision is needed..."
            value={returnNote}
            onChange={(e) => setReturnNote(e.target.value)}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReturnSubmit}>
              Submit Revision Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==== CANCEL DIALOG ==== */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Ticket?</DialogTitle>
          </DialogHeader>

          <p>This action cannot be undone.</p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              No
            </Button>
            <Button variant="destructive" onClick={handleCancelSubmit}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
