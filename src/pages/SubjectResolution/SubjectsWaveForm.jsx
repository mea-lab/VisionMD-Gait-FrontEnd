import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import HoverPlugin from 'wavesurfer.js/plugins/hover';
import { Slider } from '@mui/material';

const SubjectsWaveForm = ({ videoRef, isVideoReady }) => {
  const waveformRef = useRef(null);
  const waveSurfer = useRef(null);
  const [loadPercent, setLoadPercent] = useState(0);
  const [waveLoading, setWaveLoading] = useState(false);
  
  const onZoomChange = (zoomLevel) => {
    if (isVideoReady && waveSurfer.current && !waveLoading) {
      const duration = videoRef.current?.duration || 1;
      const pxPerSec = (670 / duration) * zoomLevel;
      waveSurfer.current.zoom(pxPerSec);
    }
  };

  const getWaveSurferOptions = () => {
    const duration = videoRef.current.duration;
    return {
      container: waveformRef.current,
      waveColor: 'violet',
      progressColor: 'purple',
      cursorColor: 'navy',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 100,
      backend: 'MediaElement',
      media: videoRef.current,
      mediaType: 'video',
      normalize: true,
      zoom: true,
      scrollParent: true,
      minPxPerSec: 680 / duration,
    };
  };

  // Initial zoom setup after waveSurfer is ready
  const setInitialZoom = () => {
    const duration = videoRef.current?.duration || 1;
    const pxPerSec = (670 / duration) * 1;
    waveSurfer.current.zoom(pxPerSec);
  };

  useEffect(() => {
    if (!isVideoReady || !videoRef?.current) return;

    if (waveSurfer.current) {
      waveSurfer.current.destroy();
    }

    waveSurfer.current = WaveSurfer.create(getWaveSurferOptions());
    waveSurfer.current.registerPlugin(HoverPlugin.create({}));

    waveSurfer.current.on('loading', percent => {
      setLoadPercent(percent);
      setWaveLoading(true);
    });

    waveSurfer.current.on('ready', () => {
      setWaveLoading(false);
      setInitialZoom();  // Ensure initial zoom level after waveform is ready
    });

    return () => {
      waveSurfer.current?.destroy();
    };
  }, [isVideoReady, videoRef]);

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
            onChange={(e) => onZoomChange(e.target.value)}
            aria-label="Zoom"
            valueLabelDisplay="auto"
            valueLabelFormat={value => `${value}x`}
          />
        </div>
      )}
      <div
        id="waveform"
        className="w-full px-8 py-2 overflow-x-auto" // Change from overflow-x-scroll to overflow-x-auto
        ref={waveformRef}
      />
    </div>
  );
};

export default SubjectsWaveForm;
