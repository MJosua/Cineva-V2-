import { Button } from "@/components/ui/button";
import { Edit, Trash2, SlidersHorizontal } from "lucide-react";

/**
 * Props:
 *  - levels: array of workflow rows (from backend)
 *  - onEdit(row)
 *  - onDelete(workflow_id)
 *  - onParams(row)  <-- open params modal (row contains workflow_id, level, resolver, approver_user, params)
 */

export default function WorkflowTable({ levels = [], onEdit, onDelete, onParams }) {
  return (
    <table className="w-full border-collapse mt-4 text-sm">
      <thead>
        <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
          <th className="p-2 text-left">Order</th>
          <th className="p-2 text-left">Approver Rule</th>
          <th className="p-2 text-left">Who Approves</th>
          <th className="p-2 text-left">Options</th>
          <th className="p-2 text-center">Actions</th>
        </tr>
      </thead>

      <tbody>
        {levels.map((l) => {
          // friendly "who approves" label
          let who = "(auto)";

          if (l.approver_user) {
            who = `User ${l.approver_user}`;
          } else if (l.resolver === "direct superior") {
            who = "Requestor's Supervisor";
          } else if (l.resolver === "team leader") {
            who = `Team Leader${l.params?.team_id ? ` (team ${l.params.team_id})` : ""}`;
          } else if (l.resolver === "direct user" && l.params?.user_id) {
            who = `User ${l.params.user_id}`;
          } else if (l.resolver === "role") {
            who = `Role ${l.params?.role_id ?? "(role)"}${l.params?.pick ? ` / ${l.params.pick}` : ""}`;
          } else if (l.resolver === "department head") {
            who = `Department Head${l.params?.department_id ? ` (dept ${l.params.department_id})` : ""}`;
          } else if (l.resolver === "team") {
            who = `Team members${l.params?.team_id ? ` (team ${l.params.team_id})` : ""}`;
          } else {
            who = l.resolver;
          }

          return (
            <tr
              key={l.workflow_id || `${l.level}-${String(l.resolver)}`}
              className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <td className="p-2">{l.level}</td>
              <td className="p-2 capitalize">{l.resolver}</td>
              <td className="p-2">{who}</td>
              <td className="p-2">
                {/* human readable params summary */}
                {l.params && Object.keys(l.params).length > 0 ? (
                  <div className="text-sm text-gray-600">
                    {Object.entries(l.params).map(([k, v]) => (
                      <div key={k}>{k}: {String(v)}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">No options</div>
                )}
              </td>

              <td className="p-2 flex gap-2 justify-center">
                <Button size="sm" variant="outline" onClick={() => onEdit && onEdit(l)}>
                  <Edit className="w-4 h-4" />
                </Button>

                <Button size="sm" variant="secondary" onClick={() => onParams && onParams(l)}>
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>

                <Button size="sm" variant="destructive" onClick={() => onDelete && onDelete(l.workflow_id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
