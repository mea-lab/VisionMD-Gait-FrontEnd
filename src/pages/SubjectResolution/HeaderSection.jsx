import React from 'react';
import { Button, Typography } from '@mui/material';
import { Download, NavigateNext, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HeaderSection = ({
  title,
  isVideoReady,
  boundingBoxes,
  persons,
  fps,
  moveToNextScreen,
  fileName,
}) => {
  const navigate = useNavigate();

  const downloadConfig = () => {
    const data = { fps, boundingBoxes, persons };
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName.replace(/\.[^/.]+$/, '') + '_subject_data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  return (
    <div className={`flex px-6 py-4 items-center ${
      isVideoReady ? 'justify-between' : 'justify-center'
    } bg-slate-700 shadow-lg rounded-b-md`}>
      <Typography variant="h4" className="text-white" fontWeight="500">
        {title}
      </Typography>
      
      {isVideoReady && (
        <div className="flex gap-3">
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            startIcon={<ArrowBack />}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
              py: 1
            }}
          >
            Back
          </Button>

          <Button
            variant="contained"
            onClick={downloadConfig}
            disabled={boundingBoxes.length === 0}
            startIcon={<Download />}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'grey.600'
              },
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
              py: 1
            }}
          >
            Config
          </Button>

          <Button
            variant="contained"
            onClick={moveToNextScreen}
            endIcon={<NavigateNext />}
            disabled={boundingBoxes.length === 0}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'grey.600'
              },
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
              py: 1
            }}
          >
            Proceed
          </Button>
        </div>
      )}
    </div>
  );
};

export default HeaderSection;