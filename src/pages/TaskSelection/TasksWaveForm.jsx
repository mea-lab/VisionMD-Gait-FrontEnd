//src/pages/TaskSelection/TasksWaveForm.jsx
import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/plugins/regions';
import HoverPlugin from 'wavesurfer.js/plugins/hover';
import { Slider } from '@mui/material';

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
  const [waveLoading, setWaveLoading] = useState(false);
  const [loadPercent, setLoadPercent] = useState(0);
  const [waveSurferReady, setWaveSurferReady] = useState(false);
  const tasksRef = useRef(tasks);
  
  const updateRegions = () => {
    if (regionsPluginRef.current) {
      ignoreRegionEventsRef.current = true;
      regionsPluginRef.current.clearRegions();
      tasks.forEach(task => {
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
    }
  };
  
  useEffect(() => {
    tasksRef.current = tasks;
    if (regionsPluginRef.current && waveSurferRef.current && waveSurferReady) {
      updateRegions();
    }
  }, [tasks, waveSurferReady]);
  
  const getWaveSurferOptions = () => ({
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
  
  // Initial zoom setup after WaveSurfer is ready
  const setInitialZoom = () => {
    const duration = videoRef.current?.duration || 1;
    const basePxPerSec = 670 / duration; // base pixels per second at 1x zoom
    waveSurferRef.current.zoom(basePxPerSec);
  };
  
  const getHighestId = () =>
    tasksRef.current.reduce((max, t) => Math.max(max, t.id), 0);
  
  const handleNewRegion = (region) => {
    if (ignoreRegionEventsRef.current || region.content) return;
    
    const startTime = parseFloat(region.start.toFixed(3));
    const endTime = parseFloat(region.end.toFixed(3));
    const newId = getHighestId() + 1;
    const regionName = `Region ${newId}`;
    
    // Hide original region
    region.setOptions({ 
      color: 'rgba(0, 0, 0, 0.0)',
      resize: false,
    });
    region.remove();
    
    const newTask = { id: newId, start: startTime, end: endTime, name: regionName, data: null };
    videoRef.current.currentTime = startTime + 0.05;
    setTasks(prev => [...prev, newTask]);
    if (!tasksReady) setTasksReady(true);
  };
  
  const handleRegionUpdated = (region) => {
    if (ignoreRegionEventsRef.current) return;
    
    const startTime = parseFloat(region.start.toFixed(3));
    const endTime = parseFloat(region.end.toFixed(3));
    const taskToUpdate = tasksRef.current.find(t => t.id === region.id);
    
    if (!taskToUpdate) return;
    
    const startChanged = Math.abs(taskToUpdate.start - startTime) > 0.001;
    const endChanged = Math.abs(taskToUpdate.end - endTime) > 0.001;
    
    if (startChanged || endChanged) {
      setTaskBoxes(prev =>
        prev.filter(b => Number(b.id) !== Number(region.id))
      );
      setTasks(prev =>
        prev.map(task =>
          task.id === region.id
            ? { ...task, start: startTime, end: endTime, data: null }
            : task
        )
      );
    }
    
    if (startChanged) {
      if (videoRef.current) {
        videoRef.current.currentTime = startTime + 0.05;
      }
    } else if (endChanged) {
      if (videoRef.current) {
        videoRef.current.currentTime = endTime - 0.05;
      }
    }
  };

  const handleRegionUpdate = (region, event) => {
    if (ignoreRegionEventsRef.current) return;
  
    const startTime = parseFloat(region.start.toFixed(3));
    const endTime = parseFloat(region.end.toFixed(3));
    const taskToUpdate = tasksRef.current.find(t => t.id === region.id);
  
    if (!taskToUpdate) return;
  
    const startChanged = Math.abs(taskToUpdate.start - startTime) > 0.001;
    const endChanged = Math.abs(taskToUpdate.end - endTime) > 0.001;
    if (startChanged) {
      if (videoRef.current) {
        videoRef.current.currentTime = startTime;
      }
    } else if (endChanged) {
      if (videoRef.current) {
        videoRef.current.currentTime = endTime;
      }
    }
  };
  
  useEffect(() => {
    if (!isVideoReady || !videoRef.current) return;
    
    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
    }
    
    waveSurferRef.current = WaveSurfer.create(getWaveSurferOptions());
    
    waveSurferRef.current.on('loading', percent => {
      setLoadPercent(percent);
      setWaveLoading(true);
    });
    
    waveSurferRef.current.on('ready', () => {
      setWaveLoading(false);
      setWaveSurferReady(true);
      setInitialZoom();
    });
    
    regionsPluginRef.current = waveSurferRef.current.registerPlugin(
      RegionsPlugin.create()
    );
    
    regionsPluginRef.current.enableDragSelection({});
    waveSurferRef.current.registerPlugin(HoverPlugin.create({}));
    
    regionsPluginRef.current.on('region-created', handleNewRegion);
    regionsPluginRef.current.on('region-updated', handleRegionUpdated);
    regionsPluginRef.current.on('region-update', handleRegionUpdate);
    
    return () => {
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
        waveSurferRef.current = null;
        setWaveSurferReady(false);
      }
    };
  }, [isVideoReady, videoRef]);
  
  const onZoomChange = (event, zoomLevel) => {
    if (isVideoReady && waveSurferRef.current && !waveLoading) {
      const duration = videoRef.current?.duration || 1;
      const basePxPerSec = 670 / duration; // base pixel-per-second value
      waveSurferRef.current.zoom(basePxPerSec * zoomLevel);
    }
  };

  return (
    <div className="flex flex-col gap-2 justify-center items-center w-full border-t-2 pt-4 px-2">
      {isVideoReady && (
        <div className="w-full flex items-center justify-between px-8">
          <div className="font-semibold text-center">
            {waveLoading
              ? `Loading Waveform: ${Math.round(loadPercent)}%...`
              : 'Waveform'}
          </div>
          <Slider
            orientation="horizontal"
            min={1}
            max={10}
            step={0.1}
            style={{ width: 200 }}
            onChange={onZoomChange}
            aria-label="Zoom"
            valueLabelDisplay="auto"
            valueLabelFormat={value => `${value}x`}
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
