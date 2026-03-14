import {useCallback, useMemo, useState} from 'react';
import {motion} from 'framer-motion';
import DocsLayout from '../components/DocsLayout';
import ReactFlow, {Background, Controls, ReactFlowProvider, useEdgesState, useNodesState} from 'reactflow';
import 'reactflow/dist/style.css';

const STEP_DELAY_MS = 280;

const NODE_META = {
    input: {label: 'User Input', tooltip: 'Collects email or phone identifier from the user.'},
    api: {label: 'Identifier Status API', tooltip: 'Sends the identifier to backend and fetches account metadata.'},
    existsDecision: {label: 'User Exists Decision', tooltip: 'Branch point that decides whether account already exists.'},
    signup: {label: 'Signup Path', tooltip: 'Route for first-time users to create a new account.'},
    status: {label: 'User Status Check', tooltip: 'Evaluates account state for existing users.'},
    verifiedDecision: {label: 'Email Verified Decision', tooltip: 'Checks whether existing user has verified email.'},
    login: {label: 'Login Path', tooltip: 'Direct existing verified users to password login.'},
    verify: {label: 'Email Verification Path', tooltip: 'Route existing unverified users through verification.'},
};

const baseNodes = [
    {id: 'input', position: {x: 80, y: 120}, data: NODE_META.input, type: 'workflowNode'},
    {id: 'api', position: {x: 350, y: 120}, data: NODE_META.api, type: 'workflowNode'},
    {id: 'existsDecision', position: {x: 620, y: 120}, data: NODE_META.existsDecision, type: 'workflowNode'},
    {id: 'signup', position: {x: 880, y: 30}, data: NODE_META.signup, type: 'workflowNode'},
    {id: 'status', position: {x: 880, y: 210}, data: NODE_META.status, type: 'workflowNode'},
    {id: 'verifiedDecision', position: {x: 1140, y: 210}, data: NODE_META.verifiedDecision, type: 'workflowNode'},
    {id: 'login', position: {x: 1400, y: 130}, data: NODE_META.login, type: 'workflowNode'},
    {id: 'verify', position: {x: 1400, y: 290}, data: NODE_META.verify, type: 'workflowNode'},
];

const baseEdges = [
    {id: 'e-input-api', source: 'input', target: 'api', label: 'submit identifier'},
    {id: 'e-api-exists', source: 'api', target: 'existsDecision', label: 'response received'},
    {id: 'e-exists-signup', source: 'existsDecision', target: 'signup', label: 'No'},
    {id: 'e-exists-status', source: 'existsDecision', target: 'status', label: 'Yes'},
    {id: 'e-status-verified', source: 'status', target: 'verifiedDecision', label: 'ACTIVE/CREATED'},
    {id: 'e-verified-login', source: 'verifiedDecision', target: 'login', label: 'Yes'},
    {id: 'e-verified-email', source: 'verifiedDecision', target: 'verify', label: 'No'},
];

const scenarios = {
    new: {
        response: {
            exists: false,
            app_user_status: 'NOT_EXISTS',
            email_verified: false,
            next_action: 'SIGNUP',
        },
        path: {
            nodes: ['input', 'api', 'existsDecision', 'signup'],
            edges: ['e-input-api', 'e-api-exists', 'e-exists-signup'],
        },
    },
    verified: {
        response: {
            exists: true,
            app_user_status: 'ACTIVE',
            email_verified: true,
            next_action: 'LOGIN',
        },
        path: {
            nodes: ['input', 'api', 'existsDecision', 'status', 'verifiedDecision', 'login'],
            edges: ['e-input-api', 'e-api-exists', 'e-exists-status', 'e-status-verified', 'e-verified-login'],
        },
    },
    unverified: {
        response: {
            exists: true,
            app_user_status: 'ACTIVE',
            email_verified: false,
            next_action: 'EMAIL_VERIFICATION',
        },
        path: {
            nodes: ['input', 'api', 'existsDecision', 'status', 'verifiedDecision', 'verify'],
            edges: ['e-input-api', 'e-api-exists', 'e-exists-status', 'e-status-verified', 'e-verified-email'],
        },
    },
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const inferScenario = (identifier) => {
    const value = identifier.trim().toLowerCase();
    if (value.includes('new')) return 'new';
    if (value.includes('unverified')) return 'unverified';
    if (value.includes('verify')) return 'verified';
    if (value.startsWith('+1555000')) return 'new';
    if (value.startsWith('+1555999')) return 'unverified';
    return 'verified';
};

const MotionNode = motion.div;

const WorkflowNode = ({data}) => (
    <MotionNode
        animate={{
            boxShadow: data.active ? '0 0 0 1px rgba(56, 189, 248, 0.7), 0 0 24px rgba(56, 189, 248, 0.55)' : '0 0 0 1px rgba(100, 116, 139, 0.45)',
            scale: data.active ? 1.02 : 1,
        }}
        transition={{duration: 0.28}}
        className="group relative w-52 rounded-xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-left"
    >
        <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300/75">Node</p>
        <p className="mt-1 text-sm font-semibold text-slate-100">{data.label}</p>
        <div className="pointer-events-none absolute -top-12 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-slate-200 shadow-xl group-hover:block">
            {data.tooltip}
        </div>
    </MotionNode>
);

const nodeTypes = {workflowNode: WorkflowNode};

const IdentifierFlowVisualizerContent = () => {
    const [identifier, setIdentifier] = useState('');
    const [isAnimating, setAnimating] = useState(false);
    const [activeNodeId, setActiveNodeId] = useState('');
    const [activeEdgeId, setActiveEdgeId] = useState('');
    const [scenarioName, setScenarioName] = useState('verified');

    const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(baseEdges);

    const simulatedRequest = useMemo(
        () => ({
            identifier: identifier || '<enter-email-or-phone>',
            identifier_type: identifier.includes('@') ? 'EMAIL' : 'PHONE',
        }),
        [identifier],
    );

    const simulatedResponse = useMemo(() => scenarios[scenarioName].response, [scenarioName]);

    const repaintGraph = useCallback(
        (nodeId, edgeId) => {
            setNodes((prev) => prev.map((node) => ({...node, data: {...node.data, active: node.id === nodeId}})));
            setEdges((prev) =>
                prev.map((edge) => ({
                    ...edge,
                    animated: edge.id === edgeId,
                    className: edge.id === edgeId ? 'edge-active' : 'edge-default',
                    style: {
                        stroke: edge.id === edgeId ? '#38bdf8' : '#475569',
                        strokeWidth: edge.id === edgeId ? 2.8 : 1.3,
                    },
                    labelStyle: {fill: edge.id === edgeId ? '#e2e8f0' : '#94a3b8', fontSize: 11},
                })),
            );
        },
        [setEdges, setNodes],
    );

    const resetGraph = useCallback(() => {
        setActiveNodeId('');
        setActiveEdgeId('');
        repaintGraph('', '');
    }, [repaintGraph]);

    const runAnimation = useCallback(async () => {
        const trimmed = identifier.trim();
        if (!trimmed || isAnimating) return;

        setAnimating(true);
        resetGraph();
        const pickedScenario = inferScenario(trimmed);
        setScenarioName(pickedScenario);

        const {nodes: pathNodes, edges: pathEdges} = scenarios[pickedScenario].path;

        for (let i = 0; i < pathNodes.length; i += 1) {
            const nodeId = pathNodes[i];
            const edgeId = pathEdges[i - 1] ?? '';
            setActiveNodeId(nodeId);
            setActiveEdgeId(edgeId);
            repaintGraph(nodeId, edgeId);
            await wait(STEP_DELAY_MS);
        }

        setAnimating(false);
    }, [identifier, isAnimating, repaintGraph, resetGraph]);

    return (
        <div className="space-y-5">
            <style>{`
                .react-flow__edge.edge-active path {
                    stroke-dasharray: 12;
                    animation: flow-dash 0.35s linear infinite;
                }
                .react-flow__edge.edge-default path {
                    stroke-dasharray: none;
                }
                @keyframes flow-dash {
                    from { stroke-dashoffset: 24; }
                    to { stroke-dashoffset: 0; }
                }
            `}</style>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
                <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                        <input
                            value={identifier}
                            onChange={(event) => setIdentifier(event.target.value)}
                            placeholder="Enter email or phone (+1555...)"
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                        />
                        <button
                            type="button"
                            onClick={runAnimation}
                            disabled={isAnimating || !identifier.trim()}
                            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {isAnimating ? 'Checking…' : 'Check Identifier'}
                        </button>
                    </div>

                    <div className="h-[520px] w-full overflow-hidden rounded-xl border border-slate-800/90">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            nodeTypes={nodeTypes}
                            nodesDraggable={false}
                            nodesConnectable={false}
                            elementsSelectable={false}
                            panOnDrag
                            fitView
                            fitViewOptions={{padding: 0.1, minZoom: 0.45}}
                            minZoom={0.4}
                            maxZoom={1.2}
                            proOptions={{hideAttribution: true}}
                        >
                            <Background color="#1e293b" gap={24} size={1} />
                            <Controls showInteractive={false} className="!bg-slate-900/80" />
                        </ReactFlow>
                    </div>
                </div>

                <aside className="space-y-4 rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-cyan-300/80">API Request</p>
                        <pre className="mt-2 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200">{JSON.stringify(simulatedRequest, null, 2)}</pre>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-cyan-300/80">Simulated Response</p>
                        <pre className="mt-2 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200">{JSON.stringify(simulatedResponse, null, 2)}</pre>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
                        <p className="font-semibold text-slate-200">Scenario hints</p>
                        <p className="mt-2">Use <code className="text-cyan-300">new@</code> for signup path, <code className="text-cyan-300">unverified@</code> for email verification path, and any other identifier for login path.</p>
                    </div>
                    <p className="text-xs text-slate-500">Active Node: <span className="text-slate-300">{activeNodeId || '-'}</span> · Active Edge: <span className="text-slate-300">{activeEdgeId || '-'}</span></p>
                </aside>
            </div>
        </div>
    );
};

const IdentifierFlowVisualizerPage = () => (
    <DocsLayout
        title="Identifier Status Check Visualizer"
        subtitle="Interactive node-based flow for identifier lookup, branching logic, and next-step routing in authentication."
    >
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <ReactFlowProvider>
                <IdentifierFlowVisualizerContent />
            </ReactFlowProvider>
        </section>
    </DocsLayout>
);

export default IdentifierFlowVisualizerPage;
