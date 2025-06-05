// src/pages/HomePage/projects.jsx
import { useEffect, useState, useRef, useContext } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Plus, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VideoContext } from "../../contexts/VideoContext";

const BASE_URL = import.meta.env.VITE_BASE_URL;
dayjs.extend(relativeTime);

const fetchVideos = async () => {
  const res = await fetch('http://localhost:8000/api/get_video_data/');
  if (!res.ok) throw new Error('Network error');
  return res.json();
}

const uploadVideo = async (file) => {
  const form = new FormData();
  form.append('video', file);
  const res = await fetch('http://localhost:8000/api/upload_video/', {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}




const AddTile = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="
        w-full h-full
        rounded-lg flex
        p-4
        items-center justify-center
        border-2 border-dashed border-gray-500 
        hover:bg-gray-700 
        focus:outline-none focus:ring
      "
    >
      <div className="flex flex-col items-center">
        <Plus size={32}/>
        <span className="mt-2 text-sm">New Project</span>
      </div>
    </button>
  );
}





const VideoTile = ({ video }) => {
  const [editing, setEditing] = useState(false);
  const [videoName, setVideoName] = useState(video.metadata.stem_name);
  const navigate = useNavigate();
  const {
    setVideoId,
  } = useContext(VideoContext);

  const onVideoNameChange = (newStemName) => {
    setVideoName(newStemName);
  }

  const openVideoProject = async () => {
    // console.log("Trying video opening:", video.id)
    setVideoId(video.metadata.id)
    navigate("/subjects");
  }

  return (
    <div 
      className="rounded-lg hover:bg-gray-700 bg-surfaceElevated p-4 flex flex-col overflow-hidden h-full"
    >
        <img
          src={`${BASE_URL}${video.metadata.thumbnail_url}`}
          className="rounded-lg w-full aspect-video object-contain cursor-pointer"
          alt={`Thumbnail for ${video.metadata.video_name}`}
          onClick={() => openVideoProject()}
        />
      <div className="flex items-center mt-2">
        {editing ? (
          <div className='flex flex-row w-full items-start justify-items-start'>
            <input
              className="p-0 bg-transparent border-b border-gray-400 text-sm focus:outline-none"
              value={videoName}
              onBlur={() => setEditing(false)}
              onChange={e => onVideoNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.target.blur();
                }
              }}
              autoFocus
            />
          </div>
        ) : (
          <h3 className="flex-1 text-sm truncate" title={videoName}>{videoName}.{video.metadata.file_type}</h3>
        )}
        <button 
          onClick={() => {
            setEditing(true)}
          }
          aria-label="Edit title"
          className="p-1 hover:text-gray-300"
        >
          <Pencil size={14}/>
        </button>
      </div>
      <p className="text-xs text-gray-400">Last edited {dayjs(video.metadata.last_edited).fromNow()}</p>
    </div>
  );
}





export default function Projects() {
  const [videos, setVideos] = useState(null);
  const fileInputRef        = useRef();

  useEffect(() => {
    const loadVideos = async () => {
      try {
        // Returns empty array if no videos found
        const all_videos_data = await fetchVideos();
        setVideos(all_videos_data);
      } catch (err) {
        console.error("Error fetching videos:", err);
      }
    }

    loadVideos();
  }, []);

  const handleAddClick = () => fileInputRef.current.click();

  const handleFiles = async e => {
    const file = e.target.files[0];

    if (!file) return;
    try {
      const response_metadata = await uploadVideo(file);
      // console.log("Upload response data", response_metadata)
      setVideos(v => [response_metadata, ...(v ?? [])]);
    } catch(error) {
      console.error('Video upload failed:', error);
    } finally {
      e.target.value = null; 
    }
  };

  return (
    <section>
      
      {/* Hidden input for video uploading*/}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFiles}
      />

      {/* Grid for video tiles and add project tile */}
      <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
        {videos && (
          <>
            {/* All video tiles */}
            {videos.map((video) => (
              <div key={video.metadata.id} style={{ width: '100%', aspectRatio: '4 / 3' }}>
                <VideoTile className="w-full h-full" video={video} />
              </div>
            ))}

            {/* Add project tile */}
            <div key={"add"} style={{ width: '100%', aspectRatio: '4 / 3' }}>
              <AddTile className="w-full h-full" onClick={handleAddClick} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}