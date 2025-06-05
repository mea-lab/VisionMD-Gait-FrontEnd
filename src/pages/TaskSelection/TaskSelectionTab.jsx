//src/pages/TaskSelection/TaskSelectionTab.jsx
import React, { useState } from 'react';
import TaskList from './TaskList';
import Button from '@mui/material/Button';
import JSONUploadDialog from './JSONUploadDialog';

const TaskSelectionTab = ({
  tasks,
  setBoundingBoxes,
  setTasks,
  setFPS,
  setTaskBoxes,
  onTaskChange,
  onTaskDelete,
  isVideoReady,
  videoRef,
  tasksReady,
  setTasksReady,
  resetTaskSelection,
}) => {
  const [openJsonUpload, setOpenJsonUpload] = useState(false);

  const getTasksFromTaskBoxes = curTaskBoxes => {
    const newTasks = [];
    for (let curTaskBox of curTaskBoxes) {
      let curTask = {
        id: curTaskBox?.id,
        start: curTaskBox?.start,
        end: curTaskBox?.end,
        name: curTaskBox?.name,
      };
      curTask = { ...curTask, ...curTaskBox };
      newTasks.push(curTask);
    }

    return newTasks;
  };
  
  const jsonFileHandle = (jsonFileUploaded, jsonContent) => {
    if (jsonFileUploaded && jsonContent !== null) {
      if (jsonContent.hasOwnProperty('boundingBoxes')) {
        //new json
        setBoundingBoxes(jsonContent['boundingBoxes']);
        setFPS(jsonContent['fps']);
        if (jsonContent.hasOwnProperty('tasks')) {
          const curTaskBoxes = jsonContent['tasks'];
          setTaskBoxes(curTaskBoxes);
          setTasks(getTasksFromTaskBoxes(curTaskBoxes));
        }
      } else {
        //old json
        const transformedData = jsonContent.map((item, index) => ({
          start: item.start,
          end: item.end,
          name: item.attributes.label,
          id: index + 1,
        }));
        setTasks(transformedData);
      }

      console.log('JSON file details captured and added.');
      setTasksReady(true);
    } else {
      setTasksReady(true);
    }
  };

  return (
    <div className={'flex-1 flex flex-col p-2 w-full min-h-0'}>
      {isVideoReady && !tasksReady && (
        <div
          className={
            'flex justify-center items-center h-full flex-col gap-4 w-full px-10 flex-1 py-4 overflow-y-auto rounded-lg bg-gray-100 '
          }
        >
          <div>Setup the tasks</div>
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
          Setup
        </Button>
          <JSONUploadDialog
            dialogOpen={openJsonUpload}
            setDialogOpen={setOpenJsonUpload}
            handleJSONUpload={jsonFileHandle}
            videoRef={videoRef}
          />
        </div>
      )}
      {isVideoReady && tasksReady && (
        <TaskList
          tasks={tasks}
          onTaskChange={onTaskChange}
          onTaskDelete={onTaskDelete}
          videoRef={videoRef}
          resetTaskSelection={resetTaskSelection}
        />
      )}
    </div>
  );
};

export default TaskSelectionTab;
