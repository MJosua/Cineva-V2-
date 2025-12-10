import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useState, useEffect } from "react";
import { API_URL } from "@/config/sourceConfig";
import { toast } from "@/components/ui/use-toast";

const RULES = [
  { key: "direct superior", label: "Direct Supervisor" },
  { key: "team leader", label: "Team Leader" },
  { key: "team", label: "Team (all)" },
  { key: "direct user", label: "Specific Person" },
  { key: "department head", label: "Department Head" },
  { key: "role", label: "Role-based Approver" },
  { key: "finance", label: "Finance Approval" },
  { key: "branch manager", label: "Branch Manager" },
  { key: "director", label: "Director" },
  { key: "custom sql", label: "Custom (Advanced)" }
];

export default function WorkflowFormModal({ isOpen, onClose, onSubmit, initial }) {
  const [form, setForm] = useState({
    level: "",
    resolver: "",
    approver_user: "none",    // default safe value
    params: {}
  });

  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  /* ============================================================
     LOAD LOOKUPS
  ============================================================ */
  useEffect(() => {
    fetchLists();
  }, []);

  async function fetchLists() {
    try {
      const [u, t, d, r] = await Promise.all([
        fetch(`${API_URL}/admin/users`).then(r => r.json()).catch(() => ({ rows: [] })),
        fetch(`${API_URL}/admin/teams`).then(r => r.json()).catch(() => ({ rows: [] })),
        fetch(`${API_URL}/admin/departments`).then(r => r.json()).catch(() => ({ rows: [] })),
        fetch(`${API_URL}/admin/roles`).then(r => r.json()).catch(() => ({ rows: [] }))
      ]);

      setUsers(u.rows || u.users || u.data || []);
      setTeams(t.rows || t.teams || t.data || []);
      setDepartments(d.rows || d.departments || d.data || []);
      setRoles(r.rows || r.roles || r.data || []);
    } catch (err) {
      console.warn("Failed loading lists");
    }
  }

  /* ============================================================
     LOAD INITIAL STATE / EDIT MODE
  ============================================================ */
  useEffect(() => {
    if (initial) {
      setForm({
        level: initial.level ?? "",
        resolver: initial.resolver ?? "",
        approver_user: initial.approver_user ? String(initial.approver_user) : "none",
        params: initial.params || {}
      });
    } else {
      setForm({ level: "", resolver: "", approver_user: "none", params: {} });
    }
  }, [initial, isOpen]);

  /* ============================================================
     HELPERS
  ============================================================ */
  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const updateParam = (k, v) =>
    setForm(f => ({ ...f, params: { ...f.params, [k]: v } }));

  /* ============================================================
     SAVE
  ============================================================ */
  const save = () => {
    if (!form.level || !form.resolver) {
      toast({ title: "Validation", description: "Please complete required fields." });
      return;
    }

    const payload = {
      level: Number(form.level),
      resolver: form.resolver,
      approver_user: form.approver_user === "none" ? null : form.approver_user,
      params: form.params
    };

    onSubmit(payload);
  };

  const resolver = form.resolver;

  /* ============================================================
     UI
  ============================================================ */
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Approval Step" : "Add Approval Step"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">

          {/* Level */}
          <Input
            type="number"
            placeholder="Approval Order"
            value={form.level}
            onChange={e => update("level", e.target.value)}
          />

          {/* Rule Selector */}
          <Select
            value={form.resolver || RULES[0].key}
            onValueChange={v => {
              update("resolver", v);
              update("params", {});
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Approval Rule" />
            </SelectTrigger>
            <SelectContent>
              {RULES.map(r => (
                <SelectItem key={r.key} value={r.key}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Override User */}
          <div>
            <div className="text-sm text-gray-600 mb-1">Specific Approver (optional)</div>
            <Select
              value={form.approver_user}
              onValueChange={v => update("approver_user", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No override" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No override</SelectItem>
                {users.map(u => (
                  <SelectItem
                    key={u.user_id}
                    value={String(u.user_id)}
                  >
                    {u.fullname || u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rule-specific params */}
          {resolver === "team leader" && (
            <div>
              <div className="text-sm text-gray-600 mb-1">Team</div>
              <Select
                value={form.params.team_id || "-1"}
                onValueChange={v => updateParam("team_id", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">(Requester team)</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.team_id} value={String(t.team_id)}>
                      {t.team_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {resolver === "team" && (
            <div>
              <div className="text-sm text-gray-600 mb-1">Team</div>
              <Select
                value={form.params.team_id || "-1"}
                onValueChange={v => updateParam("team_id", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">(All in requester team)</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.team_id} value={String(t.team_id)}>
                      {t.team_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {resolver === "department head" && (
            <div>
              <div className="text-sm text-gray-600 mb-1">Department</div>
              <Select
                value={form.params.department_id || "-1"}
                onValueChange={v => updateParam("department_id", v)}
              >
                <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">(Requester department)</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d.department_id} value={String(d.department_id)}>
                      {d.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {resolver === "role" && (
            <div>
              <div className="text-sm text-gray-600 mb-1">Role</div>
              <Select
                value={form.params.role_id || roles[0]?.role_id || "-1"}
                onValueChange={v => updateParam("role_id", v)}
              >
                <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.role_id} value={String(r.role_id)}>
                      {r.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-2">
                <div className="text-sm text-gray-600 mb-1">Pick Method</div>
                <Select
                  value={form.params.pick || "first"}
                  onValueChange={v => updateParam("pick", v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first">First Available</SelectItem>
                    <SelectItem value="all">All (parallel)</SelectItem>
                    <SelectItem value="any">Any (who responds first)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {resolver === "direct user" && (
            <div>
              <div className="text-sm text-gray-600 mb-1">Select Person</div>
              <Select
                value={form.params.user_id || users[0]?.user_id || "-1"}
                onValueChange={v => updateParam("user_id", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.user_id} value={String(u.user_id)}>
                      {u.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

        </div>

        <DialogFooter>
          <Button onClick={save}>Save</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
