import React, { useContext, useEffect, useRef, useState, Suspense } from 'react';
import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
import { VideoContext } from '../../contexts/VideoContext';
import HeaderSection from './HeaderSection';
import Button from '@mui/material/Button';
import JSONUploadDialog from './JSONUploadDialog';
import { RestartAlt, CloudDownload } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';

const TaskDetails = () => {

  const {
    videoId,
    videoReady,
    setVideoReady,
    videoData,
    setVideoData,
    videoURL,
    setVideoURL,
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

  const navigate = useNavigate();
  if(!videoId) {
    navigate("/")
  }


  useEffect(() => {
    if (!videoReady) return;
    if (!tasks || !tasks[selectedTask]) return;

    const task = tasks[selectedTask];
    const taskName = task.name;
    const fileName = taskName
      .toLowerCase()
      .split(' ')
      .join('_');

    import(`./Tasks/${fileName}.jsx`)
      .then(mod => {
        setTaskModule(() => mod.default)
      })
      .catch(err => {
        console.error(`Couldn’t load task module ${taskName}:`, err)
        setTaskModule(null)
    })

    videoRef.current.currentTime = task.start;
    videoRef.current.ontimeupdate = event => {
      if (event.target.currentTime >= task.end) {
        videoRef.current.currentTime = task.start;
      }
      if (event.target.currentTime < task.start) {
        videoRef.current.currentTime = task.start;
      }
    };
  }, [selectedTask, videoReady, videoRef]);




  const handleProcessing = (jsonFileUploaded, jsonContent) => {
    if (jsonFileUploaded && jsonContent) {
      const safeFileName = fileName.replace(/\.[^/.]+$/, '');
      setTasks(prev => {
        const newTasks = [...prev];
        newTasks[selectedTask] = { ...newTasks[selectedTask], data: { ...jsonContent, fileName: safeFileName } };
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
      next[taskIndex] = { ...next[taskIndex], data: { ...result, fileName: safeFileName } };
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
    const downloadContent = {
      linePlot: fileData.linePlot,
      velocityPlot: fileData.velocityPlot,
      rawData: fileData.rawData,
      peaks: fileData.peaks,
      valleys: fileData.valleys,
      valleys_start: fileData.valleys_start,
      valleys_end: fileData.valleys_end,
      radar: { ...fileData.radar },
      radarTable: fileData.radarTable,
      landMarks: fileData.landMarks,
      allLandMarks: fileData.allLandMarks,
      normalization_landmarks: fileData.normalizationLandMarks,
      normalization_factor: fileData.normalizationFactor,
    };
    const jsonStr = JSON.stringify(downloadContent);
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



  const commonButtonStyle = {
    bgcolor: 'primary.main',
    '&:hover': { bgcolor: 'primary.dark' },
    textTransform: 'none',
    fontWeight: 'bold',
    px: 3,
    py: 1,
  };

  console.log("All tasks", tasks)


  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        
        {/* Start Video Player */}
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
        {/* End Video Player */}


        {/* Start Task Details */}
        <div className="flex-1 flex flex-col min-w-[50%] bg-slate-50 overflow-y-auto">

          {/* Start Header */}
          <HeaderSection
            title="Task Details"
            isVideoReady={videoReady}
            fileName={fileName}
            fps={fps}
            boundingBoxes={boundingBoxes}
          />
          {/* End Header */}


          {/* Start Task Header */}
          <div className="flex items-center justify-center gap-2 mt-2 mb-4">
            <div className="text-lg font-bold">Current task -</div>

            {/* Start Task Selector */}
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
            {/* End Task Selector */}
            
            {/* Start Reset Button */}
            <Button variant="contained" onClick={resetTask} startIcon={<RestartAlt />} sx={commonButtonStyle}>
              Reset
            </Button>
            {/* End Reset Button */}
            
            {/* Start Download Button */}
            <Button
              variant="contained"
              onClick={DownloadCurrentTask}
              startIcon={<CloudDownload />}
              sx={commonButtonStyle}
              disabled={!tasks[selectedTask]?.data}
            >
              Download
            </Button>
            {/* End Download Button */}

            {/*Start Analyze all button */}
         
            <Button
              variant="contained"
              onClick={analyzeAllTasks}
              sx={commonButtonStyle}
              disabled={analyzingAll || !tasks.some(t => t.data == null)}
            >
              Analyze All
            </Button>
          
            {analyzingAll && <CircularProgress size={28} />}
            {/*End Analyze all button */}

          </div>
          {/* End Task Header */}

          {!tasks[selectedTask]?.data ? (
            <div className="flex justify-center items-center h-full flex-col gap-4 w-full px-10 flex-1 py-4 overflow-y-scroll">
              <div>Analyze the task</div>
              <Button
                variant="contained"
                onClick={() => setOpenJsonUpload(true)}
                sx={{ ...commonButtonStyle, fontSize: '1rem' }}
              >
                Analyze
              </Button>
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
        {/* End Task Details */}

      </div>
    </div>
  );
};

export default TaskDetails;
