const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


const SOURCE_LABELS = {
  code: 'Code Snippet',
  url: 'Website URL',
  project: 'Project Code',
};

const SEVERITY_TO_SCORE = { critical: 85, warning: 55, info: 20 };
const SEVERITY_TO_RISK = { critical: 'Critical', warning: 'Medium', info: 'Low' };
const VALID_RISKS = ['Low', 'Medium', 'High', 'Critical'];
const VALID_SEVERITIES = ['critical', 'warning', 'info'];

const ensureStr = (v, d = '') => (typeof v === 'string' ? v : v == null ? d : String(v));

/**
 * Normalize the raw LLM result so the app works with any model (weak or strong).
 * Guarantees every bug has a complete, well-shaped `impact` object — synthesizing
 * a minimal one from the bug's own severity when the model omits it — so the
 * Bug Impact panel and all downstream features never crash on partial data.
 */
function normalizeImpact(bug) {
  const severity = bug.severity || 'info';
  const fallbackScore = SEVERITY_TO_SCORE[severity] ?? 30;
  const fallbackRisk = SEVERITY_TO_RISK[severity] ?? 'Low';
  const raw = bug.impact && typeof bug.impact === 'object' ? bug.impact : null;

  if (!raw) {
    return {
      impact_score: fallbackScore,
      risk_level: fallbackRisk,
      root_component: {
        name: bug.title || 'Unknown',
        file: '',
        detail: bug.description || 'Root component could not be determined by the model.',
      },
      affected_files: [],
      affected_features: [],
      dependency_chain: {
        nodes: [{ id: 'root', label: bug.title || 'Root', type: 'root', file: '', detail: bug.description || '' }],
        edges: [],
      },
      user_impact: [],
      blast_radius: {
        level: severity === 'critical' ? 'module' : 'contained',
        description: 'Estimated from severity; detailed blast radius was not provided by the model.',
        affected_count: 0,
      },
    };
  }

  const chain = raw.dependency_chain && typeof raw.dependency_chain === 'object' ? raw.dependency_chain : {};
  const nodes = Array.isArray(chain.nodes)
    ? chain.nodes.map((n) => ({
        id: ensureStr(n.id),
        label: ensureStr(n.label, 'node'),
        type: ensureStr(n.type, 'component'),
        file: ensureStr(n.file),
        detail: ensureStr(n.detail),
      }))
    : [];
  if (!nodes.some((n) => n.id === 'root')) {
    nodes.unshift({
      id: 'root',
      label: raw.root_component?.name || bug.title || 'Root',
      type: 'root',
      file: ensureStr(raw.root_component?.file),
      detail: ensureStr(raw.root_component?.detail),
    });
  }
  const edges = Array.isArray(chain.edges)
    ? chain.edges.map((e) => ({ from: ensureStr(e.from), to: ensureStr(e.to), label: ensureStr(e.label) }))
    : [];

  const rootComp = raw.root_component && typeof raw.root_component === 'object'
    ? {
        name: ensureStr(raw.root_component.name, bug.title || 'Unknown'),
        file: ensureStr(raw.root_component.file),
        detail: ensureStr(raw.root_component.detail),
      }
    : { name: bug.title || 'Unknown', file: '', detail: '' };

  const blast = raw.blast_radius && typeof raw.blast_radius === 'object'
    ? {
        level: ensureStr(raw.blast_radius.level, 'contained'),
        description: ensureStr(raw.blast_radius.description),
        affected_count: typeof raw.blast_radius.affected_count === 'number' ? raw.blast_radius.affected_count : 0,
      }
    : { level: 'contained', description: '', affected_count: 0 };

  return {
    impact_score: typeof raw.impact_score === 'number' ? raw.impact_score : fallbackScore,
    risk_level: VALID_RISKS.includes(raw.risk_level) ? raw.risk_level : fallbackRisk,
    root_component: rootComp,
    affected_files: Array.isArray(raw.affected_files)
      ? raw.affected_files.map((f) => ({ name: ensureStr(f.name, 'file'), path: ensureStr(f.path), reason: ensureStr(f.reason) }))
      : [],
    affected_features: Array.isArray(raw.affected_features)
      ? raw.affected_features.map((f) => ({ name: ensureStr(f.name, 'feature'), impact: ensureStr(f.impact), severity: ensureStr(f.severity) }))
      : [],
    dependency_chain: { nodes, edges },
    user_impact: Array.isArray(raw.user_impact)
      ? raw.user_impact.map((u) => ({ audience: ensureStr(u.audience, 'users'), workflow: ensureStr(u.workflow), severity: ensureStr(u.severity) }))
      : [],
    blast_radius: blast,
  };
}

function normalizeBugs(bugs) {
  if (!Array.isArray(bugs)) return [];
  return bugs.map((b) => {
    const bug = b && typeof b === 'object' ? b : {};
    const severity = VALID_SEVERITIES.includes(bug.severity) ? bug.severity : 'info';
    return {
      title: ensureStr(bug.title, 'Untitled bug'),
      severity,
      line: ensureStr(bug.line, 'N/A'),
      description: ensureStr(bug.description),
      fix: ensureStr(bug.fix),
      category: ensureStr(bug.category),
      impact: normalizeImpact({ ...bug, severity }),
    };
  });
}

function buildPrompt(sourceType, content) {
  return `You are BugSweep, an expert code analysis tool. Analyze the following ${sourceType === 'url' ? 'website URL' : 'code'} for bugs, vulnerabilities, errors, and code quality issues.

${sourceType === 'code' || sourceType === 'project' ? 'CODE TO ANALYZE:' : 'URL TO ANALYZE:'}
${content}

Provide a thorough analysis. For each issue found, include:
- title: short name of the bug
- severity: "critical", "warning", or "info"
- line: approximate line number or range (as string), or "N/A" for URLs
- description: what the bug is and why it's a problem
- fix: the recommended fix (be specific and actionable)
- category: e.g. "Security", "Logic", "Performance", "Syntax", "Best Practice"
- impact: an AI-ESTIMATED impact analysis (these are estimates, NOT confirmed facts). Include:
  - impact_score: number 0-100 (higher = greater impact), based on severity, number of affected components, dependency depth, and user-facing impact
  - risk_level: "Low", "Medium", "High", or "Critical"
  - root_component: { name, file, detail } — the component/function where the issue originates
  - affected_files: array of { name, path, reason } — files directly or indirectly affected (estimate plausible paths if not explicit in the input)
  - affected_features: array of { name, impact, severity } — application features that could break or behave incorrectly
  - dependency_chain: { nodes: [ { id, label, type, file, detail } ], edges: [ { from, to, label } ] } — a map of how the bug flows through related components, APIs, modules, and dependencies. The root node MUST have id "root". Use type values from: "root", "component", "api", "module", "dependency", "file". Keep it concise: 3 to 8 nodes total.
  - user_impact: array of { audience, workflow, severity } — which types of users or workflows could be affected
  - blast_radius: { level: "contained"|"module"|"system"|"global", description, affected_count } — how far the issue could propagate if left unfixed

Also provide:
- summary: a 1-2 sentence overall summary of the code quality
- language: the detected programming language (e.g. "javascript", "python", "html", etc.)
- health_score: a number 0-100 representing overall code health (100 = no issues)
- corrected_code: the FULL corrected version of the code with all detected bugs fixed. Preserve the original structure, comments, and formatting as closely as possible — only change what is needed to fix the bugs. If the input is a URL (not code), return an empty string.

Return your response as JSON with this exact structure:
{
  "summary": "string",
  "language": "string",
  "health_score": number,
  "corrected_code": "string",
  "bugs": [
    {
      "title": "string",
      "severity": "critical|warning|info",
      "line": "string",
      "description": "string",
      "fix": "string",
      "category": "string",
      "impact": {
        "impact_score": number,
        "risk_level": "Low|Medium|High|Critical",
        "root_component": { "name": "string", "file": "string", "detail": "string" },
        "affected_files": [ { "name": "string", "path": "string", "reason": "string" } ],
        "affected_features": [ { "name": "string", "impact": "string", "severity": "string" } ],
        "dependency_chain": {
          "nodes": [ { "id": "string", "label": "string", "type": "root|component|api|module|dependency|file", "file": "string", "detail": "string" } ],
          "edges": [ { "from": "string", "to": "string", "label": "string" } ]
        },
        "user_impact": [ { "audience": "string", "workflow": "string", "severity": "string" } ],
        "blast_radius": { "level": "contained|module|system|global", "description": "string", "affected_count": number }
      }
    }
  ]
}

If the code is clean and has no issues, return an empty bugs array, a health_score of 100, and corrected_code equal to the original code. When estimating impact, be reasonable and do not exaggerate — if the bug is minor, keep impact_score low and risk_level "Low".`;
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    language: { type: 'string' },
    health_score: { type: 'number' },
    corrected_code: { type: 'string' },
    bugs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          severity: { type: 'string' },
          line: { type: 'string' },
          description: { type: 'string' },
          fix: { type: 'string' },
          category: { type: 'string' },
          impact: {
            type: 'object',
            properties: {
              impact_score: { type: 'number' },
              risk_level: { type: 'string' },
              root_component: {
                type: 'object',
                properties: { name: { type: 'string' }, file: { type: 'string' }, detail: { type: 'string' } },
              },
              affected_files: {
                type: 'array',
                items: { type: 'object', properties: { name: { type: 'string' }, path: { type: 'string' }, reason: { type: 'string' } } },
              },
              affected_features: {
                type: 'array',
                items: { type: 'object', properties: { name: { type: 'string' }, impact: { type: 'string' }, severity: { type: 'string' } } },
              },
              dependency_chain: {
                type: 'object',
                properties: {
                  nodes: {
                    type: 'array',
                    items: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' }, type: { type: 'string' }, file: { type: 'string' }, detail: { type: 'string' } } },
                  },
                  edges: {
                    type: 'array',
                    items: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' }, label: { type: 'string' } } },
                  },
                },
              },
              user_impact: {
                type: 'array',
                items: { type: 'object', properties: { audience: { type: 'string' }, workflow: { type: 'string' }, severity: { type: 'string' } } },
              },
              blast_radius: {
                type: 'object',
                properties: { level: { type: 'string' }, description: { type: 'string' }, affected_count: { type: 'number' } },
              },
            },
          },
        },
      },
    },
  },
};

export async function runScan({ sourceType, content, tags = [], title }) {
  const label = SOURCE_LABELS[sourceType] || 'Code Snippet';
  const report = await db.entities.BugReport.create({
    title: title || (sourceType === 'url' ? content.trim() : `${label} — ${new Date().toLocaleDateString()}`),
    source_type: sourceType,
    source_content: content,
    status: 'analyzing',
    severity_counts: { critical: 0, warning: 0, info: 0 },
    bugs: [],
    health_score: 0,
    summary: '',
    language: '',
    tags,
  });

  const result = (await db.integrations.Core.InvokeLLM({
    prompt: buildPrompt(sourceType, content),
    response_json_schema: RESPONSE_SCHEMA,
  })) || {};

  // Normalize so any model (weak or strong) yields well-shaped, crash-safe data.
  const bugs = normalizeBugs(result.bugs);
  const severityCounts = { critical: 0, warning: 0, info: 0 };
  bugs.forEach((bug) => {
    if (severityCounts[bug.severity] !== undefined) severityCounts[bug.severity]++;
  });

  await db.entities.BugReport.update(report.id, {
    status: 'completed',
    summary: ensureStr(result.summary),
    language: ensureStr(result.language),
    health_score: typeof result.health_score === 'number' ? result.health_score : 0,
    corrected_code: ensureStr(result.corrected_code),
    bugs,
    severity_counts: severityCounts,
  });

  return report.id;
}