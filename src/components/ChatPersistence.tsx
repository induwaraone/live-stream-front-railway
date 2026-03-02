import { useEffect, useRef } from 'react';
import { useChat } from '@livekit/components-react';
import { saveSessionChatMessage } from '../services/api';

interface ChatPersistenceProps {
    sessionId: string;
    senderName: string;
}

/**
 * This component sits inside <LiveKitRoom> and watches the LiveKit chat messages.
 * Whenever a new message from the current user is detected, it persists it to the backend.
 * Received messages from others are also saved (deduplicated server-side by timestamp).
 */
export default function ChatPersistence({ sessionId, senderName }: ChatPersistenceProps) {
    const { chatMessages } = useChat();
    const savedCountRef = useRef(0);

    useEffect(() => {
        // Only process new messages since last check
        const newMessages = chatMessages.slice(savedCountRef.current);
        if (newMessages.length === 0) return;

        savedCountRef.current = chatMessages.length;

        for (const msg of newMessages) {
            const messageText = msg.message;
            const msgSenderName = msg.from?.name || msg.from?.identity || senderName;

            if (messageText) {
                saveSessionChatMessage(sessionId, msgSenderName, messageText).catch(() => {
                    // Silently fail — chat delivery via LiveKit is the primary mechanism
                });
            }
        }
    }, [chatMessages, sessionId, senderName]);

    // This component renders nothing — it only listens
    return null;
}
