import { useState, useEffect } from 'react';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { fetchLiveKitToken } from '../services/api';

interface ClassroomProps {
    roomName: string;
    studentName: string;
    onLeave: () => void;
}

export default function ClassroomPage({ roomName, studentName, onLeave }: ClassroomProps) {
    const [token, setToken] = useState<string>("");
    // IMPORTANT: Replace with your actual Tailscale IP!
    const serverUrl = "ws://100.124.9.102:7880";

    useEffect(() => {
        const getToken = async () => {
            try {
                const fetchedToken = await fetchLiveKitToken(studentName, roomName);
                setToken(fetchedToken);
            } catch (error) {
                console.error("Error joining room:", error);
            }
        };
        getToken();
    }, [roomName, studentName]);

    if (!token) return <div style={{ padding: '20px' }}>Connecting to classroom...</div>;

    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            <LiveKitRoom
                video={true}
                audio={true}
                token={token}
                serverUrl={serverUrl}
                data-lk-theme="default"
                onDisconnected={onLeave}
            >
                <VideoConference />
                <RoomAudioRenderer />
            </LiveKitRoom>
        </div>
    );
}