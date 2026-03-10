import DocsLayout from '../components/DocsLayout';
import {AnimatedFlow} from '../components/FlowDiagram';

const DeploymentDocsPage = () => (
    <DocsLayout title="Deployment" subtitle="Delivery pipeline and runtime infrastructure for resilient auth services.">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-4 text-xl font-semibold">CI/CD pipeline</h3>
            <AnimatedFlow steps={['Developer pushes code', 'Build', 'Test', 'Database migration', 'Backend deployment', 'Frontend deployment (Vercel)']} />
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-4 text-xl font-semibold">Infrastructure Diagram</h3>
            <div className="grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-lg border border-white/15 bg-black/20 p-3">Frontend → Vercel</div>
                <div className="rounded-lg border border-white/15 bg-black/20 p-3">Backend → Spring Boot server</div>
                <div className="rounded-lg border border-white/15 bg-black/20 p-3">Domain → DuckDNS</div>
                <div className="rounded-lg border border-white/15 bg-black/20 p-3">Database → PostgreSQL</div>
                <div className="rounded-lg border border-white/15 bg-black/20 p-3 md:col-span-2">Cache / rate limiting → Redis</div>
            </div>
        </section>
    </DocsLayout>
);

export default DeploymentDocsPage;
