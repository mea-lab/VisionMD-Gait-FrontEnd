// src/pages/TaskSelection/TasksWaveForm.jsx
import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/plugins/regions';
import HoverPlugin from 'wavesurfer.js/plugins/hover';
import { Slider } from '@mui/material';
import debounce from 'lodash/debounce';

const TasksWaveForm = ({
  setTasks,
  videoRef,
  tasks,
  taskBoxes,
  setTaskBoxes,
  isVideoReady,
  setTasksReady,
  tasksReady,
}) => {
  const waveformRef = useRef(null);
  const waveSurferRef = useRef(null);
  const regionsPluginRef = useRef(null);
  const ignoreRegionEventsRef = useRef(false);
  const tasksRef = useRef(tasks);

  const [waveLoading, setWaveLoading] = useState(false);
  const [loadPercent, setLoadPercent] = useState(0);
  const [waveSurferReady, setWaveSurferReady] = useState(false);

  const redrawRegions = () => {
    if (!regionsPluginRef.current) return;

    ignoreRegionEventsRef.current = true;
    regionsPluginRef.current.clearRegions();

    tasksRef.current.forEach(task => {
      regionsPluginRef.current.addRegion({
        id: task.id,
        start: task.start,
        end: task.end,
        content: `${task.name} #${task.id}`,
        drag: true,
        resize: true,
      });
    });

    ignoreRegionEventsRef.current = false;
  };
  const debouncedRedraw = useRef(debounce(redrawRegions, 120)).current;



  useEffect(() => {
    tasksRef.current = tasks;
    if (regionsPluginRef.current && waveSurferReady) debouncedRedraw();
  }, [tasks, waveSurferReady, debouncedRedraw]);

  useEffect(() => {
    if (!isVideoReady || !videoRef.current) return;

    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
      waveSurferRef.current = null;
    }

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'violet',
      progressColor: 'purple',
      cursorColor: 'navy',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 100,
      minPxPerSec: 100,
      autoScroll: true,
      normalize: true,
      media: videoRef.current,
    });

    waveSurferRef.current = ws;

    ws.on('loading', percent => {
      setLoadPercent(percent);
      setWaveLoading(true);
    });

    ws.on('ready', () => {
      setWaveLoading(false);
      setWaveSurferReady(true);

      const duration = videoRef.current?.duration || 1;
      ws.zoom(670 / duration);
    });

    regionsPluginRef.current = ws.registerPlugin(RegionsPlugin.create());
    ws.registerPlugin(HoverPlugin.create());
    regionsPluginRef.current.enableDragSelection({});

    regionsPluginRef.current.on('region-created', handleNewRegion);
    regionsPluginRef.current.on('region-updated', handleRegionUpdated);
    regionsPluginRef.current.on('region-update', handleRegionUpdate);

    return () => {
      debouncedRedraw.cancel();
      ws.destroy();
      waveSurferRef.current = null;
      regionsPluginRef.current = null;
      setWaveSurferReady(false);
    };
  }, [isVideoReady, videoRef]);


  const getHighestId = () =>
    tasksRef.current.reduce((max, t) => Math.max(max, t.id), 0);

  const handleNewRegion = region => {
    if (ignoreRegionEventsRef.current || region.content) return;

    const start = Number(region.start.toFixed(3));
    const end = Number(region.end.toFixed(3));
    const newId = getHighestId() + 1;

    region.setOptions({ 
      color: 'rgba(0, 0, 0, 0.0)',
      resize: false,
    });
    region.remove();
    

    const newTask = {
      id: newId,
      start,
      end,
      name: 'Region',
      data: null,
    };

    setTasks(prev => [...prev, newTask]);
    if (!tasksReady) setTasksReady(true);

    if (videoRef.current) videoRef.current.currentTime = start + 0.05;
  };

  const handleRegionUpdated = region => {
    if (ignoreRegionEventsRef.current) return;

    const start = Number(region.start.toFixed(3));
    const end = Number(region.end.toFixed(3));
    const original = tasksRef.current.find(t => t.id === region.id);
    if (!original) return;

    const changed =
      Math.abs(original.start - start) > 0.001 ||
      Math.abs(original.end - end) > 0.001;

    if (changed) {
      setTaskBoxes(prev => prev.filter(b => Number(b.id) !== region.id));
      setTasks(prev =>
        prev.map(t =>
          t.id === region.id ? { ...t, start, end, data: null } : t,
        ),
      );
    }

    if (videoRef.current) {
      videoRef.current.currentTime =
        Math.abs(original.start - start) > 0.001 ? start + 0.05 : end - 0.05;
    }
  };

  const handleRegionUpdate = region => {
    if (ignoreRegionEventsRef.current) return;
    if (!videoRef.current) return;

    const start = Number(region.start.toFixed(3));
    const end = Number(region.end.toFixed(3));
    const original = tasksRef.current.find(t => t.id === region.id);

    if (!original) return;

    if (Math.abs(original.start - start) > 0.001) {
      videoRef.current.currentTime = start;
    } else if (Math.abs(original.end - end) > 0.001) {
      videoRef.current.currentTime = end;
    }
  };


  const handleZoom = (_, zoom) => {
    if (!waveSurferReady || waveLoading) return;
    const duration = videoRef.current?.duration || 1;
    waveSurferRef.current.zoom((670 / duration) * zoom);
  };

  return (
    <div className="flex flex-col gap-2 justify-center items-center w-full border-t-2 pt-4 px-2">
      {isVideoReady && (
        <div className="w-full flex items-center justify-between px-8">
          <div className="font-semibold text-center">
            {waveLoading
              ? `Loading Waveform: ${Math.round(loadPercent)}%…`
              : 'Waveform'}
          </div>
          <Slider
            orientation="horizontal"
            min={1}
            max={10}
            step={0.1}
            style={{ width: 200 }}
            onChange={handleZoom}
            aria-label="Zoom"
            valueLabelDisplay="auto"
            valueLabelFormat={v => `${v}x`}
          />
        </div>
      )}
      <div
        id="waveform"
        className="w-full px-8 py-2 overflow-x-auto"
        ref={waveformRef}
      />
    </div>
  );
};

export default TasksWaveForm;
