import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { fetchLiveKitToken } from '../services/api';

export default function ClassroomPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [token, setToken] = useState<string>("");

    // IMPORTANT: Replace with your actual LiveKit server URL
    const serverUrl = "ws://100.124.9.102:7880";

    useEffect(() => {
        if (!sessionId) return;
        const getToken = async () => {
            try {
                const fetchedToken = await fetchLiveKitToken(sessionId);
                setToken(fetchedToken);
            } catch (error) {
                console.error("Error joining room:", error);
            }
        };
        getToken();
    }, [sessionId]);

    if (!token) return <div style={{ padding: '20px' }}>Connecting to classroom...</div>;

    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            <LiveKitRoom
                video={true}
                audio={true}
                token={token}
                serverUrl={serverUrl}
                data-lk-theme="default"
                onDisconnected={() => navigate(-1)}
            >
                <VideoConference />
                <RoomAudioRenderer />
            </LiveKitRoom>
        </div>
    );
}