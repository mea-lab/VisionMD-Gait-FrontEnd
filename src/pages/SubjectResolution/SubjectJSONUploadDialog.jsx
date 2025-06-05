import { useState, useContext } from 'react';
import {
  Button, Dialog, DialogActions,
  DialogContent, DialogContentText,
  DialogTitle, CircularProgress,
  Input, Typography, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { VideoContext } from '@/contexts/VideoContext';

export default function JSONUploadDialog({ dialogOpen, setDialogOpen, handleJSONUpload }) {
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [jsonContent, setJSONContent] = useState(null);
  const [serverProcessing, setServerProcessing] = useState(false);

  const {
    videoRef,
    videoId,
  } = useContext(VideoContext)

  const handleClose = () => {
    setDialogOpen(false);
    setFileName('');
    setFileError('');
  };

  const handleJSONProcess = () => {
    setFileName('');
    setFileError('');
    handleJSONUpload(true, jsonContent);
    setDialogOpen(false);
  };

  const getVideoData = async () => {
    setServerProcessing(true);
    const videoURL = videoRef.current.src;
    const blob = await fetch(videoURL).then(r => r.blob());
    await fetchBoundingBoxes(blob);
  };

  const fetchBoundingBoxes = async (content) => {
    try {
      const uploadData = new FormData();
      uploadData.append('video', content);
      const response = await fetch(`http://localhost:8000/api/get_bounding_boxes/?id=${videoId}`, {
        method: 'POST',
        body: uploadData,
      });
      if (!response.ok) {
        throw new Error('Server responded with an error!');
      }
      const data = await response.json();
      console.log("Returned subject resolution data",data)
      handleJSONUpload(true, data);
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setFileError(error.message);
    } finally {
      setServerProcessing(false);
    }
  };

  const handleAutoProcess = async () => {
    await getVideoData();
  };

  const validateJson = data => {
    try {
      if (!('fps' in data)) {
        throw new Error('fps field is missing.');
      }
      if (typeof data.fps !== 'number') {
        throw new Error('fps should be a number.');
      }
      if (!('boundingBoxes' in data)) {
        throw new Error('boundingBoxes field is missing.');
      }
      if (!Array.isArray(data.boundingBoxes)) {
        throw new Error('boundingBoxes should be an array.');
      }
      data.boundingBoxes.forEach(box => {
        if (!('frameNumber' in box)) {
          throw new Error('frameNumber field in boundingBoxes is missing.');
        }
        if (typeof box.frameNumber !== 'number') {
          throw new Error('frameNumber in boundingBoxes should be a number.');
        }
        if (!('data' in box)) {
          throw new Error('data field in boundingBoxes is missing.');
        }
        if (!Array.isArray(box.data)) {
          throw new Error('data in boundingBoxes should be an array.');
        }
        box.data.forEach(item => {
          if (!('id' in item)) {
            throw new Error('id field in boundingBoxes data is missing.');
          }
          ['x', 'y', 'width', 'height'].forEach(prop => {
            if (!(prop in item)) {
              throw new Error(`${prop} field in boundingBoxes data is missing.`);
            }
            if (typeof item[prop] !== 'number') {
              throw new Error(`${prop} in boundingBoxes data should be a number.`);
            }
          });
        });
      });
      return true;
    } catch (error) {
      setFileError(error.message);
      return false;
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setFileError('Please select a valid JSON file.');
      return;
    }
    try {
      const content = await file.text();
      const parsed = JSON.parse(content);
      if (validateJson(parsed)) {
        setJSONContent(parsed);
        setFileName(file.name);
        setFileError('');
      }
    } catch (error) {
      setFileError('Error reading the file.');
    }
  };

  return (
    <Dialog open={dialogOpen} onClose={handleClose}>
      <DialogTitle>
        Video parser
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
      </DialogTitle>
      <DialogContent>
        {!serverProcessing ? (
          <>
            <DialogContentText>
              Upload JSON manually containing the bounding boxes for the video or click on auto-parse to let the server handle it.
            </DialogContentText>
            <div>
              <Input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ margin: '10px 0' }}
              />
              {fileError && <Typography color="error">{fileError}</Typography>}
            </div>
          </>
        ) : (
          <div className="flex flex-col w-full h-full justify-center items-center gap-10">
            <div>Server processing the request</div>
            <CircularProgress size={80} />
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleJSONProcess} disabled={jsonContent === null || serverProcessing}>
          Process using JSON
        </Button>
        <Button onClick={handleAutoProcess} disabled={serverProcessing}>
          Auto-Process
        </Button>
      </DialogActions>
    </Dialog>
  );
}
