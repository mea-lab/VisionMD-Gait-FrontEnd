import React, { useEffect, useState } from 'react';
import { PlayCircleOutline } from '@mui/icons-material';
import Button from '@mui/material/Button';
import JSONUploadDialog from './SubjectJSONUploadDialog';

const PersonRow = ({ person, onPlay, onToggleSubject }) => (
  <li
    className={`flex items-center justify-between p-2 rounded-lg transition-colors duration-150 ${
      person.isSubject ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-100 hover:bg-gray-200'
    }`}
  >
    <div className="flex items-center">
      <PlayCircleOutline onClick={() => onPlay(person.timestamp)} className="cursor-pointer" />
      <span className="ml-2 font-medium">{person.name}</span>
      <span className="ml-4 text-sm">{person.timestamp}</span>
    </div>
    <button
      onClick={() => onToggleSubject(person)}
      className={`px-4 py-1 rounded text-xs font-semibold shadow-sm transition-colors duration-150 ${
        person.isSubject ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
      }`}
    >
      {person.isSubject ? 'Remove Subject' : 'Mark as Subject'}
    </button>
  </li>
);

const SubjectSelectionTab = ({
  videoRef,
  setFPS,
  fps,
  setBoundingBoxes,
  boundingBoxes,
  persons,
  setPersons,
  isVideoReady,
  setBoxesReady,
  boxesReady,
}) => {
  const [openJsonUpload, setOpenJsonUpload] = useState(false);

  const convertFrameNumberToTimestamp = frameNumber =>
    (frameNumber / fps).toFixed(2);

  useEffect(() => {
    if (persons.length !== 0) return;

    const firstOccurrenceMap = new Map();
    if (Array.isArray(boundingBoxes)) {
      boundingBoxes.forEach(frameData => {
        frameData.data.forEach(p => {
          if (!firstOccurrenceMap.has(p.id)) {
            firstOccurrenceMap.set(p.id, frameData.frameNumber);
          }
        });
      });
    }

    const personArray = Array.from(firstOccurrenceMap, ([id, frameNumber]) => ({
      id,
      name: `Person ${id}`,
      frameNumber,
      timestamp: convertFrameNumberToTimestamp(frameNumber),
      isSubject: false,
    }));

    setPersons(personArray);
  }, [boundingBoxes, persons.length, fps, setPersons]);

  useEffect(() => {
    if (persons.length === 1 && !persons[0].isSubject) {
      setPersons(persons.map(person => ({ ...person, isSubject: true })));
    }
  }, [persons, setPersons]);

  const handlePlay = timestamp => {
    if (videoRef?.current && videoRef.current.readyState === 4) {
      videoRef.current.currentTime = timestamp;
    }
  };

  const handleToggleSubject = selectedPerson => {
    setPersons(
      persons.map(person =>
        person.id === selectedPerson.id
          ? { ...person, isSubject: !person.isSubject }
          : person
      )
    );
  };

  const jsonFileHandle = (jsonFileUploaded, jsonContent) => {
    console.log("Setting bounding boxes", jsonContent)
    if (jsonFileUploaded) {
      setBoundingBoxes(jsonContent.boundingBoxes);
      if (jsonContent.persons) {
        setPersons(jsonContent.persons);
      }
      setBoxesReady(true);
    }
  };

  if (!isVideoReady) {
    return (
      <div className="w-full h-[65vh] flex items-center justify-center">
        <div className="bg-gray-200 p-4 rounded-lg shadow-md">
          <p className="text-center text-lg font-semibold">Waiting for video to load...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[65vh] overflow-y-auto px-4">
      {!boxesReady ? (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div>Process the video to start subject selection</div>
          <Button 
          variant="contained"
          onClick={() => setOpenJsonUpload(true)}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
            textTransform: 'none',
            fontWeight: 'bold',
            px: 3,
            py: 1,
            fontSize: '1rem'
          }}
        >
          Process Video
        </Button>
          <JSONUploadDialog
            dialogOpen={openJsonUpload}
            setDialogOpen={setOpenJsonUpload}
            handleJSONUpload={jsonFileHandle}
            videoRef={videoRef}
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {persons.map((subject, index) => (
            <PersonRow
              key={subject.id || index}
              person={subject}
              onPlay={handlePlay}
              onToggleSubject={handleToggleSubject}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default SubjectSelectionTab;
