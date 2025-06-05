//src/pages/TaskDetails/HeaderSection.jsx
import { ArrowBack } from '@mui/icons-material';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { Typography } from '@mui/material';


const HeaderSection = ({ title, isVideoReady }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-slate-700 rounded-b-md py-4 px-8 shadow-lg">
      <div className={`mx-auto flex items-center ${isVideoReady ? 'justify-between' : 'justify-center'}`}>
      <Typography variant="h4" className="text-white font-bold font-sans">
        {title}
      </Typography>
        
        {isVideoReady && (
          <Button
            variant="contained"
            onClick={() => navigate('/tasks')}
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
        )}
      </div>
    </header>
  );
};


export default HeaderSection;
