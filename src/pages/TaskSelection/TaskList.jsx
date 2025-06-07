//src/pages/TaskSelection/TaskList.jsx
import { RestartAlt, TouchApp } from '@mui/icons-material';
import { useState } from 'react';
import { taskOptions } from '../../constants/taskOptions'; 
import Default from './Tasks/default'


const Header = ({ resetTaskSelection }) => {
  return (
    <div className="flex flex-col border-b-2 py-2 font-semibold border-gray-300">
      Tasks
    </div>
  );
};

const selectedTaskFiles = Object.fromEntries(
  taskOptions.map(({ label }) => {
    const fileName = label.toLowerCase().replace(/\s+/g, '_');
    const module = import.meta.glob('./Tasks/*.jsx', { eager: true });
    const match = Object.entries(module).find(([path]) =>
      path.endsWith(`/${fileName}.jsx`)
    );
    return [label, match ? match[1].default : null];
  }).filter(([_, component]) => component)
);

const TaskList = ({
  tasks,
  onTaskChange,
  onTaskDelete,
  videoRef,
  resetTaskSelection,
}) => {
  const [options, setOptions] = useState(taskOptions);

  const onFieldChange = (newValue, fieldName, task) => {
    let newTask = { ...task };
    if(newTask[fieldName] && newTask[fieldName] == newValue) return;
    
    newTask[fieldName] =
      fieldName === 'start' || fieldName === 'end'
        ? Number(Number(newValue).toFixed(3))
        : newValue;
    onTaskChange(newTask);
  };

  const onTimeMark = (fieldName, task) => {
    let newTask = { ...task };
    newTask[fieldName] = Number(
      Number(videoRef.current?.currentTime || 0).toFixed(3),
    );
    onTaskChange(newTask);
  };

  const onTimeClick = time => {
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  return (
    <div className="flex flex-col gap-2 p-4 h-full overflow-y-auto rounded-lg bg-gray-100 shadow-inner">
      <Header resetTaskSelection={resetTaskSelection} />

      {/* Task Settings and Options Here */}
      <div className="flex flex-col">
        {tasks.length > 0 ? (
          tasks.map((task, index) => {
            const TaskComponent = selectedTaskFiles[task.name];
            if (!TaskComponent) {
              return(
                <Default
                  key={index}
                  task={task}
                  onFieldChange={onFieldChange}
                  onTaskDelete={onTaskDelete}
                  onTimeMark={onTimeMark}
                  onTimeClick={onTimeClick}
                  options={options}
                  setOptions={setOptions}
                />
              )
            } else {
              return (
                <TaskComponent
                  key={index}
                  task={task}
                  onFieldChange={onFieldChange}
                  onTaskDelete={onTaskDelete}
                  onTimeMark={onTimeMark}
                  onTimeClick={onTimeClick}
                  options={options}
                  setOptions={setOptions}
                />
              );
            }
          })
        ) : (
          <div className="text-center text-gray-500 py-4">No tasks added yet</div>
        )}
      </div>
    </div>
  );
};

export default TaskList;