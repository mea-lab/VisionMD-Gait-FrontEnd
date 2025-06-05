//src/pages/TaskSelection/index.jsx
import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
import HeaderSection from './HeaderSection';
import { useEffect, useRef, useState } from 'react';
import TaskSelectionTab from './TaskSelectionTab';
import TasksWaveForm from './TasksWaveForm';
import { useContext } from 'react';
import { VideoContext } from '../../contexts/VideoContext';
import { useNavigate } from 'react-router-dom';

const TaskSelection = () => {
  const {
    videoId, videoReady, setVideoReady, videoData, setVideoData, videoURL, setVideoURL,
    videoRef, fileName, setFileName, boundingBoxes, setBoundingBoxes,
    fps, setFPS, taskBoxes, setTaskBoxes, tasks, setTasks, tasksReady, setTasksReady,
    persons, setPersons, boxesReady, setBoxesReady,
  } = useContext(VideoContext);

  const navigate = useNavigate();
  if (!videoId) {
    navigate("/")
  }

  const onTaskChange = newTask => {
    const newTasks = tasks.map(task =>
      task.id === newTask.id ? {...newTask, data:null} : task,
    );
    setTasks(newTasks);
  };

  const onTaskDelete = deletedTask => {
    const newTasks = tasks.filter(task => task.id !== deletedTask.id);
    setTasks(newTasks);
  };

  const onNewTask = newTask => {
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
  };

  const onFPSCalculation = fps => {
    setVideoReady(true);
  };

  const moveToNextScreen = () => {
    navigate("/taskdetails");
  };

  const resetTaskSelection = () => {
    setTasksReady(false);
    setTasks([]);
  };

  // useEffect for updating taskBoxes when tasks change.
  useEffect(() => {
    // console.log("tasks",tasks)
    if (tasks.length === 0) {
      setTaskBoxes([]);
      return;
    }

    const newTaskBoxes = tasks.map(task => {
      const existingBox = taskBoxes.find(box => box.id === task.id);
      if (existingBox) {
        return {
          ...task,
          x: existingBox.x,
          y: existingBox.y,
          width: existingBox.width,
          height: existingBox.height,
        };
      }

        const startFrame = Math.ceil(task.start * fps);
        const endFrame = Math.floor(task.end * fps);

        const regionBoxes = boundingBoxes.filter(
          ({ frameNumber, data }) =>
            frameNumber >= startFrame && frameNumber <= endFrame && data
        );

        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        regionBoxes.forEach(box => {
          box.data.forEach(({ x, y, width, height }) => {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + width);
            maxY = Math.max(maxY, y + height);
          });
        });

        return {
          ...task,
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        };
      
    });
    setTaskBoxes(newTaskBoxes);
  }, [tasks, boundingBoxes, fps]);

  return (
    <div className="flex flex-col min-h-screen max-h-screen overflow-hidden">
      <div className="flex flex-1 flex-row max-h-screen flex-wrap">
        <div className={'flex w-1/2 max-h-screen bg-red-600'}>
          <VideoPlayer
            videoURL={videoURL}
            setVideoURL={setVideoURL}
            screen={'tasks'}
            videoRef={videoRef}
            boundingBoxes={boundingBoxes}
            setBoundingBoxes={setBoundingBoxes}
            fps={fps}
            persons={persons}
            fpsCallback={onFPSCalculation}
            setVideoReady={setVideoReady}
            setVideoData={setVideoData}
            fileName={fileName}
            setFileName={setFileName}
            taskBoxes={taskBoxes}
            setTaskBoxes={setTaskBoxes}
            videoData={videoData}
            tasks={tasks}
            setTasks={setTasks}
          />
        </div>
        <div className={'flex flex-col min-h-[100vh] max-h-[100vh] w-1/2 '}>
          <HeaderSection
            title={'Task Selection'}
            isVideoReady={videoReady}
            fileName={fileName}
            fps={fps}
            boundingBoxes={boundingBoxes}
            taskBoxes={taskBoxes}
            moveToNextScreen={moveToNextScreen}
          />
          <TasksWaveForm
            setTasks={setTasks}
            videoRef={videoRef}
            tasks={tasks}
            taskboxes={taskBoxes}
            setTaskBoxes={setTaskBoxes}
            isVideoReady={videoReady}
            tasksReady={tasksReady}
            setTasksReady={setTasksReady}
          />
          <TaskSelectionTab
            setTasks={setTasks}
            setTaskBoxes={setTaskBoxes}
            tasksReady={tasksReady}
            setBoundingBoxes={setBoundingBoxes}
            setFPS={setFPS}
            tasks={tasks}
            onTaskChange={onTaskChange}
            onTaskDelete={onTaskDelete}
            isVideoReady={videoReady}
            videoRef={videoRef}
            taskReady={tasksReady}
            setTasksReady={setTasksReady}
            resetTaskSelection={resetTaskSelection}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskSelection;
