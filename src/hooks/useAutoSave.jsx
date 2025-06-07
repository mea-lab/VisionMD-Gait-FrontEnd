import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const DEBOUNCE_MS = 500;

const serialize = (value) => {
  const stable = (v) =>
    v && typeof v === "object"
      ? Array.isArray(v)
        ? v.map(stable)
        : Object.keys(v)
            .sort()
            .reduce((acc, k) => {
              acc[k] = stable(v[k]);
              return acc;
            }, {})
      : v;
  return JSON.stringify(stable(value));
};

export function useAutoSave(
  videoId,
  persons,
  boundingBoxes,
  tasks,
  taskBoxes
) {
  const location = useLocation();          // ← you were missing this line
  const lastSavedRef   = useRef({});
  const latestSlicesRef = useRef({});

  /* keep a ref in sync with whatever the props are right now */
  useEffect(() => {
    latestSlicesRef.current = { persons, boundingBoxes, taskBoxes, tasks };
  });

  /* reset snapshot cache when video changes */
  useEffect(() => {
    lastSavedRef.current = {};
  }, [videoId]);

  /* stable saveSlice that *reads* from latestSlicesRef */
  const saveSlice = useCallback(async (key, value) => {
    if (!videoId) return;

    const snapshot = serialize(value);
    if (snapshot === lastSavedRef.current[key]) return; // nothing changed
    lastSavedRef.current[key] = snapshot;

    console.log(`[Autosave] Saving "${key}" …`);
    try {
      await fetch(
        `${API_URL}/update_video_data/?id=${videoId}&file_name=${key}.json`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: snapshot,
        }
      );
      lastSavedRef.current[key] = snapshot;
    } catch (err) {
      console.error("[Autosave]", err);
    }
  }, [videoId]);

  /*  stable flush that pulls the CURRENT slices from the ref */
  const flush = useCallback(() => {
    const { persons, boundingBoxes, taskBoxes, tasks } =
      latestSlicesRef.current;

    const slices = { persons, boundingBoxes, taskBoxes, tasks };

    Object.entries(slices).forEach(([key, value]) => {
      const nonEmpty = Array.isArray(value)
        ? value.length
        : value && Object.keys(value).length;
      if (nonEmpty) saveSlice(key, value);
    });
  }, [saveSlice]);

  const debouncedFlush = useDebouncedCallback(flush, DEBOUNCE_MS);

  /*   run ONLY when the route changes */
  useEffect(() => {
    debouncedFlush();
    return debouncedFlush.cancel;
  }, [location.pathname, debouncedFlush, serialize(tasks.map(t => t.data))]);   // ← nothing else here

  /*  also run on hard reload / tab close */
  useEffect(() => {
    const handler = () => flush();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [flush]);
}
