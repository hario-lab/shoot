import { useState, useCallback } from "react";

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
      setError(e.message);
    }
    setLoading(false);
  }, []);

  const triggerUpdate = useCallback(async (source) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/update-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      await loadFromFiles();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }, [loadFromFiles]);

  const isStale = metadata?.lastUpdated &&
    (Date.now() - new Date(metadata.lastUpdated).getTime()) > 180 * 24 * 60 * 60 * 1000;

  return { groups, links, techniques, metadata, loading, error, isStale, loadFromFiles, triggerUpdate };
}
