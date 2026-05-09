import { useState, useCallback } from "react";

export const MITRE_STIX_URL =
  'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json';

// Bundled at build time — dist/index.html works offline without a server
import defaultGroups    from "../../public/data/groups.json";
import defaultLinks     from "../../public/data/relations.json";
import defaultTechniques from "../../public/data/techniques.json";
import defaultMetadata  from "../../public/data/metadata.json";

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
      console.error('[useAttackData] loadFromFiles error:', {
        type: e?.constructor?.name,
        message: e?.message,
        stack: e?.stack,
      });
      setError(e.message);
    }
    setLoading(false);
  }, []);

  const triggerUpdate = useCallback(async (source) => {
    setLoading(true);
    setError(null);
    console.log('[useAttackData] triggerUpdate start:', { source, href: window.location.href });
    try {
      // Step 1: POST to dev server endpoint
      let apiRes;
      try {
        apiRes = await fetch("/api/update-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source }),
        });
        console.log('[useAttackData] /api/update-data response:', {
          status: apiRes.status,
          ok: apiRes.ok,
          contentType: apiRes.headers.get('content-type'),
        });
      } catch (fetchErr) {
        console.error('[useAttackData] fetch("/api/update-data") threw:', {
          type: fetchErr?.constructor?.name,
          message: fetchErr?.message,
          stack: fetchErr?.stack,
        });
        throw fetchErr;
      }

      // Step 2: parse JSON response
      let data;
      try {
        data = await apiRes.json();
        console.log('[useAttackData] /api/update-data data:', data);
      } catch (jsonErr) {
        console.error('[useAttackData] apiRes.json() threw:', {
          type: jsonErr?.constructor?.name,
          message: jsonErr?.message,
          stack: jsonErr?.stack,
          status: apiRes.status,
          contentType: apiRes.headers.get('content-type'),
        });
        throw jsonErr;
      }

      if (!apiRes.ok) throw new Error(data.error || "Update failed");

      // Step 3: reload updated files
      await loadFromFiles();

    } catch (e) {
      console.error('[useAttackData] triggerUpdate failed:', {
        type: e?.constructor?.name,
        message: e?.message,
        stack: e?.stack,
      });
      setError(e.message);
    }
    setLoading(false);
  }, [loadFromFiles]);

  const isStale = metadata?.lastUpdated &&
    (Date.now() - new Date(metadata.lastUpdated).getTime()) > 180 * 24 * 60 * 60 * 1000;

  return { groups, links, techniques, metadata, loading, error, isStale, loadFromFiles, triggerUpdate };
}
