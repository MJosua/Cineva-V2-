import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    ReactFlowProvider,
    ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import StartNode from './nodes/StartNode';
import ApprovalNode from './nodes/ApprovalNode';
import TaskNode from './nodes/TaskNode';
import EndNode from './nodes/EndNode';
import WorkflowNodePalette from './WorkflowNodePalette';
import WorkflowNodeInspector from './WorkflowNodeInspector';

import {
    WorkflowDefinition,
    workflowJsonToFlow,
    flowToWorkflowJson,
    createApprovalNode,
    createTaskNode,
} from '@/utils/workflowGraphAdapter';

// Register custom node types
const nodeTypes = {
    startNode: StartNode,
    approvalNode: ApprovalNode,
    taskNode: TaskNode,
    endNode: EndNode,
};

interface VisualWorkflowEditorProps {
    workflowDefinition: WorkflowDefinition | null;
    onChange: (definition: WorkflowDefinition) => void;
}

export const VisualWorkflowEditor: React.FC<VisualWorkflowEditorProps> = ({
    workflowDefinition,
    onChange,
}) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // Load workflow definition into React Flow
    useEffect(() => {
        const { nodes: flowNodes, edges: flowEdges } = workflowJsonToFlow(workflowDefinition);
        setNodes(flowNodes);
        setEdges(flowEdges);
    }, [workflowDefinition, setNodes, setEdges]);

    // Sync changes back to parent
    const syncToParent = useCallback(() => {
        const definition = flowToWorkflowJson(nodes, edges);
        onChange(definition);
    }, [nodes, edges, onChange]);

    // Handle new connections
    const onConnect = useCallback(
        (connection: Connection) => {
            setEdges((eds) => addEdge({
                ...connection,
                animated: true,
                style: { stroke: '#22c55e' },
            }, eds));
        },
        [setEdges]
    );

    // Handle node selection
    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    // Handle canvas click (deselect)
    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    // Handle drag from palette
    const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    // Handle drop onto canvas
    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type || !reactFlowInstance || !reactFlowWrapper.current) return;

            const bounds = reactFlowWrapper.current.getBoundingClientRect();
            const position = reactFlowInstance.project({
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            });

            let newNode: Node;
            if (type === 'approvalNode') {
                const maxLevel = nodes
                    .filter(n => n.type === 'approvalNode')
                    .reduce((max, n) => Math.max(max, n.data.level || 0), 0);
                newNode = createApprovalNode(maxLevel + 1, position);
            } else if (type === 'taskNode') {
                const maxOrder = nodes
                    .filter(n => n.type === 'taskNode')
                    .reduce((max, n) => Math.max(max, n.data.task_order || 0), 0);
                newNode = createTaskNode(maxOrder + 1, position);
            } else {
                return;
            }

            setNodes((nds) => nds.concat(newNode));
            setSelectedNode(newNode);
        },
        [reactFlowInstance, nodes, setNodes]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    // Update node data from inspector
    const handleNodeUpdate = useCallback((nodeId: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, ...newData, label: newData.description || newData.task_name || node.data.label } }
                    : node
            )
        );
        // Update selected node reference
        setSelectedNode((prev) =>
            prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...newData } } : prev
        );
    }, [setNodes]);

    // Delete node
    const handleNodeDelete = useCallback((nodeId: string) => {
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
        setSelectedNode(null);
    }, [setNodes, setEdges]);

    return (
        <div className="flex h-full">
            {/* Left: Palette */}
            <WorkflowNodePalette onDragStart={onDragStart} />

            {/* Center: Canvas */}
            <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
                <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur text-xs px-3 py-2 rounded-md shadow-sm border border-slate-200 text-slate-600 pointer-events-none">
                    <p><strong>Tip:</strong> Select a line (edge) or node and press <kbd className="bg-slate-100 border border-slate-300 rounded px-1 font-mono">Delete</kbd> or <kbd className="bg-slate-100 border border-slate-300 rounded px-1 font-mono">Backspace</kbd> to remove it.</p>
                </div>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    deleteKeyCode={['Delete', 'Backspace']}
                    fitView
                    snapToGrid
                    snapGrid={[15, 15]}
                    className="bg-gray-50"
                >
                    <Controls />
                    <MiniMap
                        nodeColor={(node) => {
                            switch (node.type) {
                                case 'startNode': return '#22c55e';
                                case 'approvalNode': return '#3b82f6';
                                case 'taskNode': return '#f97316';
                                case 'endNode': return '#6b7280';
                                default: return '#e5e7eb';
                            }
                        }}
                    />
                    <Background color="#d1d5db" gap={16} />
                </ReactFlow>
            </div>

            {/* Right: Inspector */}
            <WorkflowNodeInspector
                selectedNode={selectedNode}
                onUpdate={handleNodeUpdate}
                onDelete={handleNodeDelete}
            />
        </div>
    );
};

// Wrap with provider for standalone use
export const VisualWorkflowEditorWithProvider: React.FC<VisualWorkflowEditorProps> = (props) => (
    <ReactFlowProvider>
        <VisualWorkflowEditor {...props} />
    </ReactFlowProvider>
);

export default VisualWorkflowEditorWithProvider;
