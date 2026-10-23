/**
 * workflowGraphAdapter.ts
 * Converts between m_service_workflow.definition JSON and React Flow format.
 */

import { Node, Edge, MarkerType } from 'reactflow';

// Types matching m_service_workflow.definition format
export interface WorkflowStep {
    level: number;
    step_type: 'team' | 'role' | 'superior' | 'specific_user' | 'user_dynamic' | 'department';
    assigned_value?: string | number;
    resolver?: string;
    description?: string;
    approver?: string | number;
}

export interface WorkflowTask {
    task_order: number;
    task_type: string;
    task_name: string;
    assigned_value?: string | number;
}

export interface WorkflowDefinition {
    steps: WorkflowStep[];
    tasks?: WorkflowTask[];
}

// Node data types for React Flow
export interface StartNodeData {
    label: string;
}

export interface ApprovalNodeData extends WorkflowStep {
    label: string;
}

export interface TaskNodeData extends WorkflowTask {
    label: string;
}

export interface EndNodeData {
    label: string;
}

// Constants for layout
const NODE_WIDTH = 250;
const NODE_HEIGHT = 80;
const VERTICAL_SPACING = 120;
const START_Y = 50;

/**
 * Convert workflow definition JSON to React Flow nodes and edges
 */
export function workflowJsonToFlow(definition: WorkflowDefinition | null): { nodes: Node[]; edges: Edge[] } {
    if (!definition || !definition.steps) {
        return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Sort steps by level
    const sortedSteps = [...definition.steps].sort((a: any, b: any) => {
        const aLevel = a.level !== undefined ? a.level : (a.step !== undefined ? a.step : 0);
        const bLevel = b.level !== undefined ? b.level : (b.step !== undefined ? b.step : 0);
        return aLevel - bLevel;
    });
    const tasks = definition.tasks || [];

    // Calculate center X
    const centerX = 400;

    // 1. Start Node
    nodes.push({
        id: 'start',
        type: 'startNode',
        position: { x: centerX - NODE_WIDTH / 2, y: START_Y },
        data: { label: 'Ticket Submitted' },
        draggable: false,
    });

    // 2. Approval Step Nodes
    sortedSteps.forEach((step: any, index) => {
        const level = step.level !== undefined ? step.level : (step.step !== undefined ? step.step : index + 1);
        const nodeId = `approval-${level}`;
        const y = START_Y + VERTICAL_SPACING * (index + 1);

        // Handle legacy resolver object if present
        let parsedStepType = step.step_type;
        let parsedAssignedValue = step.assigned_value;
        if (!parsedStepType && step.resolver && typeof step.resolver === 'object') {
            parsedStepType = 'team'; // Default to team grouping for legacy
            if (step.resolver.team_id) {
                parsedAssignedValue = String(step.resolver.team_id);
            }
        }

        nodes.push({
            id: nodeId,
            type: 'approvalNode',
            position: { x: centerX - NODE_WIDTH / 2, y },
            data: {
                ...step,
                level: level,
                step_type: parsedStepType || 'team',
                assigned_value: parsedAssignedValue || '',
                label: step.description || step.role || step.label || `Level ${level} Approval`,
            },
        });

        // Edge from previous node
        const prevStep: any = sortedSteps[index - 1];
        const prevLevel = prevStep ? (prevStep.level !== undefined ? prevStep.level : (prevStep.step || index)) : 0;
        const sourceId = index === 0 ? 'start' : `approval-${prevLevel}`;
        edges.push({
            id: `e-${sourceId}-${nodeId}`,
            source: sourceId,
            target: nodeId,
            sourceHandle: 'approved',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#22c55e' },
        });
    });

    // 3. Task Nodes (after approvals)
    const lastApprovalY = START_Y + VERTICAL_SPACING * (sortedSteps.length);

    tasks.forEach((task, index) => {
        const nodeId = `task-${task.task_order}`;
        const y = lastApprovalY + VERTICAL_SPACING * (index + 1);

        nodes.push({
            id: nodeId,
            type: 'taskNode',
            position: { x: centerX - NODE_WIDTH / 2, y },
            data: {
                ...task,
                label: task.task_name || `Task ${task.task_order}`,
            },
        });

        // Edge from previous node
        const lastStep: any = sortedSteps.length > 0 ? sortedSteps[sortedSteps.length - 1] : null;
        const lastLevel = lastStep ? (lastStep.level !== undefined ? lastStep.level : (lastStep.step || sortedSteps.length)) : 0;

        const sourceId = index === 0
            ? (sortedSteps.length > 0 ? `approval-${lastLevel}` : 'start')
            : `task-${tasks[index - 1].task_order}`;

        edges.push({
            id: `e-${sourceId}-${nodeId}`,
            source: sourceId,
            target: nodeId,
            sourceHandle: index === 0 ? 'approved' : undefined,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#3b82f6' },
        });
    });

    // 4. End Node
    const lastNodeY = tasks.length > 0
        ? lastApprovalY + VERTICAL_SPACING * tasks.length
        : lastApprovalY;

    nodes.push({
        id: 'end',
        type: 'endNode',
        position: { x: centerX - NODE_WIDTH / 2, y: lastNodeY + VERTICAL_SPACING },
        data: { label: 'Workflow Complete' },
        draggable: false,
    });

    // Edge to end node
    let lastNodeId = 'start';
    if (tasks.length > 0) {
        lastNodeId = `task-${tasks[tasks.length - 1].task_order}`;
    } else if (sortedSteps.length > 0) {
        const lastStep: any = sortedSteps[sortedSteps.length - 1];
        const lastLevel = lastStep.level !== undefined ? lastStep.level : (lastStep.step || sortedSteps.length);
        lastNodeId = `approval-${lastLevel}`;
    }

    edges.push({
        id: `e-${lastNodeId}-end`,
        source: lastNodeId,
        target: 'end',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#22c55e' },
    });

    return { nodes, edges };
}

/**
 * Convert React Flow nodes and edges back to workflow definition JSON
 */
export function flowToWorkflowJson(nodes: Node[], edges: Edge[]): WorkflowDefinition {
    const steps: WorkflowStep[] = [];
    const tasks: WorkflowTask[] = [];

    // Extract approval nodes (sorted by Y position to determine level)
    const approvalNodes = nodes
        .filter(n => n.type === 'approvalNode')
        .sort((a, b) => a.position.y - b.position.y);

    approvalNodes.forEach((node, index) => {
        const data = node.data as ApprovalNodeData;
        steps.push({
            level: index + 1,
            step_type: data.step_type || 'team',
            assigned_value: data.assigned_value,
            resolver: data.resolver,
            description: data.description || data.label,
        });
    });

    // Extract task nodes (sorted by Y position)
    const taskNodes = nodes
        .filter(n => n.type === 'taskNode')
        .sort((a, b) => a.position.y - b.position.y);

    taskNodes.forEach((node, index) => {
        const data = node.data as TaskNodeData;
        tasks.push({
            task_order: index + 1,
            task_type: data.task_type || 'manual',
            task_name: data.task_name || data.label,
            assigned_value: data.assigned_value,
        });
    });

    return { steps, tasks };
}

/**
 * Create a new approval step node
 */
export function createApprovalNode(level: number, position: { x: number; y: number }): Node {
    return {
        id: `approval-${level}-${Date.now()}`,
        type: 'approvalNode',
        position,
        data: {
            level,
            step_type: 'team',
            assigned_value: '',
            description: `New Approval Step`,
            label: `New Approval Step`,
        },
    };
}

/**
 * Create a new task node
 */
export function createTaskNode(order: number, position: { x: number; y: number }): Node {
    return {
        id: `task-${order}-${Date.now()}`,
        type: 'taskNode',
        position,
        data: {
            task_order: order,
            task_type: 'manual',
            task_name: 'New Task',
            label: 'New Task',
        },
    };
}
