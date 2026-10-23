import React, { useEffect, useState } from 'react';
import { Node } from 'reactflow';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2, Settings } from 'lucide-react';
import { API_URL } from '@/config/sourceConfig';

interface WorkflowNodeInspectorProps {
    selectedNode: Node | null;
    onUpdate: (nodeId: string, data: any) => void;
    onDelete: (nodeId: string) => void;
}

interface Team { team_id: number; team_name: string; }
interface Role { role_id: number; role_name: string; }
interface User { user_id: number; fullname: string; firstname: string; lastname: string; }
interface Department { department_id: number; department_name: string; }

const stepTypes = [
    { value: 'team', label: 'Team' },
    { value: 'role', label: 'Role' },
    { value: 'superior', label: 'Legacy Superior' },
    { value: 'specific_user', label: 'Specific User' },
    { value: 'department', label: 'Department Head' },
    { value: 'user_dynamic', label: 'Dynamic / Superior' },
];

const taskTypes = [
    { value: 'manual', label: 'Manual Task' },
    { value: 'document', label: 'Document Generation' },
    { value: 'notification', label: 'Send Notification' },
];

export const WorkflowNodeInspector: React.FC<WorkflowNodeInspectorProps> = ({
    selectedNode,
    onUpdate,
    onDelete,
}) => {
    // ... existing hooks ...
    const [teams, setTeams] = useState<Team[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

    // ... existing useEffect ... (no change needed here as I already fixed the API calls)
    useEffect(() => {
        const fetchLookups = async () => {
            // ... existing fetch logic ...
            try {
                const [teamsRes, rolesRes, usersRes, deptsRes] = await Promise.all([
                    fetch(`${API_URL}/hots_settings/get/team`, { headers: { Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` } }).then(r => r.json()).catch(() => ({ data: [] })),
                    fetch(`${API_URL}/hots_settings/get/role`, { headers: { Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` } }).then(r => r.json()).catch(() => ({ data: [] })),
                    fetch(`${API_URL}/hots_settings/get/user`, { headers: { Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` } }).then(r => r.json()).catch(() => ({ data: [] })),
                    fetch(`${API_URL}/hots_settings/get/departments`, { headers: { Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` } }).then(r => r.json()).catch(() => ({ data: [] })),
                ]);
                setTeams(teamsRes.data || []);
                setRoles(rolesRes.data || []);
                setUsers(usersRes.data || []);
                setDepartments(deptsRes.data || []);
            } catch (e) {
                console.error('Failed to load lookups:', e);
            }
        };
        fetchLookups();
    }, []);


    if (!selectedNode) {
        // ... existing return ...
        return (
            <div className="w-80 bg-white border-l h-full p-8 flex flex-col items-center justify-center text-center text-gray-500">
                <Settings className="w-8 h-8 mb-3 text-gray-300" />
                <p className="text-sm">Select a node to edit its properties.</p>
            </div>
        );
    }

    const { type, data, id } = selectedNode;

    const handleChange = (key: string, value: any) => {
        onUpdate(id, { ...data, [key]: value });
    };

    // Approval Node Inspector
    if (type === 'approvalNode') {
        return (
            <div className="w-80 bg-white border-l h-full flex flex-col">
                <div className="p-4 border-b bg-blue-50 flex items-center justify-between">
                    <h2 className="font-semibold text-sm text-blue-900">Approval Step</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => onDelete(id)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Description</Label>
                        <Input
                            value={data.description || data.label || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="e.g. Manager Approval"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Approver Type</Label>
                        <Select
                            value={data.step_type || 'team'}
                            onValueChange={(val) => {
                                handleChange('step_type', val);
                                handleChange('assigned_value', ''); // Reset when type changes
                                if (val === 'user_dynamic') {
                                    handleChange('resolver', 'superior'); // Default resolver
                                } else {
                                    handleChange('resolver', undefined);
                                }
                            }}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {stepTypes.map(st => (
                                    <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Dynamic selector based on step_type */}
                    {data.step_type === 'team' && (
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Select Team</Label>
                            <Select
                                value={String(data.assigned_value || '')}
                                onValueChange={(val) => handleChange('assigned_value', val)}
                            >
                                <SelectTrigger><SelectValue placeholder="Choose team..." /></SelectTrigger>
                                <SelectContent>
                                    {teams.map(t => (
                                        <SelectItem key={t.team_id} value={String(t.team_id)}>{t.team_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {data.step_type === 'role' && (
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Select Role</Label>
                            <Select
                                value={String(data.assigned_value || '')}
                                onValueChange={(val) => handleChange('assigned_value', val)}
                            >
                                <SelectTrigger><SelectValue placeholder="Choose role..." /></SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => (
                                        <SelectItem key={r.role_id} value={String(r.role_id)}>{r.role_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {data.step_type === 'specific_user' && (
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Select User</Label>
                            <Select
                                value={String(data.assigned_value || '')}
                                onValueChange={(val) => handleChange('assigned_value', val)}
                            >
                                <SelectTrigger><SelectValue placeholder="Choose user..." /></SelectTrigger>
                                <SelectContent>
                                    {users.map(u => (
                                        <SelectItem key={u.user_id} value={String(u.user_id)}>
                                            {u.fullname || `${u.firstname} ${u.lastname}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {data.step_type === 'department' && (
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Select Department</Label>
                            <Select
                                value={String(data.assigned_value || '')}
                                onValueChange={(val) => handleChange('assigned_value', val)}
                            >
                                <SelectTrigger><SelectValue placeholder="Choose department..." /></SelectTrigger>
                                <SelectContent>
                                    {departments.map(d => (
                                        <SelectItem key={d.department_id} value={String(d.department_id)}>{d.department_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {data.step_type === 'user_dynamic' && (
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Resolver Logic</Label>
                            <Select
                                value={data.resolver || 'superior'}
                                onValueChange={(val) => handleChange('resolver', val)}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="superior">Direct Superior</SelectItem>
                                    {/* Future dynamic resolvers can be added here */}
                                </SelectContent>
                            </Select>
                            <div className="p-2 bg-gray-50 rounded text-xs text-gray-600 mt-1">
                                Routes dynamically based on the requester (e.g. to their superior).
                            </div>
                        </div>
                    )}

                    {data.step_type === 'superior' && (
                        <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                            ⚠️ Legacy Type. Please switch to "Dynamic / Superior".
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Task Node Inspector
    if (type === 'taskNode') {
        return (
            <div className="w-80 bg-white border-l h-full flex flex-col">
                <div className="p-4 border-b bg-orange-50 flex items-center justify-between">
                    <h2 className="font-semibold text-sm text-orange-900">Task</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => onDelete(id)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Task Name</Label>
                        <Input
                            value={data.task_name || ''}
                            onChange={(e) => handleChange('task_name', e.target.value)}
                            placeholder="e.g. Prepare Equipment"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Task Type</Label>
                        <Select
                            value={data.task_type || 'manual'}
                            onValueChange={(val) => handleChange('task_type', val)}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {taskTypes.map(tt => (
                                    <SelectItem key={tt.value} value={tt.value}>{tt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Assigned Team</Label>
                        <Select
                            value={String(data.assigned_value || '')}
                            onValueChange={(val) => handleChange('assigned_value', val)}
                        >
                            <SelectTrigger><SelectValue placeholder="Choose team..." /></SelectTrigger>
                            <SelectContent>
                                {teams.map(t => (
                                    <SelectItem key={t.team_id} value={String(t.team_id)}>{t.team_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        );
    }

    // Default: Start/End nodes are not editable
    return (
        <div className="w-80 bg-white border-l h-full p-8 flex flex-col items-center justify-center text-center text-gray-500">
            <p className="text-sm">This node cannot be edited.</p>
        </div>
    );
};

export default WorkflowNodeInspector;
