import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TicketRevisionTimeline({ revisions = [], selected, onSelect }) {
  if (!revisions.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revision Timeline</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {revisions.map((rev, i) => (
          <div
            key={rev.revision}
            className={`flex items-center justify-between p-3 rounded border cursor-pointer ${
              selected === rev.revision ? "bg-primary text-white" : "bg-muted"
            }`}
            onClick={() => onSelect(rev.revision)}
          >
            <div>
              <p className="font-semibold">Revision {rev.revision}</p>
              <p className="text-xs opacity-70">{new Date(rev.created_at).toLocaleString()}</p>
            </div>
            <Badge>{rev.action || "Updated"}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
