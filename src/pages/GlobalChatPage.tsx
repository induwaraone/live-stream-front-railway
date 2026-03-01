import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getChatPartners, getConversation, sendChatMessage, searchUsers } from '../services/api';
import type { ChatPartner, ChatMessage } from '../services/api';
import {
    Layout, Input, Button, List, Avatar, Typography, Space, Empty, Spin, message
} from 'antd';
import {
    ArrowLeftOutlined, SendOutlined, SearchOutlined, UserOutlined, MessageOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

export default function GlobalChatPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [partners, setPartners] = useState<ChatPartner[]>([]);
    const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ChatPartner[]>([]);
    const [loadingPartners, setLoadingPartners] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load chat partners
    useEffect(() => {
        const load = async () => {
            setLoadingPartners(true);
            try {
                const data = await getChatPartners();
                setPartners(data);
            } catch {
                message.error('Failed to load contacts');
            } finally {
                setLoadingPartners(false);
            }
        };
        load();
    }, []);

    // Load conversation when partner selected
    useEffect(() => {
        if (!selectedPartner) return;
        const loadConvo = async () => {
            setLoadingMessages(true);
            try {
                const data = await getConversation(selectedPartner.userId);
                setMessages(data);
            } catch {
                message.error('Failed to load messages');
            } finally {
                setLoadingMessages(false);
            }
        };
        loadConvo();
        const interval = setInterval(loadConvo, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [selectedPartner]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Search users
    useEffect(() => {
        if (!searchQuery.trim()) { setSearchResults([]); return; }
        const timer = setTimeout(async () => {
            try {
                const results = await searchUsers(searchQuery);
                setSearchResults(results);
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
            // Add partner to list if new
            if (!partners.find(p => p.userId === selectedPartner.userId)) {
                setPartners(prev => [selectedPartner, ...prev]);
            }
        } catch {
            message.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const selectPartner = (partner: ChatPartner) => {
        setSelectedPartner(partner);
        setSearchQuery('');
        setSearchResults([]);
    };

    const displayList = searchQuery.trim() ? searchResults : partners;

    return (
        <Layout style={{ height: '100vh' }}>
            <Header style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#fff', padding: '0 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}>
                <Space>
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
                    <Title level={4} style={{ margin: 0 }}>
                        <MessageOutlined /> Messages
                    </Title>
                </Space>
                <Text type="secondary">{user?.fullName}</Text>
            </Header>
            <Layout>
                {/* Contacts Sidebar */}
                <Sider width={320} style={{ background: '#fff', borderRight: '1px solid #f0f0f0', overflow: 'auto' }}>
                    <div style={{ padding: '12px 16px' }}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            allowClear
                        />
                    </div>
                    {loadingPartners ? (
                        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                    ) : displayList.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={searchQuery ? 'No users found' : 'No conversations yet. Search for a user to start chatting!'}
                            style={{ padding: 20 }}
                        />
                    ) : (
                        <List
                            dataSource={displayList}
                            renderItem={(partner) => (
                                <List.Item
                                    onClick={() => selectPartner(partner)}
                                    style={{
                                        cursor: 'pointer', padding: '12px 16px',
                                        background: selectedPartner?.userId === partner.userId ? '#e6f4ff' : 'transparent',
                                    }}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar icon={<UserOutlined />} style={{
                                            backgroundColor: partner.userType === 'Instructor' ? '#722ed1' : '#1677ff'
                                        }} />}
                                        title={partner.fullName}
                                        description={<Text type="secondary" style={{ fontSize: 12 }}>{partner.userType} · {partner.email}</Text>}
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </Sider>

                {/* Conversation Panel */}
                <Content style={{ display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
                    {!selectedPartner ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Empty description="Select a conversation or search for a user to start chatting" />
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div style={{
                                padding: '12px 24px', background: '#fff',
                                borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12
                            }}>
                                <Avatar icon={<UserOutlined />} style={{
                                    backgroundColor: selectedPartner.userType === 'Instructor' ? '#722ed1' : '#1677ff'
                                }} />
                                <div>
                                    <Text strong>{selectedPartner.fullName}</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 12 }}>{selectedPartner.userType}</Text>
                                </div>
                            </div>

                            {/* Messages */}
                            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
                                {loadingMessages ? (
                                    <div style={{ textAlign: 'center', paddingTop: 40 }}><Spin /></div>
                                ) : messages.length === 0 ? (
                                    <div style={{ textAlign: 'center', paddingTop: 60 }}>
                                        <Text type="secondary">No messages yet. Say hello! 👋</Text>
                                    </div>
                                ) : (
                                    messages.map(msg => {
                                        const isMe = msg.senderId === user?.userId;
                                        return (
                                            <div key={msg.messageId} style={{
                                                display: 'flex',
                                                justifyContent: isMe ? 'flex-end' : 'flex-start',
                                                marginBottom: 8,
                                            }}>
                                                <div style={{
                                                    maxWidth: '70%',
                                                    padding: '8px 14px',
                                                    borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                                    background: isMe ? '#1677ff' : '#fff',
                                                    color: isMe ? '#fff' : '#000',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                                }}>
                                                    <div style={{ fontSize: 14, wordBreak: 'break-word' }}>{msg.messageText}</div>
                                                    <div style={{
                                                        fontSize: 11, marginTop: 4, textAlign: 'right',
                                                        color: isMe ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.35)'
                                                    }}>
                                                        {dayjs(msg.timestamp).format('h:mm A')}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Bar */}
                            <div style={{
                                padding: '12px 24px', background: '#fff',
                                borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8
                            }}>
                                <Input
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onPressEnter={handleSend}
                                    size="large"
                                />
                                <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    onClick={handleSend}
                                    loading={sending}
                                    size="large"
                                    disabled={!newMessage.trim()}
                                />
                            </div>
                        </>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
}
