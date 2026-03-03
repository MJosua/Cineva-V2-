import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TicketHistory({ history }) {
  if (!history || !history.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {history.map((h, i) => (
          <div key={i} className="p-3 border rounded">
            <p className="font-semibold">{h.action}</p>
            <p className="text-xs opacity-70">{new Date(h.created_at).toLocaleString()}</p>
            <p className="text-sm mt-2">{h.actor_name || h.actor_id}</p>

            {h.meta_json && (
              <pre className="text-xs bg-muted p-2 rounded mt-2">
                {JSON.stringify(h.meta_json, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
