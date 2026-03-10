import DocsLayout from '../components/DocsLayout';
import {AnimatedFlow, VerticalFlow} from '../components/FlowDiagram';

const block = 'rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm';

const ArchitectureDocsPage = () => (
    <DocsLayout title="Architecture" subtitle="System-level views for core identity components and security controls.">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-4 text-xl font-semibold">High Level Architecture</h3>
            <div className="flex flex-col items-center gap-2 text-center">
                {['User Browser', 'Frontend (Vercel)', 'Backend API (Spring Boot)', 'Database (PostgreSQL)', 'Cache / Rate Limiting (Redis)'].map((x, i) => (
                    <div key={x} className="contents">
                        <div className={block}>{x}</div>
                        {i < 4 && <div className="text-slate-500">↓</div>}
                    </div>
                ))}
            </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
            <div>
                <h3 className="mb-3 text-lg font-semibold">Login Flow</h3>
                <AnimatedFlow steps={['User enters credentials', 'Backend verifies user', 'Access token issued', 'Refresh token issued', 'Refresh token stored in database', 'Access token returned']} />
            </div>
            <div>
                <h3 className="mb-3 text-lg font-semibold">Token Refresh Flow</h3>
                <AnimatedFlow steps={['Access token expires', 'Client sends refresh token', 'Backend validates refresh token', 'New access token issued', 'Refresh token rotated']} />
            </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-3 text-xl font-semibold">Security Architecture Pipeline</h3>
            <VerticalFlow steps={['Rate Limiting', 'Spring Security Filters', 'JWT Verification', 'Role-Based Authorization']} />
        </section>
    </DocsLayout>
);

export default ArchitectureDocsPage;
