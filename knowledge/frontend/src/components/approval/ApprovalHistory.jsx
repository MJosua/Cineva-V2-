import { Badge } from "@/components/ui/badge";

export default function ApprovalHistory({ events }) {
  return (
    <div className="border p-4 rounded-md bg-white shadow-sm">
      <h2 className="font-semibold mb-3">Approval History</h2>

      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className="border p-3 rounded-md bg-neutral-50">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">
                  Step {e.level} — {e.resolver}
                </div>
                <div className="text-sm text-gray-600">
                  {e.approver_name || "Auto"}
                </div>
              </div>

              <Badge
                className={
                  e.status === "approved"
                    ? "bg-green-100 text-green-700"
                    : e.status === "rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }
              >
                {e.status}
              </Badge>
            </div>

            {e.comment && (
              <div className="mt-2 text-gray-700 text-sm">{e.comment}</div>
            )}

            <div className="text-xs text-gray-500 mt-1">{e.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
