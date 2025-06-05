import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderSection from './HeaderSection';
import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
import SubjectSelectionTab from './SubjectSelectionTab';
import SubjectsWaveForm from './SubjectsWaveForm';
import { VideoContext } from '../../contexts/VideoContext';

const SubjectResolution = () => {
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
    setFileName,
    boundingBoxes,
    setBoundingBoxes,
    fps,
    setFPS,
    taskBoxes,
    setTaskBoxes,
    persons,
    setPersons,
    boxesReady,
    setBoxesReady,
    tasks,
    setTasks,
  } = useContext(VideoContext);

  const navigate = useNavigate();
  if(!videoId) {
    navigate("/")
  }

  // Returns true if the person with the given id is marked as subject.
  const isSubject = id => persons.find(p => p.id === id)?.isSubject;

  const updateFinalBoundingBoxes = () => {
    setBoundingBoxes(
      boundingBoxes.map(frame => ({
        ...frame,
        data: frame.data.filter(box => isSubject(box.id)),
      }))
    );
  };

  const moveToNextScreen = () => {
    updateFinalBoundingBoxes();
    navigate('/tasks');
  };

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <div className="flex flex-1 w-full">
        <div className="flex w-1/2 max-h-screen bg-red-600">
          <VideoPlayer
            videoData={videoData}
            screen="subject_resolution"
            taskBoxes={taskBoxes}
            setTaskBoxes={setTaskBoxes}
            videoRef={videoRef}
            boundingBoxes={boundingBoxes}
            setBoundingBoxes={setBoundingBoxes}
            fps={fps}
            persons={persons}
            setVideoReady={setVideoReady}
            videoURL={videoURL}
            setVideoURL={setVideoURL}
            fileName={fileName}
            setFileName={setFileName}
            setVideoData={setVideoData}
            tasks={tasks}
            setTasks={setTasks}
          />
        </div>
        <div className="flex flex-col gap-4 w-1/2 h-full max-h-screen overflow-y-auto">
          <HeaderSection
            title="Subject Selection"
            isVideoReady={videoReady}
            moveToNextScreen={moveToNextScreen}
            boundingBoxes={boundingBoxes}
            persons={persons}
            fps={fps}
            videoURL={videoURL}
            fileName={fileName}
          />
          <SubjectSelectionTab
            boundingBoxes={boundingBoxes}
            setBoundingBoxes={setBoundingBoxes}
            fps={fps}
            setFPS={setFPS}
            videoRef={videoRef}
            persons={persons}
            setPersons={setPersons}
            isVideoReady={videoReady}
            boxesReady={boxesReady}
            setBoxesReady={setBoxesReady}
          />
          <SubjectsWaveForm
            videoData={videoData}
            videoURL={videoURL}
            videoRef={videoRef}
            persons={persons}
            isVideoReady={videoReady}
            boxesReady={boxesReady}
          />
        </div>
      </div>
    </div>
  );
};

export default SubjectResolution;
