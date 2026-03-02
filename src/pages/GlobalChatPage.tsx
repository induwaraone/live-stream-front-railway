import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getChatPartners, getConversation, sendChatMessage, searchUsers } from '../services/api';
import type { ChatPartner, ChatMessage } from '../services/api';
import {
    Layout, Input, Button, List, Avatar, Typography, Empty, Spin, message, Grid
} from 'antd';
import {
    SendOutlined, SearchOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import DashboardLayout from '../components/DashboardLayout';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';

dayjs.extend(relativeTime);
dayjs.extend(calendar);

const { Sider, Content } = Layout;
const { Text, Title } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

// Helper: get initials from full name
function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Helper: format relative time for the partner list
function formatListTime(time?: string) {
    if (!time) return '';
    const d = dayjs(time);
    const now = dayjs();
    if (now.diff(d, 'minute') < 1) return 'Just now';
    if (now.diff(d, 'hour') < 1) return d.fromNow();
    if (d.isSame(now, 'day')) return d.format('h:mm A');
    if (d.isSame(now.subtract(1, 'day'), 'day')) return 'Yesterday';
    if (d.isSame(now, 'week')) return d.format('ddd');
    return d.format('MMM D');
}

// Helper: get date label for message grouping
function getDateLabel(time: string) {
    const d = dayjs(time);
    const now = dayjs();
    if (d.isSame(now, 'day')) return 'Today';
    if (d.isSame(now.subtract(1, 'day'), 'day')) return 'Yesterday';
    if (d.isSame(now, 'week')) return d.format('dddd');
    return d.format('MMMM D, YYYY');
}

// Color palette for avatars
const avatarColors = ['#1677ff', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16', '#52c41a', '#2f54eb'];
function getAvatarColor(userId: string) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function GlobalChatPage() {
    const { user } = useAuth();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const [partners, setPartners] = useState<ChatPartner[]>([]);
    const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ChatPartner[]>([]);
    const [loadingPartners, setLoadingPartners] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [showConversation, setShowConversation] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load partners
    useEffect(() => {
        const load = async () => {
            setLoadingPartners(true);
            try {
                setPartners(await getChatPartners());
            } catch {
                message.error('Failed to load contacts');
            } finally {
                setLoadingPartners(false);
            }
        };
        load();
    }, []);

    // Load conversation + poll
    useEffect(() => {
        if (!selectedPartner) return;
        const loadConvo = async () => {
            setLoadingMessages(true);
            try {
                setMessages(await getConversation(selectedPartner.userId));
            } catch {
                message.error('Failed to load messages');
            } finally {
                setLoadingMessages(false);
            }
        };
        loadConvo();
        const interval = setInterval(async () => {
            try {
                setMessages(await getConversation(selectedPartner.userId));
            } catch { /* silent */ }
        }, 4000);
        return () => clearInterval(interval);
    }, [selectedPartner]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Search users
    useEffect(() => {
        if (!searchQuery.trim()) { setSearchResults([]); return; }
        const timer = setTimeout(async () => {
            try {
                setSearchResults(await searchUsers(searchQuery));
            } catch { /* ignore */ }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSend = async () => {
        if (!newMessage.trim() || !selectedPartner) return;
        setSending(true);
        try {
            const sent = await sendChatMessage(selectedPartner.userId, newMessage.trim());
            setMessages(prev => [...prev, sent]);
            setNewMessage('');
            // Update partner's last message in the list
            setPartners(prev => {
                const updated = prev.map(p =>
                    p.userId === selectedPartner.userId
                        ? { ...p, lastMessage: sent.messageText, lastMessageTime: sent.timestamp }
                        : p
                );
                // Move this partner to top
                const partner = updated.find(p => p.userId === selectedPartner.userId);
                if (partner) {
                    return [partner, ...updated.filter(p => p.userId !== selectedPartner.userId)];
                }
                return updated;
            });
        } catch {
            message.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const selectPartner = (partner: ChatPartner) => {
        setSelectedPartner(partner);
        setSearchQuery('');
        setSearchResults([]);
        if (isMobile) setShowConversation(true);
    };

    const displayList = searchQuery.trim() ? searchResults : partners;

    // ─── Contacts Sidebar ────────────────────────────
    const contactsList = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header + Search */}
            <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
                <Title level={4} style={{ margin: '0 0 12px 0' }}>Messages</Title>
                <Input
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder="Search people"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    allowClear
                    style={{ borderRadius: 8 }}
                />
            </div>

            {/* Partner list */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {loadingPartners ? (
                    <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                ) : displayList.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={searchQuery ? 'No users found' : 'No conversations yet'}
                        style={{ padding: 40 }}
                    />
                ) : (
                    <List
                        dataSource={displayList}
                        renderItem={(partner) => {
                            const isActive = selectedPartner?.userId === partner.userId;
                            return (
                                <div
                                    onClick={() => selectPartner(partner)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        background: isActive ? '#e6f4ff' : 'transparent',
                                        borderLeft: isActive ? '3px solid #1677ff' : '3px solid transparent',
                                        transition: 'all 0.15s ease',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive) e.currentTarget.style.background = '#fafafa';
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <Avatar
                                        size={40}
                                        style={{
                                            backgroundColor: getAvatarColor(partner.userId),
                                            flexShrink: 0,
                                            fontSize: 14,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {getInitials(partner.fullName)}
                                    </Avatar>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                            <Text strong style={{ fontSize: 14 }}>{partner.fullName}</Text>
                                            {partner.lastMessageTime && (
                                                <Text type="secondary" style={{ fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
                                                    {formatListTime(partner.lastMessageTime)}
                                                </Text>
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: 12,
                                            color: '#8c8c8c',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            marginTop: 2,
                                        }}>
                                            {partner.lastMessage || partner.email}
                                        </div>
                                    </div>
                                </div>
                            );
                        }}
                    />
                )}
            </div>
        </div>
    );

    // ─── Message Grouping Helpers ─────────────────────
    const renderMessages = () => {
        if (loadingMessages) {
            return <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin /></div>;
        }
        if (messages.length === 0) {
            return (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                    <Avatar size={64} style={{ backgroundColor: selectedPartner ? getAvatarColor(selectedPartner.userId) : '#ccc', fontSize: 24 }}>
                        {selectedPartner ? getInitials(selectedPartner.fullName) : '?'}
                    </Avatar>
                    <Title level={5} style={{ margin: 0 }}>{selectedPartner?.fullName}</Title>
                    <Text type="secondary">Start a conversation</Text>
                </div>
            );
        }

        const elements: React.ReactNode[] = [];
        let lastDate = '';
        let lastSenderId = '';

        messages.forEach((msg, idx) => {
            const dateLabel = getDateLabel(msg.timestamp);
            const isMe = msg.senderId === user?.userId;

            // Date separator
            if (dateLabel !== lastDate) {
                elements.push(
                    <div key={`date-${idx}`} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        margin: '16px 0', padding: '0 16px',
                    }}>
                        <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
                        <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {dateLabel}
                        </Text>
                        <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
                    </div>
                );
                lastDate = dateLabel;
                lastSenderId = '';
            }

            // Is this a continuation from the same sender?
            const isContinuation = msg.senderId === lastSenderId;

            if (isMe) {
                // Sent message — right aligned, no avatar
                elements.push(
                    <div key={msg.messageId} style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        padding: `${isContinuation ? 1 : 8}px 16px 1px 60px`,
                    }}>
                        <div>
                            {!isContinuation && (
                                <div style={{ textAlign: 'right', marginBottom: 4 }}>
                                    <Text style={{ fontSize: 12, fontWeight: 600, color: '#595959' }}>You</Text>
                                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                                        {dayjs(msg.timestamp).format('h:mm A')}
                                    </Text>
                                </div>
                            )}
                            <div style={{
                                padding: '8px 14px',
                                borderRadius: '8px 8px 2px 8px',
                                background: '#e6f0ff',
                                color: '#141414',
                                fontSize: 14,
                                lineHeight: '1.5',
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-wrap',
                                maxWidth: 480,
                            }}>
                                {msg.messageText}
                            </div>
                        </div>
                    </div>
                );
            } else {
                // Received message — left aligned with avatar
                elements.push(
                    <div key={msg.messageId} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: `${isContinuation ? 1 : 8}px 60px 1px 16px`,
                    }}>
                        {/* Avatar or spacer for continuation */}
                        <div style={{ width: 32, flexShrink: 0 }}>
                            {!isContinuation && selectedPartner && (
                                <Avatar size={32} style={{
                                    backgroundColor: getAvatarColor(selectedPartner.userId),
                                    fontSize: 12,
                                    fontWeight: 600,
                                }}>
                                    {getInitials(selectedPartner.fullName)}
                                </Avatar>
                            )}
                        </div>
                        <div>
                            {!isContinuation && (
                                <div style={{ marginBottom: 4 }}>
                                    <Text style={{ fontSize: 12, fontWeight: 600, color: '#595959' }}>
                                        {msg.senderName}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                                        {dayjs(msg.timestamp).format('h:mm A')}
                                    </Text>
                                </div>
                            )}
                            <div style={{
                                padding: '8px 14px',
                                borderRadius: '8px 8px 8px 2px',
                                background: '#fff',
                                color: '#141414',
                                fontSize: 14,
                                lineHeight: '1.5',
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-wrap',
                                maxWidth: 480,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                            }}>
                                {msg.messageText}
                            </div>
                        </div>
                    </div>
                );
            }

            lastSenderId = msg.senderId;
        });

        return (
            <div style={{ flex: 1, overflow: 'auto', paddingBottom: 8 }}>
                {elements}
                <div ref={messagesEndRef} />
            </div>
        );
    };

    // ─── Conversation Panel ──────────────────────────
    const conversationPanel = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fafafa' }}>
            {!selectedPartner ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>💬</div>
                    <Title level={5} style={{ margin: 0, color: '#8c8c8c' }}>Select a chat to get started</Title>
                    <Text type="secondary">Or search for someone to message</Text>
                </div>
            ) : (
                <>
                    {/* Chat header */}
                    <div style={{
                        padding: '10px 16px',
                        background: '#fff',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flexShrink: 0,
                    }}>
                        {isMobile && (
                            <Button
                                type="text"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => setShowConversation(false)}
                                style={{ marginRight: 4 }}
                            />
                        )}
                        <Avatar size={36} style={{
                            backgroundColor: getAvatarColor(selectedPartner.userId),
                            fontSize: 14,
                            fontWeight: 600,
                        }}>
                            {getInitials(selectedPartner.fullName)}
                        </Avatar>
                        <div>
                            <Text strong style={{ fontSize: 14 }}>{selectedPartner.fullName}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>{selectedPartner.userType}</Text>
                        </div>
                    </div>

                    {/* Messages area */}
                    {renderMessages()}

                    {/* Input area */}
                    <div style={{
                        padding: '12px 16px',
                        background: '#fff',
                        borderTop: '1px solid #f0f0f0',
                        flexShrink: 0,
                    }}>
                        <div style={{
                            display: 'flex',
                            gap: 8,
                            alignItems: 'flex-end',
                            background: '#f5f5f5',
                            borderRadius: 8,
                            padding: '8px 12px',
                        }}>
                            <TextArea
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoSize={{ minRows: 1, maxRows: 4 }}
                                variant="borderless"
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    resize: 'none',
                                    fontSize: 14,
                                    padding: 0,
                                }}
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={handleSend}
                                loading={sending}
                                disabled={!newMessage.trim()}
                                style={{ borderRadius: 8, flexShrink: 0 }}
                            />
                        </div>
                        <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                            Press Enter to send, Shift+Enter for new line
                        </Text>
                    </div>
                </>
            )}
        </div>
    );

    // ─── Layout ──────────────────────────────────────
    return (
        <DashboardLayout>
            <Layout style={{
                height: 'calc(100vh - 56px - 48px)',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
                {isMobile ? (
                    showConversation ? (
                        <Content style={{ background: '#fafafa' }}>
                            {conversationPanel}
                        </Content>
                    ) : (
                        <div style={{ background: '#fff', height: '100%', overflow: 'auto' }}>
                            {contactsList}
                        </div>
                    )
                ) : (
                    <>
                        <Sider width={340} style={{
                            background: '#fff',
                            borderRight: '1px solid #f0f0f0',
                            overflow: 'hidden',
                        }}>
                            {contactsList}
                        </Sider>
                        <Content style={{ background: '#fafafa' }}>
                            {conversationPanel}
                        </Content>
                    </>
                )}
            </Layout>
        </DashboardLayout>
    );
}
