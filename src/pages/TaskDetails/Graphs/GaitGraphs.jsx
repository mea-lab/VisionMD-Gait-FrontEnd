import React, { useMemo, useRef, useEffect, useState } from "react";
import UplotReact from "uplot-react";
import "uplot/dist/uPlot.min.css";

const GaitGraphs = ({ selectedTaskIndex, tasks, videoRef }) => {
  /* ---------- robust task / signal lookup ---------- */
  const task    = tasks?.[selectedTaskIndex] ?? {};
  const signals = task.data?.signals ?? {};
  const start   = task.start ?? 0;
  const end     = task.end   ?? 0;
  const names   = Object.keys(signals);

  /* ---------- state ---------- */
  const [selectedName, setSelectedName] = useState(() => names[0] ?? "");

  /* keep selectedName in sync with names array */
  useEffect(() => {
    if (!selectedName && names.length)         setSelectedName(names[0]);
    else if (selectedName && !names.includes(selectedName))
                                               setSelectedName(names[0] ?? "");
  }, [names, selectedName]);

  /* ---------- refs ---------- */
  const chartRef = useRef(null);

  /* ---------- derived time axis ---------- */
  const time = useMemo(() => {
    if (!selectedName) return [];
    const n = signals[selectedName]?.length ?? 0;
    const dt = n > 1 ? (end - start) / (n - 1) : 0;
    return Array.from({ length: n }, (_, i) => start + i * dt);
  }, [selectedName, start, end, signals]);

  /* ---------- dbl-click play / pause ---------- */
  const toggle = () => {
    const v = videoRef?.current;
    if (v) v.paused ? v.play() : v.pause();
  };

  /* ---------- sync cursor with video ---------- */
  useEffect(() => {
    const vid = videoRef?.current;
    if (!vid || !selectedName) return;

    const step = () => {
      const c = chartRef.current;
      if (c) c.setCursor({ left: c.valToPos(vid.currentTime, "x") });
      vid.requestVideoFrameCallback(step);
    };
    vid.requestVideoFrameCallback(step);
  }, [videoRef, selectedName]);

  if (!selectedName) return null;               // nothing to draw yet

  const axisLabel = selectedName
    .split("_")
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="flex flex-col gap-8 items-center mx-4">
      <div
        className="bg-white flex flex-col items-center rounded-lg p-4"
        onDoubleClick={toggle}
        style={{ position: "relative" }}
      >
        <select
          value={selectedName}
          onChange={e => setSelectedName(e.target.value)}
          className="mb-4 bg-white cursor-pointer"
        >
          {names.map(n => {
            const lbl = n
              .split("_")
              .map(w => w[0].toUpperCase() + w.slice(1))
              .join(" ");
            return <option key={n} value={n}>{lbl} over Time</option>;
          })}
        </select>

        <UplotReact
          options={{
            width: 600,
            height: 320,
            scales: { x: { time: false, min: start, max: end } },
            legend: { show: false },
            axes: [
              {
                label: "Time (s)",
                values: (_, vals) => vals.map(v => v.toFixed(2)),
                grid: { show: true }, ticks: { show: true }, stroke: "#666",
              },
              {
                label: axisLabel,
                grid: { show: true }, ticks: { show: true }, stroke: "#666",
              },
            ],
            series: [
              {},
              { stroke: "#1f77b4", width: 2, points: { show: true, size: 4 } },
            ],
            cursor: { drag: { x: true }, x: true, y: false },
          }}
          data={[time, signals[selectedName] ?? []]}
          onCreate={c => { chartRef.current = c; }}
          onDelete={() => { chartRef.current = null; }}
        />
      </div>
    </div>
  );
};

export default GaitGraphs;
