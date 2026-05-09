import { useState, useCallback } from "react";

// Bundled at build time — dist/index.html works offline without a server
import defaultGroups    from "../../public/data/groups.json";
import defaultLinks     from "../../public/data/relations.json";
import defaultTechniques from "../../public/data/techniques.json";
import defaultMetadata  from "../../public/data/metadata.json";

const MITRE_STIX_URL =
  'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack-19.0.json';

// ── Client-side STIX parser (mirrors scripts/process-data.mjs) ──────────────
const COUNTRY_KW = [
  ['CN', ["china","chinese","prc","people's republic of china","apt1","apt10","apt17","apt19","apt30","apt40","apt41","volt typhoon","chimera","mustang panda"]],
  ['RU', ["russia","russian","fsb","gru","svr","sandworm","apt28","apt29","turla","gamaredon","dragonfly"]],
  ['NK', ["north korea","dprk","korean people","lazarus","kimsuky"]],
  ['IR', ["iran","iranian","irgc","oilrig","magic hound","apt33","apt34","apt35"]],
  ['VN', ["vietnam","vietnamese","apt32","ocean lotus"]],
];
const COUNTRY_META_STIX = {
  CN:{flag:'🇨🇳',name:'China',color:'#ef4444'},
  RU:{flag:'🇷🇺',name:'Russia',color:'#3b82f6'},
  NK:{flag:'🇰🇵',name:'North Korea',color:'#a855f7'},
  IR:{flag:'🇮🇷',name:'Iran',color:'#f97316'},
  VN:{flag:'🇻🇳',name:'Vietnam',color:'#22c55e'},
  UNK:{flag:'🏴',name:'Unknown',color:'#6b7280'},
};
function inferCountry(name = '', desc = '') {
  const h = (name + ' ' + desc).toLowerCase();
  for (const [code, kws] of COUNTRY_KW)
    if (kws.some(k => h.includes(k))) return { code, ...COUNTRY_META_STIX[code] };
  return { code: 'UNK', ...COUNTRY_META_STIX.UNK };
}
function parseStixBundle(bundle) {
  const byId = {};
  for (const o of bundle.objects) byId[o.id] = o;
  const getMitreId = o =>
    o.external_references?.find(r => r.source_name === 'mitre-attack')?.external_id ?? null;

  const techByStixId = {}, techById = {};
  for (const t of bundle.objects.filter(o => o.type === 'attack-pattern' && !o.revoked && !o.x_mitre_deprecated)) {
    const id = getMitreId(t); if (!id) continue;
    const obj = {
      stixId: t.id, id, name: t.name,
      description: (t.description || '').slice(0, 120),
      tactics: (t.kill_chain_phases || []).filter(p => p.kill_chain_name === 'mitre-attack').map(p => p.phase_name),
      platforms: t.x_mitre_platforms || [],
      isSubtechnique: t.x_mitre_is_subtechnique || false,
    };
    techByStixId[t.id] = obj; techById[id] = obj;
  }
  const subsByParent = {};
  for (const t of Object.values(techById)) {
    if (!t.isSubtechnique) continue;
    const pid = t.id.split('.')[0];
    (subsByParent[pid] || (subsByParent[pid] = [])).push(t);
  }
  const groupTechs = {};
  for (const r of bundle.objects) {
    if (r.type !== 'relationship' || r.relationship_type !== 'uses') continue;
    if (byId[r.source_ref]?.type !== 'intrusion-set' || byId[r.target_ref]?.type !== 'attack-pattern') continue;
    (groupTechs[r.source_ref] || (groupTechs[r.source_ref] = new Set())).add(r.target_ref);
  }
  const groups = [];
  for (const g of bundle.objects.filter(o => o.type === 'intrusion-set' && !o.revoked && !o.x_mitre_deprecated)) {
    const id = getMitreId(g); if (!id) continue;
    const allTechs = [...(groupTechs[g.id] || [])].map(s => techByStixId[s]).filter(Boolean);
    const usedPids = new Set(), usedSids = new Set();
    for (const t of allTechs) {
      if (t.isSubtechnique) { usedSids.add(t.id); usedPids.add(t.id.split('.')[0]); }
      else usedPids.add(t.id);
    }
    const techniques = [...usedPids].map(p => techById[p]).filter(Boolean).map(p => ({
      id: p.id, name: p.name, description: p.description,
      tactics: p.tactics, platforms: p.platforms,
      subs: (subsByParent[p.id] || []).filter(s => usedSids.has(s.id))
            .map(s => ({ id: s.id, name: s.name, description: s.description })),
    }));
    groups.push({ id, name: g.name, aliases: g.aliases || [g.name],
      description: (g.description || '').slice(0, 300),
      country: inferCountry(g.name, g.description || ''), techniques });
  }
  groups.sort((a, b) => b.techniques.length - a.techniques.length);
  return groups;
}
function computeLinksClient(groups) {
  const links = [];
  for (let i = 0; i < groups.length; i++) {
    const A = new Set(groups[i].techniques.map(t => t.id));
    for (let j = i + 1; j < groups.length; j++) {
      const shared = groups[j].techniques.map(t => t.id).filter(id => A.has(id));
      if (shared.length >= 5)
        links.push({ source: groups[i].id, target: groups[j].id, value: shared.length, shared: shared.slice(0, 10) });
    }
  }
  return links.sort((a, b) => b.value - a.value);
}
function buildTechIndex(groups) {
  const m = {};
  for (const g of groups)
    for (const t of g.techniques)
      if (!m[t.id]) m[t.id] = { id: t.id, name: t.name, description: t.description, tactics: t.tactics, platforms: t.platforms };
  return Object.values(m);
}
// ────────────────────────────────────────────────────────────────────────────

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
      setGroups(g); setLinks(l); setTechniques(t); setMetadata(m);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  const triggerUpdate = useCallback(async (source) => {
    setLoading(true);
    setError(null);
    try {
      if (source === 'mitre') {
        // Direct browser fetch — works on GitHub Pages, file://, and dev server
        const res = await fetch(MITRE_STIX_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching MITRE data`);
        const bundle = await res.json();
        const groups = parseStixBundle(bundle);
        const links  = computeLinksClient(groups);
        const techs  = buildTechIndex(groups);
        const col    = bundle.objects?.find(o => o.type === 'x-mitre-collection');
        const modStr = col?.modified
          ?? bundle.objects?.map(o => o.modified).filter(Boolean).sort().at(-1);
        const mitreYear = modStr ? new Date(modStr).getFullYear() : null;
        setGroups(groups);
        setLinks(links);
        setTechniques(techs);
        setMetadata({
          lastUpdated: new Date().toISOString(),
          source: 'mitre',
          groupCount: groups.length,
          techniqueCount: techs.length,
          version: 'latest (MITRE GitHub)',
          ...(mitreYear ? { mitreYear } : {}),
        });
      } else {
        // 'local' source — requires dev server (`npm run dev`)
        const res = await fetch("/api/update-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
        await loadFromFiles();
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [loadFromFiles]);

  const isStale = metadata?.lastUpdated &&
    (Date.now() - new Date(metadata.lastUpdated).getTime()) > 180 * 24 * 60 * 60 * 1000;

  return { groups, links, techniques, metadata, loading, error, isStale, loadFromFiles, triggerUpdate };
}
