//src/pages/TaskDetails/index.jsx
import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  Suspense,
} from 'react';
import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
import { VideoContext } from '../../contexts/VideoContext';
import HeaderSection from './HeaderSection';
import JSONUploadDialog from './JSONUploadDialog';
import { useNavigate } from 'react-router-dom';

import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { CircularProgress } from '@mui/material';

const TaskDetails = () => {
  const {
    videoId,
    videoReady,
    setVideoReady,
    videoData,
    setVideoData,
    videoURL,
    videoRef,
    fileName,
    boundingBoxes,
    setBoundingBoxes,
    fps,
    taskBoxes,
    setTaskBoxes,
    tasks,
    setTasks,
    persons,
  } = useContext(VideoContext);

  const [openJsonUpload, setOpenJsonUpload] = useState(false);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [selectedTask, setSelectedTask] = useState(0);
  const [TaskModule, setTaskModule] = useState(null);

  /* ▼ dropdown state for “Download All” ▼ */
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  /* ▲-----------------------------------▲ */

  const navigate = useNavigate();

  /* close the dropdown on outside-click */
  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  /* load per-task module */
  useEffect(() => {
    if (!videoReady) return;
    if (!tasks || !tasks[selectedTask]) return;
    if (!videoId) navigate('/');

    const task = tasks[selectedTask];
    const taskName = task.name;
    const fileNameSafe = taskName.toLowerCase().split(' ').join('_');

    import(`./Tasks/${fileNameSafe}.jsx`)
      .then(mod => {
        setTaskModule(() => mod.default);
      })
      .catch(err => {
        console.error(`Couldn’t load task module ${taskName}:`, err);
        setTaskModule(null);
      });
  }, [selectedTask, videoReady, videoRef]);

  const handleProcessing = (jsonFileUploaded, jsonContent) => {
    if (jsonFileUploaded && jsonContent) {
      setTasks(prev => {
        const newTasks = [...prev];
        newTasks[selectedTask] = {
          ...newTasks[selectedTask],
          data: { ...jsonContent },
        };
        return newTasks;
      });
    }
  };

  const resetTask = () => {
    setTasks(prev => {
      const newTasks = [...prev];
      newTasks[selectedTask] = { ...newTasks[selectedTask], data: null };
      return newTasks;
    });
  };

  const autoAnalyzeTask = async taskIndex => {
    const videoURL = videoRef.current.src;
    const videoBlob = await fetch(videoURL).then(r => r.blob());

    const taskData = tasks[taskIndex];
    const chosenTaskBox = taskBoxes.find(box => box.id === taskData.id);
    const taskBoxCords = {
      x: chosenTaskBox.x,
      y: chosenTaskBox.y,
      width: chosenTaskBox.width,
      height: chosenTaskBox.height,
    };

    const { start, end, name, data, ...otherTaskFields } = taskData;
    const jsonData = JSON.stringify({
      boundingBox: taskBoxCords,
      task_name: name,
      start_time: start,
      end_time: end,
      fps,
      ...otherTaskFields,
    });

    const form = new FormData();
    form.append('video', videoBlob);
    form.append('json_data', jsonData);

    const sanitizedTaskName = name
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(w => w.toLowerCase())
      .join('_');

    const apiURL = `http://localhost:8000/api/${sanitizedTaskName}/`;
    const res = await fetch(apiURL, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`${name} failed with status ${res.status}`);

    const result = await res.json();
    const safeFileName = fileName.replace(/\.[^/.]+$/, '');

    setTasks(prev => {
      const next = [...prev];
      next[taskIndex] = {
        ...next[taskIndex],
        data: { ...result, fileName: safeFileName },
      };
      return next;
    });
  };

  const analyzeAllTasks = async () => {
    setAnalyzingAll(true);
    for (let i = 0; i < tasks.length; i++) {
      if (!tasks[i]?.data) {
        try {
          await autoAnalyzeTask(i);
        } catch (err) {
          console.error(err);
        }
      }
    }
    setAnalyzingAll(false);
  };

  const DownloadCurrentTask = () => {
    const currentTask = tasks[selectedTask];
    const fileData = currentTask.data;
    const jsonStr = JSON.stringify(fileData);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${fileName.replace(/\.[^/.]+$/, '')}_${currentTask.name}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const downloadAllTasks = () => {
    tasks.forEach(task => {
      if (!task?.data) return;
      const jsonStr = JSON.stringify(task.data);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `${fileName.replace(/\.[^/.]+$/, '')}_${task.name}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    });
  };

  /* Tailwind button base */
  const btn =
    'bg-[#1976d2] hover:bg-[#1565c0] text-white font-medium px-3 py-1 ' +
    'rounded-md inline-flex items-center gap-1 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        {/* ─── Video Player ───────────────────────────── */}
        <div className="flex-1 min-w-[50%] bg-slate-900">
          <VideoPlayer
            videoURL={videoURL}
            videoData={videoData}
            videoRef={videoRef}
            screen="taskDetails"
            boundingBoxes={boundingBoxes}
            setBoundingBoxes={setBoundingBoxes}
            taskBoxes={taskBoxes}
            fps={fps}
            persons={persons}
            setVideoReady={setVideoReady}
            setVideoData={setVideoData}
            fileName={fileName}
            landMarks={tasks[selectedTask]?.data?.landMarks}
            setTaskBoxes={setTaskBoxes}
            selectedTask={selectedTask}
            tasks={tasks}
            setTasks={setTasks}
          />
        </div>

        {/* ─── Right-hand Pane ───────────────────────── */}
        <div className="flex-1 flex flex-col min-w-[50%] bg-slate-50 overflow-y-auto">
          <HeaderSection
            title="Task Details"
            isVideoReady={videoReady}
            fileName={fileName}
            fps={fps}
            boundingBoxes={boundingBoxes}
          />

          {/* ─── Toolbar ─────────────────────────────── */}
          <div className="flex items-center justify-center gap-2 mt-2 mb-4">
            <div className="text-lg font-bold">Current task&nbsp;-</div>

            {/* task selector */}
            <select
              className="text-lg border border-gray-300 rounded-md px-2 py-1"
              value={selectedTask}
              onChange={e => setSelectedTask(Number(e.target.value))}
            >
              {tasks.map((task, index) => (
                <option key={index} value={index}>
                  {task.id}. {task.name}
                </option>
              ))}
            </select>

            {/* Reset */}
            <button className={btn} onClick={resetTask}>
              <RestartAltIcon fontSize="small" />
              Reset
            </button>

            {/* ── Split Download button ── */}
            <div className="relative inline-flex" ref={dropdownRef}>
              {/* main download */}
              <button
                className={`${btn} rounded-r-none border-r border-blue-800`}
                onClick={DownloadCurrentTask}
                disabled={!tasks[selectedTask]?.data}
              >
                <CloudDownloadIcon fontSize="small" />
                Download
              </button>

              {/* arrow trigger */}
              <button
                className={`${btn} rounded-l-none px-2`}
                onClick={() => setDropdownOpen(prev => !prev)}
                disabled={!tasks.some(t => t?.data)}
              >
                <ArrowDropDownIcon fontSize="small" />
              </button>

              {/* dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-md z-20">
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 disabled:opacity-50"
                    onClick={() => {
                      downloadAllTasks();
                      setDropdownOpen(false);
                    }}
                    disabled={!tasks.some(t => t?.data)}
                  >
                    Download All
                  </button>
                </div>
              )}
            </div>

            {/* Analyze All */}
            <button
              className={btn}
              onClick={analyzeAllTasks}
              disabled={analyzingAll || !tasks.some(t => t.data == null)}
            >
              Analyze All
            </button>

            {analyzingAll && (
              <CircularProgress
                size={28}
                sx={{ color: '#2563eb' /* blue-600 */ }}
              />
            )}
          </div>

          {/* ─── Body ────────────────────────────────── */}
          {!tasks[selectedTask]?.data ? (
            <div className="flex justify-center items-center h-full flex-col gap-4 w-full px-10 flex-1 py-4 overflow-y-scroll">
              <div>Analyze the task</div>
              <button
                className={`${btn} text-base`}
                onClick={() => setOpenJsonUpload(true)}
              >
                Analyze
              </button>
              <JSONUploadDialog
                dialogOpen={openJsonUpload}
                fps={fps}
                setDialogOpen={setOpenJsonUpload}
                handleJSONUpload={handleProcessing}
                boundingBoxes={boundingBoxes}
                videoRef={videoRef}
                tasks={tasks}
                taskBoxes={taskBoxes}
                selectedTask={selectedTask}
              />
            </div>
          ) : (
            <>
              {TaskModule && (
                <TaskModule
                  selectedTaskIndex={selectedTask}
                  tasks={tasks}
                  setTasks={setTasks}
                  fileName={fileName}
                  videoRef={videoRef}
                  startTime={taskBoxes[selectedTask].start}
                  endTime={taskBoxes[selectedTask].end}
                  handleJSONUpload={handleProcessing}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
