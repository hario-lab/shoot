import { useState, useCallback } from "react";

export const MITRE_STIX_URL =
  'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json';

// Bundled at build time — dist/index.html works offline without a server
import defaultGroups    from "../../public/data/groups.json";
import defaultLinks     from "../../public/data/relations.json";
import defaultTechniques from "../../public/data/techniques.json";
import defaultMetadata  from "../../public/data/metadata.json";

// ── Client-side STIX parser (mirrors scripts/process-data.mjs) ──────────────

const COUNTRY_KEYWORDS = [
  ['CN', ["china", "chinese", "prc", "people's republic of china"]],
  ['RU', ["russia", "russian", "fsb", "gru", "svr", "sandworm", "apt28", "apt29", "turla", "gamaredon", "dragonfly"]],
  ['NK', ["north korea", "dprk", "korean people", "lazarus", "kimsuky"]],
  ['IR', ["iran", "iranian", "irgc", "oilrig", "magic hound", "apt33", "apt34", "apt35"]],
  ['VN', ["vietnam", "vietnamese", "apt32", "ocean lotus"]],
  ['CN', ["apt1", "apt10", "apt17", "apt19", "apt30", "apt40", "apt41", "volt typhoon", "chimera", "mustang panda"]],
];
const COUNTRY_META = {
  CN:  { flag: '🇨🇳', name: 'China',       color: '#ef4444' },
  RU:  { flag: '🇷🇺', name: 'Russia',      color: '#3b82f6' },
  NK:  { flag: '🇰🇵', name: 'North Korea', color: '#a855f7' },
  IR:  { flag: '🇮🇷', name: 'Iran',        color: '#f97316' },
  VN:  { flag: '🇻🇳', name: 'Vietnam',     color: '#22c55e' },
  UNK: { flag: '🏴',  name: 'Unknown',     color: '#6b7280' },
};

function inferCountry(name = '', description = '') {
  const haystack = (name + ' ' + description).toLowerCase();
  for (const [code, keywords] of COUNTRY_KEYWORDS) {
    if (keywords.some(kw => haystack.includes(kw))) return { code, ...COUNTRY_META[code] };
  }
  return { code: 'UNK', ...COUNTRY_META.UNK };
}

function parseStix(bundle) {
  const byStixId = {};
  for (const obj of bundle.objects) byStixId[obj.id] = obj;

  const getMitreId = obj =>
    obj.external_references?.find(r => r.source_name === 'mitre-attack')?.external_id ?? null;

  const techObjs = bundle.objects.filter(
    o => o.type === 'attack-pattern' && !o.revoked && !o.x_mitre_deprecated
  );
  const techByStixId = {};
  const techById = {};
  for (const t of techObjs) {
    const id = getMitreId(t);
    if (!id) continue;
    const obj = {
      stixId: t.id, id, name: t.name,
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

  const subsByParent = {};
  for (const t of Object.values(techById)) {
    if (!t.isSubtechnique) continue;
    const parentId = t.id.split('.')[0];
    if (!subsByParent[parentId]) subsByParent[parentId] = [];
    subsByParent[parentId].push(t);
  }

  const groupObjs = bundle.objects.filter(
    o => o.type === 'intrusion-set' && !o.revoked && !o.x_mitre_deprecated
  );

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

    const usedParentIds = new Set();
    const usedSubIds = new Set();
    for (const t of allTechs) {
      if (t.isSubtechnique) { usedSubIds.add(t.id); usedParentIds.add(t.id.split('.')[0]); }
      else { usedParentIds.add(t.id); }
    }

    const techniques = [...usedParentIds]
      .map(pid => techById[pid]).filter(Boolean)
      .map(parent => ({
        id: parent.id, name: parent.name,
        description: parent.description,
        tactics: parent.tactics, platforms: parent.platforms,
        subs: (subsByParent[parent.id] || [])
          .filter(s => usedSubIds.has(s.id))
          .map(s => ({ id: s.id, name: s.name, description: s.description })),
      }));

    groups.push({
      id, name: g.name,
      aliases: g.aliases || [g.name],
      description: (g.description || '').slice(0, 300),
      country: inferCountry(g.name, g.description || ''),
      techniques,
    });
  }
  groups.sort((a, b) => b.techniques.length - a.techniques.length);
  return { groups, techById, subsByParent };
}

function computeLinks(groups) {
  const links = [];
  for (let i = 0; i < groups.length; i++) {
    const setA = new Set(groups[i].techniques.map(t => t.id));
    for (let j = i + 1; j < groups.length; j++) {
      const setB = new Set(groups[j].techniques.map(t => t.id));
      const shared = [...setA].filter(id => setB.has(id));
      if (shared.length >= 5) {
        links.push({ source: groups[i].id, target: groups[j].id, value: shared.length, shared: shared.slice(0, 10) });
      }
    }
  }
  return links.sort((a, b) => b.value - a.value);
}

function buildTechniquesIndex(groups) {
  const techMap = {};
  for (const g of groups) {
    for (const t of g.techniques) {
      if (!techMap[t.id]) {
        techMap[t.id] = { id: t.id, name: t.name, description: t.description, tactics: t.tactics, platforms: t.platforms };
      }
    }
  }
  return Object.values(techMap);
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useAttackData() {
  const [groups,     setGroups]     = useState(defaultGroups);
  const [links,      setLinks]      = useState(defaultLinks);
  const [techniques, setTechniques] = useState(defaultTechniques);
  const [metadata,   setMetadata]   = useState(defaultMetadata);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  // Re-fetch from dev server after a data update (only works with `npm run dev`)
  const loadFromFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRes, lRes, tRes, mRes] = await Promise.all([
        fetch("./data/groups.json"),
        fetch("./data/relations.json"),
        fetch("./data/techniques.json"),
        fetch("./data/metadata.json"),
      ]);
      const [g, l, t, m] = await Promise.all([gRes.json(), lRes.json(), tRes.json(), mRes.json()]);
      setGroups(g);
      setLinks(l);
      setTechniques(t);
      setMetadata(m);
    } catch (e) {
      console.error('[useAttackData] loadFromFiles error:', e);
      setError(e.message);
    }
    setLoading(false);
  }, []);

  const triggerUpdate = useCallback(async (source) => {
    setLoading(true);
    setError(null);
    try {
      if (source === 'mitre') {
        // Direct browser fetch from MITRE GitHub (works on static deployments)
        console.log('[useAttackData] Fetching STIX bundle from MITRE GitHub...');
        const res = await fetch(MITRE_STIX_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching MITRE data`);
        console.log('[useAttackData] Parsing STIX bundle...');
        const bundle = await res.json();
        const { groups: parsedGroups } = parseStix(bundle);
        const parsedLinks = computeLinks(parsedGroups);
        const parsedTechniques = buildTechniquesIndex(parsedGroups);

        const collection = bundle.objects?.find(o => o.type === 'x-mitre-collection');
        const modifiedStr = collection?.modified
          ?? bundle.objects?.map(o => o.modified).filter(Boolean).sort().at(-1);
        const mitreYear = modifiedStr ? new Date(modifiedStr).getFullYear() : null;

        const newMetadata = {
          lastUpdated: new Date().toISOString(),
          source: 'mitre',
          groupCount: parsedGroups.length,
          techniqueCount: parsedTechniques.length,
          version: 'latest (MITRE GitHub)',
          ...(mitreYear ? { mitreYear } : {}),
        };

        setGroups(parsedGroups);
        setLinks(parsedLinks);
        setTechniques(parsedTechniques);
        setMetadata(newMetadata);
        console.log(`[useAttackData] Done. groups=${parsedGroups.length}, techniques=${parsedTechniques.length}`);
      } else {
        // Dev server path — only works with `npm run dev`
        const apiRes = await fetch("/api/update-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source }),
        });
        const data = await apiRes.json();
        if (!apiRes.ok) throw new Error(data.error || "Update failed");
        await loadFromFiles();
      }
    } catch (e) {
      console.error('[useAttackData] triggerUpdate failed:', e);
      setError(e.message);
    }
    setLoading(false);
  }, [loadFromFiles]);

  const isStale = metadata?.lastUpdated &&
    (Date.now() - new Date(metadata.lastUpdated).getTime()) > 180 * 24 * 60 * 60 * 1000;

  return { groups, links, techniques, metadata, loading, error, isStale, loadFromFiles, triggerUpdate };
}
