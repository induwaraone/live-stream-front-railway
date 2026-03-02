// const API_BASE_URL = 'http://localhost:8080/api';
const API_BASE_URL = 'https://live-streaming-backend-production.up.railway.app/api';

// Helper to get auth headers
function authHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

// Auth APIs
export const registerUser = async (fullName: string, email: string, password: string, userType: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, userType }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
    }
    return response.json();
};

export const loginUser = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
    }
    return response.json();
};

// LiveKit token (now requires auth, uses sessionId)
export interface LiveKitTokenResponse {
    token: string;
    roomName: string;
    isModerator: string; // "true" or "false"
}

export const fetchLiveKitToken = async (sessionId: string): Promise<LiveKitTokenResponse> => {
    const response = await fetch(`${API_BASE_URL}/livekit/token?sessionId=${sessionId}`, {
        headers: authHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch LiveKit token');
    }
    return response.json();
};

// Session APIs
export interface SessionData {
    sessionId: string;
    title: string;
    description: string;
    scheduledStartTime: string | null;
    actualStartTime: string | null;
    actualEndTime: string | null;
    status: 'Scheduled' | 'Live' | 'Completed';
    creatorId: string;
    creatorName: string;
    createdAt: string;
}

export const getSessions = async (): Promise<SessionData[]> => {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return response.json();
};

export const createSession = async (title: string, description: string, scheduledStartTime?: string) => {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title, description, scheduledStartTime: scheduledStartTime || null }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
    }
    return response.json();
};

export const updateSession = async (sessionId: string, title: string, description: string, scheduledStartTime?: string) => {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ title, description, scheduledStartTime: scheduledStartTime || null }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update session');
    }
    return response.json();
};

export const deleteSession = async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete session');
};

export const endSession = async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: authHeaders(),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to end session');
    }
    return response.json();
};

// Chat APIs
export interface ChatMessage {
    messageId: string;
    senderId: string;
    senderName: string;
    receiverId: string;
    receiverName: string;
    messageText: string;
    timestamp: string;
}

export interface ChatPartner {
    userId: string;
    fullName: string;
    email: string;
    userType: string;
    lastMessage?: string;
    lastMessageTime?: string;
}

export const sendChatMessage = async (receiverId: string, messageText: string): Promise<ChatMessage> => {
    const response = await fetch(`${API_BASE_URL}/chat/send`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ receiverId, messageText }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
};

export const getConversation = async (otherUserId: string): Promise<ChatMessage[]> => {
    const response = await fetch(`${API_BASE_URL}/chat/conversation/${otherUserId}`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to load conversation');
    return response.json();
};

export const getChatPartners = async (): Promise<ChatPartner[]> => {
    const response = await fetch(`${API_BASE_URL}/chat/partners`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to load chat partners');
    return response.json();
};

export const searchUsers = async (query: string): Promise<ChatPartner[]> => {
    const response = await fetch(`${API_BASE_URL}/chat/users/search?q=${encodeURIComponent(query)}`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
};

// Session Chat APIs
export interface SessionChatMessage {
    id: string;
    sessionId: string;
    senderId: string;
    senderName: string;
    messageText: string;
    timestamp: string;
}

export const saveSessionChatMessage = async (
    sessionId: string, senderName: string, messageText: string
): Promise<SessionChatMessage> => {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ senderName, messageText }),
    });
    if (!response.ok) throw new Error('Failed to save session chat message');
    return response.json();
};

export const getSessionChatHistory = async (sessionId: string): Promise<SessionChatMessage[]> => {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/chat`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to load session chat history');
    return response.json();
};