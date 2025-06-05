import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { CircularProgress, Input, Typography } from '@mui/material';
import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export default function JSONUploadDialog({
  dialogOpen,
  setDialogOpen,
  handleJSONUpload,
  videoRef,
}) {
  const [fileError, setFileError] = useState('');
  const [jsonContent, setJSONContent] = useState(null);

  const handleClose = () => {
    setDialogOpen(false);
    setFileError('');
  };

  const handleJSONProcess = () => {
    // setFileName("");
    setFileError('');
    handleJSONUpload(true, jsonContent);
    setDialogOpen(false);
  };

  const handleManualProcess = () => {
    handleJSONUpload(true, null);
    setDialogOpen(false);
  };

  const validateNewJson = data => {
    if (!data.hasOwnProperty('fps')) {
      throw new Error('fps field is missing.');
    } else if (typeof data.fps !== 'number') {
      throw new Error('fps should be a number.');
    }

    if (!data.hasOwnProperty('boundingBoxes')) {
      throw new Error('boundingBoxes field is missing.');
    } else if (!Array.isArray(data.boundingBoxes)) {
      throw new Error('boundingBoxes should be an array.');
    }

    data.boundingBoxes.forEach(box => {
      if (!box.hasOwnProperty('frameNumber')) {
        throw new Error('frameNumber field in boundingBoxes is missing.');
      } else if (typeof box.frameNumber !== 'number') {
        throw new Error('frameNumber in boundingBoxes should be a number.');
      }

      if (!box.hasOwnProperty('data')) {
        throw new Error('data field in boundingBoxes is missing.');
      } else if (!Array.isArray(box.data)) {
        throw new Error('data in boundingBoxes should be an array.');
      }

      box.data.forEach(item => {
        if (!item.hasOwnProperty('id')) {
          throw new Error('id field in boundingBoxes data is missing.');
        }
        // } else if (typeof item.id !== 'number') {
        //     throw new Error('id in boundingBoxes data should be a number.');
        // }

        ['x', 'y', 'width', 'height'].forEach(prop => {
          if (!item.hasOwnProperty(prop)) {
            throw new Error(`${prop} field in boundingBoxes data is missing.`);
          } else if (typeof item[prop] !== 'number') {
            throw new Error(
              `${prop} in boundingBoxes data should be a number.`,
            );
          }
        });
      });
    });

    return true;
  };

  const validateOldJson = json => {
    if (!Array.isArray(json)) {
      return false;
    }

    for (let item of json) {
      if (
        typeof item !== 'object' ||
        item === null ||
        !('id' in item) ||
        !('start' in item) ||
        !('end' in item) ||
        !('attributes' in item)
      ) {
        return false;
      }

      if (
        typeof item.id !== 'string' ||
        typeof item.start !== 'number' ||
        typeof item.end !== 'number' ||
        typeof item.attributes !== 'object' ||
        item.attributes === null ||
        !('label' in item.attributes) ||
        typeof item.attributes.label !== 'string'
      ) {
        return false;
      }

      if (item.start >= item.end) {
        return false;
      }
    }

    return true;
  };

  const validateJson = data => {
    let validNewJson = false;
    let validOldJson = false;
    let errorMessage = '';
    try {
      validNewJson = validateNewJson(data);
    } catch (error) {
      errorMessage = error.message;
      // setFileError(error.message);
      validNewJson = false;
    }

    try {
      validOldJson = validateOldJson(data);
    } catch (error) {
      errorMessage = error.message;
      // setFileError(error.message);
      validOldJson = false;
    }

    if (validNewJson || validOldJson) {
      setFileError(errorMessage);
      return true;
    }

    return false;
  };

  const handleFileChange = async event => {
    const file = event.target.files[0];
    if (file) {
      if (file.name.endsWith('.json') || file.name.endsWith('.parse')) {
        try {
          const content = await file.text();
          const jsonContent = JSON.parse(content);
          if (validateJson(jsonContent)) {
            setJSONContent(JSON.parse(content));
            // setFileName(file.name);
            setFileError('');
          }
        } catch (error) {
          setFileError('Error reading the file.');
        }
      } else {
        setFileError('Please select a valid JSON file.');
      }
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
            {
              <>
                Upload JSON containing the bounding boxes for the tasks or click
                on manually process to select tasks manually.
              </>
            }
          </DialogContentText>
          {
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
          }
        </DialogContent>
        <DialogActions>
          <Button onClick={handleJSONProcess} disabled={jsonContent === null}>
            Process using JSON
          </Button>
          <Button onClick={handleManualProcess}>Manual Selection</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
