/**
 * process-data.mjs
 * Usage:
 *   node scripts/process-data.mjs local   — extract from AttackScenarioEngine.jsx or enterprise-attack.json
 *   node scripts/process-data.mjs mitre   — fetch latest STIX bundle from MITRE GitHub
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const OUT = join(ROOT, 'public', 'data');

const MITRE_URL =
  'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack-16.1.json';

// Country keywords → code mapping
const COUNTRY_KEYWORDS = [
  ['CN', ["china", "chinese", "prc", "people's republic of china"]],
  ['RU', ["russia", "russian", "fsb", "gru", "svr", "sandworm", "apt28", "apt29", "turla", "gamaredon", "dragonfly"]],
  ['NK', ["north korea", "dprk", "korean people", "lazarus", "kimsuky"]],
  ['IR', ["iran", "iranian", "irgc", "oilrig", "magic hound", "apt33", "apt34", "apt35"]],
  ['VN', ["vietnam", "vietnamese", "apt32", "ocean lotus"]],
  ['CN', ["apt1", "apt10", "apt17", "apt19", "apt30", "apt40", "apt41", "volt typhoon", "chimera", "mustang panda"]],
];

const COUNTRY_META = {
  CN: { flag: '🇨🇳', name: 'China', color: '#ef4444' },
  RU: { flag: '🇷🇺', name: 'Russia', color: '#3b82f6' },
  NK: { flag: '🇰🇵', name: 'North Korea', color: '#a855f7' },
  IR: { flag: '🇮🇷', name: 'Iran', color: '#f97316' },
  VN: { flag: '🇻🇳', name: 'Vietnam', color: '#22c55e' },
  UNK: { flag: '🏴', name: 'Unknown', color: '#6b7280' },
};

function inferCountry(name = '', description = '') {
  const haystack = (name + ' ' + description).toLowerCase();
  for (const [code, keywords] of COUNTRY_KEYWORDS) {
    if (keywords.some(kw => haystack.includes(kw))) {
      return { code, ...COUNTRY_META[code] };
    }
  }
  return { code: 'UNK', ...COUNTRY_META.UNK };
}

// ── STIX parser ────────────────────────────────────────────────────────────
function parseStix(bundle) {
  const byStixId = {};
  for (const obj of bundle.objects) byStixId[obj.id] = obj;

  const getMitreId = obj =>
    obj.external_references?.find(r => r.source_name === 'mitre-attack')?.external_id ?? null;

  // Index techniques
  const techObjs = bundle.objects.filter(
    o => o.type === 'attack-pattern' && !o.revoked && !o.x_mitre_deprecated
  );
  const techByStixId = {};
  const techById = {};
  for (const t of techObjs) {
    const id = getMitreId(t);
    if (!id) continue;
    const obj = {
      stixId: t.id,
      id,
      name: t.name,
      description: (t.description || '').slice(0, 120),
      tactics: (t.kill_chain_phases || [])
        .filter(p => p.kill_chain_name === 'mitre-attack')
        .map(p => p.phase_name),
      platforms: t.x_mitre_platforms || [],
      isSubtechnique: t.x_mitre_is_subtechnique || false,
    };
    techByStixId[t.id] = obj;
    techById[id] = obj;
  }

  // Build subtechnique parent map: T1234.001 → T1234
  const subsByParent = {};
  for (const t of Object.values(techById)) {
    if (!t.isSubtechnique) continue;
    const parentId = t.id.split('.')[0];
    if (!subsByParent[parentId]) subsByParent[parentId] = [];
    subsByParent[parentId].push(t);
  }

  // Index groups
  const groupObjs = bundle.objects.filter(
    o => o.type === 'intrusion-set' && !o.revoked && !o.x_mitre_deprecated
  );

  // Build group→technique mappings from relationships
  const groupTechStixIds = {};
  for (const r of bundle.objects) {
    if (r.type !== 'relationship' || r.relationship_type !== 'uses') continue;
    const src = byStixId[r.source_ref];
    const tgt = byStixId[r.target_ref];
    if (src?.type !== 'intrusion-set' || tgt?.type !== 'attack-pattern') continue;
    if (!groupTechStixIds[r.source_ref]) groupTechStixIds[r.source_ref] = new Set();
    groupTechStixIds[r.source_ref].add(r.target_ref);
  }

  const groups = [];
  for (const g of groupObjs) {
    const id = getMitreId(g);
    if (!id) continue;

    const techStixIds = [...(groupTechStixIds[g.id] || [])];
    const allTechs = techStixIds.map(sid => techByStixId[sid]).filter(Boolean);

    // Collect parent technique IDs used by this group
    const usedParentIds = new Set();
    const usedSubIds = new Set();
    for (const t of allTechs) {
      if (t.isSubtechnique) {
        usedSubIds.add(t.id);
        usedParentIds.add(t.id.split('.')[0]);
      } else {
        usedParentIds.add(t.id);
      }
    }

    const techniques = [...usedParentIds]
      .map(pid => techById[pid])
      .filter(Boolean)
      .map(parent => ({
        id: parent.id,
        name: parent.name,
        description: parent.description,
        tactics: parent.tactics,
        platforms: parent.platforms,
        subs: (subsByParent[parent.id] || [])
          .filter(s => usedSubIds.has(s.id))
          .map(s => ({ id: s.id, name: s.name, description: s.description })),
      }));

    groups.push({
      id,
      name: g.name,
      aliases: g.aliases || [g.name],
      description: (g.description || '').slice(0, 300),
      country: inferCountry(g.name, g.description || ''),
      techniques,
    });
  }

  // Sort by technique count descending
  groups.sort((a, b) => b.techniques.length - a.techniques.length);
  return groups;
}

// ── JSX embedded data extractor ────────────────────────────────────────────
function extractFromJsx() {
  const jsxPath = join(ROOT, 'AttackScenarioEngine.jsx');
  if (!existsSync(jsxPath)) throw new Error('AttackScenarioEngine.jsx not found');
  const src = readFileSync(jsxPath, 'utf8');
  const match = src.match(/const RAW\s*=\s*(\{[\s\S]*?\});[\s\n]*const PRECOMP/);
  if (!match) throw new Error('Could not find RAW data in AttackScenarioEngine.jsx');
  return JSON.parse(match[1]).groups;
}

// ── PRECOMP_LINKS computation ──────────────────────────────────────────────
function computeLinks(groups) {
  const links = [];
  for (let i = 0; i < groups.length; i++) {
    const setA = new Set(groups[i].techniques.map(t => t.id));
    for (let j = i + 1; j < groups.length; j++) {
      const setB = new Set(groups[j].techniques.map(t => t.id));
      const shared = [...setA].filter(id => setB.has(id));
      if (shared.length >= 5) {
        links.push({
          source: groups[i].id,
          target: groups[j].id,
          value: shared.length,
          shared: shared.slice(0, 10),
        });
      }
    }
  }
  return links.sort((a, b) => b.value - a.value);
}

// ── Unique techniques index ────────────────────────────────────────────────
function buildTechniquesIndex(groups) {
  const techMap = {};
  const subMap = {};
  for (const g of groups) {
    for (const t of g.techniques) {
      if (!techMap[t.id]) {
        techMap[t.id] = { id: t.id, name: t.name, description: t.description, tactics: t.tactics, platforms: t.platforms };
      }
      for (const s of t.subs || []) {
        if (!subMap[s.id]) {
          subMap[s.id] = { id: s.id, name: s.name, description: s.description, parentId: t.id };
        }
      }
    }
  }
  return { techniques: Object.values(techMap), subtechniques: Object.values(subMap) };
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const source = process.argv[2] || 'local';
  console.log(`[process-data] source=${source}`);

  let groups;

  if (source === 'mitre') {
    console.log('[process-data] Fetching from MITRE GitHub...');
    const res = await fetch(MITRE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching MITRE data`);
    console.log('[process-data] Parsing STIX bundle...');
    const bundle = await res.json();
    groups = parseStix(bundle);
    console.log(`[process-data] Parsed ${groups.length} groups from STIX`);
  } else {
    // Try enterprise-attack.json first, fall back to JSX
    const jsonPath = join(ROOT, 'enterprise-attack.json');
    if (existsSync(jsonPath)) {
      console.log('[process-data] Loading enterprise-attack.json...');
      const bundle = JSON.parse(readFileSync(jsonPath, 'utf8'));
      groups = parseStix(bundle);
      console.log(`[process-data] Parsed ${groups.length} groups from STIX`);
    } else {
      console.log('[process-data] Extracting embedded data from AttackScenarioEngine.jsx...');
      groups = extractFromJsx();
      console.log(`[process-data] Extracted ${groups.length} groups`);
    }
  }

  const links = computeLinks(groups);
  const { techniques, subtechniques } = buildTechniquesIndex(groups);
  const metadata = {
    lastUpdated: new Date().toISOString(),
    source,
    groupCount: groups.length,
    techniqueCount: techniques.length,
    subtechniqueCount: subtechniques.length,
    version: source === 'mitre' ? 'latest (MITRE GitHub)' : 'local',
  };

  writeFileSync(join(OUT, 'groups.json'), JSON.stringify(groups));
  writeFileSync(join(OUT, 'relations.json'), JSON.stringify(links));
  writeFileSync(join(OUT, 'techniques.json'), JSON.stringify(techniques));
  writeFileSync(join(OUT, 'subtechniques.json'), JSON.stringify(subtechniques));
  writeFileSync(join(OUT, 'metadata.json'), JSON.stringify(metadata, null, 2));

  console.log(`[process-data] Done. Written to public/data/`);
  console.log(`  groups: ${groups.length}, techniques: ${techniques.length}, subtechniques: ${subtechniques.length}, links: ${links.length}`);
}

main().catch(e => { console.error('[process-data] ERROR:', e.message); process.exit(1); });
