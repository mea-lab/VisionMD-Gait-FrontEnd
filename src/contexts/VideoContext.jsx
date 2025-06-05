// src/contexts/VideoContext.jsx
import React, { createContext, useState, useEffect, useRef } from 'react';
export const VideoContext = createContext();
import { useAutoSave } from '@/hooks/useAutoSave';
const API_URL = import.meta.env.VITE_API_BASE_URL;
const BASE_URL = import.meta.env.VITE_BASE_URL


export const VideoProvider = ({ children }) => {
    const [videoId, setVideoId] = useState(null);
    const [videoData, setVideoData] = useState(null);
    const [videoURL, setVideoURL] = useState("");
    const [fileName, setFileName] = useState("");
    const [fps, setFPS] = useState(null);

    const [persons, setPersons] = useState([]);
    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [taskBoxes, setTaskBoxes] = useState([]);

    const [videoReady, setVideoReady] = useState(false);
    const [boxesReady, setBoxesReady] = useState(false);
    const [tasksReady, setTasksReady] = useState(false);

    const videoRef = useRef(null);
    
    // Auto save hook on video context enables auto saving on route changes and refreshes
    useAutoSave(
        videoId,
        persons,
        boundingBoxes,
        tasks,
        taskBoxes,
    )

    // useEffect for getting video information if video id is updated
    useEffect(() => {
        const prepareVideoData = async (videoId) => {
            try {
                // Grabbing metadata and video from backend
                console.log("Video ID changed", videoId)

                const data_response = await fetch(`${API_URL}/get_video_data/?id=${videoId}`);
                if (!data_response.ok) throw new Error('Failed to fetch metadata');
                const data = await data_response.json();

                const metadata = data.metadata;
                console.log("Video data", data)

                const video_response = await fetch(`${BASE_URL}${metadata.video_url}`);
                if (!video_response.ok) throw new Error('Failed to fetch video');
                const blob = await video_response.blob();
                
                // Setting metadata and info 
                const file = new File([blob], fileName, { type: blob.type });
                setVideoData(file);
                setVideoURL(`${BASE_URL}/${metadata.video_url}`);
                setFileName(metadata.video_name);
                setFPS(metadata.fps);

                // Setting potential data that was stored previously (bounding boxes, tasks, landmarks, signals)
                if(data.persons) {
                    setPersons(data.persons)
                }
                if(data.boundingBoxes) {
                    setBoundingBoxes(data.boundingBoxes)
                    setBoxesReady(true)
                }
                if(data.tasks) {
                    setTasks(data.tasks)
                    setTasksReady(true)
                }

                // For some reason, setting task boxes breaks the frontend and not setting it makes it work
                // if(data.taskBoxes) {
                //     setTaskBoxes(data.taskBoxes)
                //     setTaskBoxes(true)
                // }
            } catch (error) {
                console.error('Error fetching video data on video project opening:\n', error);
            }
        }

        if (!videoId) return;
        
        //Reset video information first, then get video information we might have stored
        setVideoData(null);
        setVideoURL("");
        setFileName("");
        setFPS(null);

        setPersons([]);
        setBoundingBoxes([]);
        setTasks([]);
        setTaskBoxes([]);

        setVideoReady(false);
        setBoxesReady(false);
        setTasksReady(false);
        prepareVideoData(videoId);

        return () => {
            console.log("Unmounting video context...")
            setFileName("");
            setVideoURL("");
            setVideoReady(false);
        }
    },[videoId])

    return (
        <VideoContext.Provider
            value={{
                videoId,
                setVideoId,
                videoRef,
                videoData,
                setVideoData,
                videoURL,
                setVideoURL,
                videoReady,
                setVideoReady,
                fileName,
                setFileName,
                fps,
                setFPS,
                boundingBoxes,
                setBoundingBoxes,
                tasks,
                setTasks,
                taskBoxes,
                setTaskBoxes,
                tasksReady,
                setTasksReady,
                persons,
                setPersons,
                boxesReady,
                setBoxesReady,
            }}
        >
            {children}
        </VideoContext.Provider>
    );
};
