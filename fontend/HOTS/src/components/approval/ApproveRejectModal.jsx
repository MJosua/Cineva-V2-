import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
  } from "@/components/ui/dialog";
  
  import { Button } from "@/components/ui/button";
  import { Textarea } from "@/components/ui/textarea";
  import { useState } from "react";
  import { API_URL } from "@/config/sourceConfig";
  import { toast } from "@/components/ui/use-toast";
  
  export default function ApproveRejectModal({ action, onClose, ticket_id, onDone }) {
    const [comment, setComment] = useState("");
  
    if (!action) return null;
    const token = localStorage.getItem("tokek");
  
    const submit = async () => {
      try {
        const url =
          action === "approve"
            ? `${API_URL}/engine/approve`
            : `${API_URL}/engine/reject`;
  
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ticket_id,
            comment
          })
        });
  
        const json = await res.json();
  
        if (!json.ok) {
          toast({ title: "Error", description: json.message });
          return;
        }
  
        toast({
          title: action === "approve" ? "Approved" : "Rejected",
          description: "Action completed successfully."
        });
  
        onClose();
        setComment("");
        onDone();
  
      } catch (err) {
        toast({ title: "Error", description: err.message });
      }
    };
  
    return (
      <Dialog open={!!action} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve Ticket" : "Reject Ticket"}
            </DialogTitle>
          </DialogHeader>
  
          <div>
            <Textarea
              placeholder="Optional comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
  
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className={action === "approve" ? "bg-green-600" : "bg-red-600"}
              onClick={submit}
            >
              {action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  