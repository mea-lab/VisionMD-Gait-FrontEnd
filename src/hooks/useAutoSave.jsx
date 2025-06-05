// src/hooks/useAutoSave.js
import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';

const API_URL = import.meta.env.VITE_API_BASE_URL;
const DEBOUNCE_MS = 500;

// Create a stable JSON string so object‑key order does not affect equality checks
const serialize = (value) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "object" && !Array.isArray(value)) {
    const sorted = Object.keys(value)
      .sort()
      .reduce((acc, k) => {
        acc[k] = value[k];
        return acc;
      }, {});
    return JSON.stringify(sorted);
  }
  return JSON.stringify(value);
};

// Hook to autosave data when route changes (SPA navigation) or the window is about to unload
export function useAutoSave(
  videoId,
  persons,
  boundingBoxes,
  tasks,
  taskBoxes,
) {
  const lastSavedRef = useRef({});

  // Whenever we switch to a new video, clear the snapshot cache so everything is saved once
  useEffect(() => {
    lastSavedRef.current = {};
  }, [videoId]);

  // Save a single slice of data — but ONLY if it changed since the last successful save
  const saveSlice = useCallback(
    async (key, value) => {
      if (!videoId) return;

      const snapshot = serialize(value);
      if (snapshot === lastSavedRef.current[key]) return; // nothing changed

      console.log(`[Autosave] Saving \"${key}\" …`);
      try {
        await fetch(`${API_URL}/update_video_data/?id=${videoId}&file_name=${key}.json`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: snapshot,
        });
        // Update the local snapshot only after the request succeeds
        lastSavedRef.current[key] = snapshot;
      } catch (err) {
        console.error("[Autosave]", err);
      }
    },
    [videoId],
  );

  // Flush all non‑empty slices of data
  const flush = useCallback(() => {
    const slices = { persons, boundingBoxes, taskBoxes, tasks };

    Object.entries(slices).forEach(([key, value]) => {
      const nonEmpty = Array.isArray(value)
        ? value.length
        : value && Object.keys(value).length;
      if (nonEmpty) saveSlice(key, value);
    });
  }, [persons, boundingBoxes, taskBoxes, tasks, saveSlice]);

  const debouncedFlush = useDebouncedCallback(flush, DEBOUNCE_MS);

  // Fire on route change (SPA)
  const location = useLocation();
  const firstNav = useRef(true);
  useEffect(() => {
    if (firstNav.current) {
      firstNav.current = false;
      return;
    }
    debouncedFlush();
    return debouncedFlush.cancel;
  }, [location.pathname, debouncedFlush]);

  // Fire on hard reload or close
  useEffect(() => {
    const handler = () => flush();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [flush]);
}
