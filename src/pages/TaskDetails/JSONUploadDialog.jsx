// src/pages/TaskDetails/JSONUploadDialog.jsx
import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { CircularProgress, Input, Typography } from '@mui/material';
import { useState, useContext } from 'react';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { VideoContext } from '../../contexts/VideoContext';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function JSONUploadDialog({
  dialogOpen,
  setDialogOpen,
  handleJSONUpload,
  selectedTask,
}) {
  const {
    videoId,
    videoRef,
    fps,
    tasks,
    taskBoxes,
  } = useContext(VideoContext);

  const [fileError, setFileError] = useState('');
  const [jsonContent, setJSONContent] = useState(null);
  const [serverProcessing, setServerProcessing] = useState(false);

  const handleClose = () => {
    setDialogOpen(false);
    setFileError('');
  };

  const handleJSONProcess = () => {
    setFileError('');
    handleJSONUpload(true, jsonContent);
    setDialogOpen(false);
  };

  const handleAutoProcess = async () => {
    await fetchAnalysisDetails();
  };

  const handleFileChange = async event => {
    const file = event.target.files[0];
    if (file) {
      if (file.name.endsWith('.json') || file.name.endsWith('.parse')) {
        try {
          const content = await file.text();
          setJSONContent(JSON.parse(content));
          setFileError('');
        } catch (error) {
          setFileError('Error reading the file.');
        }
      } else {
        setFileError('Please select a valid JSON file.');
      }
    }
  };

  const fetchAnalysisDetails = async () => {
    const videoURL = videoRef.current.src;
    const content = await fetch(videoURL).then(r => r.blob());

    try {
      let uploadData = new FormData();
      let taskData = tasks[selectedTask];

      const chosenTaskBox = taskBoxes.find(box => box.id === taskData.id);
      const taskBoxCords = {
        x: chosenTaskBox.x,
        y: chosenTaskBox.y,
        width: chosenTaskBox.width,
        height: chosenTaskBox.height,
      };

      const { start, end, name, data, ...otherTaskFields } = taskData;
      let jsonData = {
        boundingBox: taskBoxCords,
        task_name: taskData.name,
        start_time: taskData.start,
        end_time: taskData.end,
        fps: fps,
        ...otherTaskFields,
      };
      
      jsonData = JSON.stringify(jsonData);
      uploadData.append('json_data', jsonData);        
      const sanitizedTaskName = taskData.name
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map(word => word.toLowerCase())
        .join('_');

      // Build the API URL with the sanitized task name.
      let apiURL = `${API_URL}/${sanitizedTaskName}/?id=${videoId}`;

      console.log("API URL Generated as:", apiURL);
      console.log("Upload data", JSON.parse(jsonData));

      setServerProcessing(true);
      const response = await fetch(apiURL, {
        method: 'POST',
        body: uploadData,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Returned Data Content:", data)
        handleJSONUpload(true, data);
        setDialogOpen(false);
        setServerProcessing(false);
      } else {
        if (response.status === 404) {
          setServerProcessing(false);
          throw new Error('404 Error: API route for task is not found!');
        }
        setServerProcessing(false);
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status} error:\n ${errorText}`);
      }

    } catch (error) {
      setServerProcessing(false);
      console.error('Failed to fetch projects:', error);
      setFileError(error.message || 'Unknown error');
    }
  };

  return (
    <React.Fragment>
      <Dialog open={dialogOpen} onClose={handleClose}>
        <DialogTitle>Task Setup</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent>
          <DialogContentText>
            {!serverProcessing && (
              <>
                Upload JSON containing the task analysis data or click on
                analyze to analyze the task automatically.
              </>
            )}
            {serverProcessing && (
              <div
                className={
                  'flex flex-col w-full h-full justify-center items-center gap-10'
                }
              >
                <div>Server processing the request</div>
                <CircularProgress size={80} />
              </div>
            )}
          </DialogContentText>
          {!serverProcessing && (
            <div>
              <Input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ margin: '10px 0' }}
                label="Upload JSON file"
              />
              {fileError && <Typography color="error">{fileError}</Typography>}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          {!serverProcessing && (
            <>
              <Button
                onClick={handleJSONProcess}
                disabled={jsonContent === null}
              >
                Analyse from JSON
              </Button>
              <Button onClick={handleAutoProcess}>Auto Analyze</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
