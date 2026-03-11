import {useMemo, useRef, useState} from 'react';
import DocsLayout from '../components/DocsLayout';

const ACCESS_TTL_SECONDS = 15 * 60;
const EVENT_GAP = 72;
const ACTORS = [
    {id: 'USER', label: 'User', x: 200},
    {id: 'BACKEND', label: 'Backend', x: 600},
    {id: 'ATTACKER', label: 'Attacker', x: 1000},
];

const actorX = (id) => ACTORS.find((a) => a.id === id)?.x ?? 0;
const fmt = (s) => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, '0')}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
const tokenId = () => `rt_${Math.random().toString(36).slice(2, 6)}`;

const stepInfo = {
    idle: ['Current Step: Waiting', 'Description: Start session to initialize tokens before simulating requests.'],
    session: ['Current Step: Session Started', 'Description: Access and refresh tokens are issued to the user.'],
    api: ['Current Step: API Request Validation', 'Description: Backend validates JWT, checks expiration, and returns response.'],
    expired: ['Current Step: Access Expired', 'Description: Backend rejects API request with 401 due to expired access token.'],
    refresh: ['Current Step: Refresh Rotation', 'Description: Backend validates refresh token, rotates tokens, returns new access token.'],
    theft: ['Current Step: Reuse Attack Defense', 'Description: Attacker uses stolen token; backend detects reuse and revokes session.'],
};

const initialRefresh = {id: 'rt_100a', version: 1, status: 'active', oldRef: '-'};

const SecurityDemoPage = () => {
    const [simKey, setSimKey] = useState('idle');
    const [running, setRunning] = useState(false);
    const [unlocked, setUnlocked] = useState(0);

    const [accessStatus, setAccessStatus] = useState('valid');
    const [accessTtl, setAccessTtl] = useState(ACCESS_TTL_SECONDS);
    const [accessIssuedAt, setAccessIssuedAt] = useState(new Date());
    const [sessionStatus, setSessionStatus] = useState('idle');
    const [refreshToken, setRefreshToken] = useState(initialRefresh);

    const [events, setEvents] = useState([]);
    const [activeEventId, setActiveEventId] = useState(null);
    const [logs, setLogs] = useState(['[boot] sequence simulator ready']);

    const eventIdRef = useRef(1);
    const runRef = useRef(0);

    const [title, description] = stepInfo[simKey] || stepInfo.idle;

    const addLog = (msg) => {
        const ts = new Date().toLocaleTimeString();
        setLogs((prev) => [...prev.slice(-35), `[${ts}] ${msg}`]);
    };

    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

    const appendEvent = async (event) => {
        const id = eventIdRef.current;
        eventIdRef.current += 1;
        setEvents((prev) => [...prev, {...event, id}]);
        setActiveEventId(id);
        await sleep(500); // 300ms draw + 200ms pause
        setActiveEventId(null);
    };

    const runSequence = async (entries, nextKey) => {
        if (running) return;
        const runId = Date.now();
        runRef.current = runId;
        setRunning(true);
        if (nextKey) setSimKey(nextKey);

        for (const entry of entries) {
            if (runRef.current !== runId) return;
            if (entry.action) entry.action();
            if (entry.event) await appendEvent(entry.event);
        }

        if (runRef.current === runId) {
            setRunning(false);
        }
    };

    const startSession = async () => {
        await runSequence([
            {action: () => {
                setSessionStatus('active');
                setAccessStatus('valid');
                setAccessTtl(ACCESS_TTL_SECONDS);
                setAccessIssuedAt(new Date());
                setRefreshToken(initialRefresh);
                addLog('[Auth] login successful');
                addLog('[Token] access token issued');
                addLog('[Token] refresh token issued');
            }},
            {event: {kind: 'message', from: 'USER', to: 'BACKEND', label: 'Login Request'}},
            {event: {kind: 'process', actor: 'BACKEND', label: 'Issue Access + Refresh Tokens'}},
            {event: {kind: 'message', from: 'BACKEND', to: 'USER', label: 'Session Started'}},
        ], 'session');
        setUnlocked(1);
    };

    const sendApiRequest = async () => {
        if (accessStatus === 'expired') {
            addLog('[Request] blocked: access token expired');
            return;
        }

        await runSequence([
            {event: {kind: 'message', from: 'USER', to: 'BACKEND', label: 'API Request (Access Token)'}},
            {event: {kind: 'process', actor: 'BACKEND', label: 'Validate JWT'}},
            {event: {kind: 'process', actor: 'BACKEND', label: 'Check Expiration'}},
            {event: {kind: 'process', actor: 'BACKEND', label: 'Generate Response'}},
            {event: {kind: 'message', from: 'BACKEND', to: 'USER', label: '200 OK'}},
            {action: () => addLog('[Request] response 200')},
        ], 'api');
        setUnlocked(2);
    };

    const expireToken = async () => {
        await runSequence([
            {action: () => {
                setAccessStatus('expired');
                setAccessTtl(0);
                addLog('[Security] access token expired');
            }},
            {event: {kind: 'message', from: 'USER', to: 'BACKEND', label: 'API Request (Expired Token)', color: 'red'}},
            {event: {kind: 'process', actor: 'BACKEND', label: 'Detect Expired JWT', color: 'red'}},
            {event: {kind: 'message', from: 'BACKEND', to: 'USER', label: '401 Unauthorized', color: 'red'}},
        ], 'expired');
        setUnlocked(3);
    };

    const runRefreshFlow = async () => {
        const oldId = refreshToken.id;
        const nextId = tokenId();

        await runSequence([
            {event: {kind: 'message', from: 'USER', to: 'BACKEND', label: 'Refresh Request (Refresh Token)'}},
            {event: {kind: 'process', actor: 'BACKEND', label: 'Validate Refresh Token'}},
            {event: {kind: 'process', actor: 'BACKEND', label: 'Rotate Tokens', color: 'green'}},
            {action: () => {
                setRefreshToken((prev) => ({...prev, id: nextId, version: prev.version + 1, oldRef: oldId, status: 'active'}));
                setAccessStatus('valid');
                setAccessTtl(ACCESS_TTL_SECONDS);
                setAccessIssuedAt(new Date());
                addLog(`[Token] rotated refresh token ${oldId} -> ${nextId}`);
            }},
            {event: {kind: 'message', from: 'BACKEND', to: 'USER', label: 'New Access Token', color: 'green'}},
        ], 'refresh');
        setUnlocked(4);
    };

    const simulateTheft = async () => {
        const stolen = refreshToken.oldRef !== '-' ? refreshToken.oldRef : refreshToken.id;
        await runSequence([
            {event: {kind: 'message', from: 'ATTACKER', to: 'BACKEND', label: `Stolen Refresh Token (${stolen})`, color: 'red'}},
            {event: {kind: 'process', actor: 'BACKEND', label: 'Detect Refresh Reuse', color: 'red'}},
            {event: {kind: 'process', actor: 'BACKEND', label: 'Revoke Session', color: 'red'}},
            {action: () => {
                setSessionStatus('revoked');
                setAccessStatus('expired');
                setAccessTtl(0);
                setRefreshToken((prev) => ({...prev, status: 'revoked'}));
                addLog('[Security] refresh token reuse detected');
                addLog('[Session] user session revoked');
            }},
            {event: {kind: 'message', from: 'BACKEND', to: 'ATTACKER', label: 'Blocked', color: 'red'}},
        ], 'theft');
        setUnlocked(5);
    };

    const reset = () => {
        runRef.current = 0;
        setRunning(false);
        setUnlocked(0);
        setSimKey('idle');
        setAccessStatus('valid');
        setAccessTtl(ACCESS_TTL_SECONDS);
        setAccessIssuedAt(new Date());
        setSessionStatus('idle');
        setRefreshToken(initialRefresh);
        setEvents([]);
        setActiveEventId(null);
        setLogs(['[boot] sequence simulator reset']);
        eventIdRef.current = 1;
    };

    const diagramHeight = Math.max(700, 180 + events.length * EVENT_GAP);

    const strokeColor = (event) => {
        if (event.color === 'red') return '#fb7185';
        if (event.color === 'green') return '#4ade80';
        return '#fbbf24';
    };

    const revokedLabel = useMemo(() => (refreshToken.status === 'revoked' ? 'revoked' : 'active'), [refreshToken.status]);

    return (
        <DocsLayout title="Security Demo" subtitle="UML-style authentication sequence simulator for JWT validation, refresh rotation, and token reuse defense.">
            <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/5 p-4">
                    <p className="text-sm font-semibold text-cyan-100">{title}</p>
                    <p className="text-sm text-slate-300">{description}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d1326] to-[#101b35] p-4" style={{minHeight: 700}}>
                    <svg viewBox={`0 0 1200 ${diagramHeight}`} className="h-full w-full">
                        {ACTORS.map((actor) => (
                            <g key={actor.id}>
                                <rect x={actor.x - 70} y={20} width="140" height="44" rx="12" className="fill-slate-900/90 stroke-slate-500" />
                                <text x={actor.x} y={47} textAnchor="middle" className="fill-slate-100 text-[14px] font-semibold">{actor.label}</text>
                                <line x1={actor.x} y1={64} x2={actor.x} y2={diagramHeight - 30} className="stroke-slate-500" strokeDasharray="7 7" />
                            </g>
                        ))}

                        {events.map((event, index) => {
                            const y = 100 + index * EVENT_GAP;
                            const active = activeEventId === event.id;
                            if (event.kind === 'process') {
                                const x = actorX(event.actor);
                                return (
                                    <g key={event.id}>
                                        <rect
                                            x={x - 90}
                                            y={y - 18}
                                            width="180"
                                            height="36"
                                            rx="8"
                                            className={active ? 'fill-cyan-400/20 stroke-cyan-300' : 'fill-slate-800/80 stroke-slate-400'}
                                            style={{transition: 'all 220ms ease'}}
                                        />
                                        <text x={x} y={y + 5} textAnchor="middle" className="fill-slate-100 text-[12px]">[{event.label}]</text>
                                    </g>
                                );
                            }

                            const fromX = actorX(event.from);
                            const toX = actorX(event.to);
                            const leftToRight = fromX < toX;
                            return (
                                <g key={event.id}>
                                    <line
                                        x1={fromX}
                                        y1={y}
                                        x2={toX}
                                        y2={y}
                                        stroke={strokeColor(event)}
                                        strokeWidth="3"
                                        markerEnd={leftToRight ? 'url(#arrowRight)' : 'url(#arrowLeft)'}
                                        strokeDasharray={active ? '220' : '0'}
                                        strokeDashoffset={active ? '220' : '0'}
                                    >
                                        {active && <animate attributeName="stroke-dashoffset" from="220" to="0" dur="0.3s" fill="freeze" />}
                                    </line>
                                    <text x={(fromX + toX) / 2} y={y - 8} textAnchor="middle" className="fill-slate-200 text-[11px]">{event.label}</text>
                                </g>
                            );
                        })}

                        <defs>
                            <marker id="arrowRight" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                                <path d="M0,0 L10,4 L0,8 z" fill="#e2e8f0" />
                            </marker>
                            <marker id="arrowLeft" markerWidth="10" markerHeight="8" refX="1" refY="4" orient="auto">
                                <path d="M10,0 L0,4 L10,8 z" fill="#e2e8f0" />
                            </marker>
                        </defs>
                    </svg>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <h4 className="mb-3 text-sm font-semibold">Guided Controls</h4>
                    <div className="flex flex-wrap gap-3">
                        <button type="button" disabled={running || unlocked !== 0} onClick={startSession} className="rounded-lg border border-cyan-300/60 bg-cyan-400/10 px-4 py-2 text-sm disabled:opacity-50">1. Start Session</button>
                        <button type="button" disabled={running || unlocked !== 1} onClick={sendApiRequest} className="rounded-lg border border-cyan-300/60 bg-cyan-400/10 px-4 py-2 text-sm disabled:opacity-50">2. Send API Request</button>
                        <button type="button" disabled={running || unlocked !== 2} onClick={expireToken} className="rounded-lg border border-cyan-300/60 bg-cyan-400/10 px-4 py-2 text-sm disabled:opacity-50">3. Expire Access Token</button>
                        <button type="button" disabled={running || unlocked !== 3} onClick={runRefreshFlow} className="rounded-lg border border-cyan-300/60 bg-cyan-400/10 px-4 py-2 text-sm disabled:opacity-50">4. Run Refresh Flow</button>
                        <button type="button" disabled={running || unlocked !== 4} onClick={simulateTheft} className="rounded-lg border border-cyan-300/60 bg-cyan-400/10 px-4 py-2 text-sm disabled:opacity-50">5. Simulate Token Theft</button>
                        <button type="button" onClick={reset} className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm">Reset Simulation</button>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-300">
                        <h4 className="mb-2 font-semibold">Session State</h4>
                        <p>Session: <span className={sessionStatus === 'active' ? 'text-emerald-300' : sessionStatus === 'revoked' ? 'text-rose-300' : 'text-slate-300'}>{sessionStatus}</span></p>
                        <p>Access token: <span className={accessStatus === 'valid' ? 'text-emerald-300' : 'text-rose-300'}>{accessStatus}</span></p>
                        <p>TTL: <span className="font-mono text-cyan-200">{fmt(accessTtl)}</span></p>
                        <p>Issued: {accessIssuedAt.toLocaleTimeString()}</p>
                        <p>Refresh token: <span className={revokedLabel === 'active' ? 'text-emerald-300' : 'text-rose-300'}>{revokedLabel}</span></p>
                        <p>Refresh id: {refreshToken.id}</p>
                        <p>Refresh version: v{refreshToken.version}</p>
                        <p>Old token ref: {refreshToken.oldRef}</p>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/45 p-4">
                        <h4 className="mb-2 font-semibold">Security Log Console</h4>
                        <div className="h-52 overflow-auto rounded-lg border border-white/10 bg-black/55 p-3 font-mono text-xs text-green-300">
                            {logs.map((line, idx) => <p key={`${idx}-${line}`}>{line}</p>)}
                        </div>
                    </section>
                </div>
            </section>
        </DocsLayout>
    );
};

export default SecurityDemoPage;
