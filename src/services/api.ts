const API_BASE_URL = 'http://localhost:8080/api';

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

// LiveKit token (now requires auth)
export const fetchLiveKitToken = async (roomName: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/livekit/token?roomName=${roomName}`, {
        headers: authHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch token');
    }
    const data = await response.json();
    return data.token;
};