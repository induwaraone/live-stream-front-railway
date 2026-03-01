const API_BASE_URL = 'http://localhost:8080/api';

export const fetchLiveKitToken = async (participantName: string, roomName: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/livekit/token?participantName=${participantName}&roomName=${roomName}`);
    if (!response.ok) {
        throw new Error('Failed to fetch token');
    }
    const data = await response.json();
    return data.token;
};