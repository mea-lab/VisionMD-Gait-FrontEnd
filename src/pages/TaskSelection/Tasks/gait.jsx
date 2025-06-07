import { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import Creatable from 'react-select/creatable';
import { IconButton, Collapse} from '@mui/material';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import TouchApp from '@mui/icons-material/TouchApp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Tooltip from '@mui/material/Tooltip';

let globalFocalLength = null
let globalHeight      = null
const listeners       = new Set()

export function setGlobalFocalLength(onFieldChange, val, task) {
  globalFocalLength = val
  onFieldChange(val, 'focal_length', task)
  listeners.forEach(cb => cb())
}
export function setGlobalHeight(onFieldChange, val, task) {
  globalHeight = val
  onFieldChange(val, 'height', task)
  listeners.forEach(cb => cb())
}
const subscribe   = cb => { listeners.add(cb); return () => listeners.delete(cb) }

const Gait = ({
  task,
  onFieldChange,
  onTaskDelete,
  onTimeMark,
  onTimeClick,
  options,
}) => {
  const [open, setOpen] = useState(true);
  const taskSelectionRef = useRef(null);

  const fl = useSyncExternalStore(subscribe, () =>
    globalFocalLength
  );
  const h = useSyncExternalStore(subscribe, () =>
    globalHeight
  );

  const handleTaskChange = selectedTask => {
    onFieldChange(selectedTask.value, 'name', task);
  };

  useEffect(() => {
    if(taskSelectionRef.current) {
      taskSelectionRef.current.focus();
    }
  }, [taskSelectionRef])

  useEffect(() => {
    if (task.focal_length) {
      setGlobalFocalLength(onFieldChange, task.focal_length, task)
    }

    if (task.height) {
      setGlobalHeight(onFieldChange, task.height, task)
    }
  }, [])

  useEffect(() => {
  if (fl != null && fl !== task.focal_length) {
    onFieldChange(fl, 'focal_length', task)
  }
}, [fl])

useEffect(() => {
  if (h != null && h !== task.height) {
    onFieldChange(h, 'height', task)
  }
}, [h])

  return (
    <div
      tabIndex={-1}
      className="border-2 rounded-lg mb-4 overflow-hidden min-h-[50px]
                focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-300
                focus-within:shadow-blue-200 focus-within:shadow-md
                transition-all duration-500 ease-in-out"
      key={task.id}
      ref={taskSelectionRef}
    >
      {/*  HEADER ROW  */}
      <div className={`flex items-center gap-4 justify-between px-4 py-2 bg-white font-semibold`}>
        {task.name} #{task.id}
        {/* Chevron */}
        <div className="">
          <IconButton
            size="small"
            className={`transform transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
            onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
            aria-label="Toggle details"
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="remove"
            onClick={() => onTaskDelete(task)}
          >
            <HighlightOffIcon fontSize="inherit" />
          </IconButton>
        </div>
      </div>


      {/*  DETAILS PANEL  */}
      <Collapse in={open} timeout="auto" unmountOnExit>

        {/* Line Seperator */}
        <div className="bg-white px-4 pb-1">
          <div className="h-[1px] bg-gray-200 w-full" />
        </div>

        <div className="flex flex-row items-center flex-wrap justify-between px-3 py-2 bg-white gap-y-4 rounded-b-lg">
          
          {/* Task selector */}
          <div className="relative whitespace-nowrap">
            <label className="inline whitespace-nowrap font-medium">Task: </label>
            <select
              className="p-2 border rounded-lg bg-white"
              value={task.name}
              onChange={(e) => handleTaskChange({ value: e.target.value, label: e.target.value })}
            >
              <option value="" hidden>Select task</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>



          {/* Start time */}
          <div className="flex items-center gap-x-1">
            <label className="inline whitespace-nowrap font-medium">Start: </label>
            <input
              className="p-2 w-20 text-left border rounded-lg"
              type="number"
              onChange={e => onFieldChange(e.target.value, 'start', task)}
              onDoubleClick={() => onTimeClick(task.start)}
              min={0}
              step={0.001}
              value={task.start}
            />
            <IconButton
              size="small"
              onClick={e => { e.stopPropagation(); onTimeMark('start', task); }}
            >
              <TouchApp fontSize="small" />
            </IconButton>
          </div>

          {/* End time */}
          <div className="flex items-center gap-x-1">
            <label className="inline whitespace-nowrap font-medium">End: </label>
            <input
              className="p-2 w-20 text-left border rounded-lg"
              type="number"
              onChange={e => onFieldChange(e.target.value, 'end', task)}
              onDoubleClick={() => onTimeClick(task.end)}
              min={0}
              step={0.001}
              value={task.end}
            />
            <IconButton
              size="small"
            >
              <TouchApp fontSize="small" />
            </IconButton>
          </div>

          {/* Focal Length */}
          <div className="flex items-center space-x-1">
            <label className="inline whitespace-nowrap font-medium">
              Focal Length (mm): 
            </label>
            <input
              className="p-2 w-20 sm:w-24 text-left border rounded-lg"
              type="number"
              placeholder="Optional"
              onChange={e => {
                const v = +e.target.value
                setGlobalFocalLength(onFieldChange, v, task)
              }}
              value={fl || ''}
            />
            <Tooltip 
              arrow 
              title="Enter the 35mm equivalent focal length of the lens. 
                      You can usually find this in the photo or video details on your phone or camera, 
                      listed as something like 'X mm'." 
            >
              <HelpOutlineIcon className="ml-1 text-gray-500 cursor-pointer" fontSize="small" />
            </Tooltip>
          </div>

          {/* Person Height */}
          <div className="flex items-center space-x-1">
            <label className="inline whitespace-nowrap font-medium">
              Height (cm)
            </label>
            <input
              className="p-2 w-20 sm:w-24 text-center border rounded-lg"
              type="number"
              placeholder="Required"
              onChange={e => {
                const v = +e.target.value
                setGlobalHeight(onFieldChange, v,task)
              }}
              value={h || ''}
            />
          </div>

        </div>
      </Collapse>
    </div>
  );
};

export default Gait;
