import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { fetchLiveKitToken } from '../services/api';
import type { LiveKitTokenResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChatPersistence from '../components/ChatPersistence';
import { Layout, Button, Typography, Space, Spin, Result } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function ClassroomPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tokenData, setTokenData] = useState<LiveKitTokenResponse | null>(null);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // const serverUrl = "ws://100.124.9.102:7880";
    const serverUrl = "wss://livestreaming-403ul19a.livekit.cloud"

    useEffect(() => {
        if (!sessionId) return;
        const getToken = async () => {
            setLoading(true);
            try {
                const data = await fetchLiveKitToken(sessionId);
                setTokenData(data);
            } catch (err: any) {
                setError(err.message || 'Failed to connect to classroom');
            } finally {
                setLoading(false);
            }
        };
        getToken();
    }, [sessionId]);

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Space direction="vertical" align="center">
                    <Spin size="large" />
                    <Text type="secondary">Connecting to classroom...</Text>
                </Space>
            </div>
        );
    }

    if (error || !tokenData) {
        return (
            <Result
                status="error"
                title="Failed to join classroom"
                subTitle={error || 'Unknown error'}
                extra={<Button type="primary" onClick={() => navigate(-1)}>Go Back</Button>}
            />
        );
    }

    const isModerator = tokenData.isModerator === 'true';

    return (
        <Layout style={{ height: '100vh' }}>
            <Header style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#1a1a2e', padding: '0 24px', height: 56
            }}>
                <Space>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(-1)}
                        style={{ color: '#fff' }}
                    />
                    <Title level={5} style={{ margin: 0, color: '#fff' }}>
                        Classroom
                    </Title>
                </Space>
                <Space>
                    {isModerator && (
                        <Text style={{ color: '#52c41a', fontSize: 12, fontWeight: 600 }}>
                            ● MODERATOR
                        </Text>
                    )}
                    <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                        {user?.fullName}
                    </Text>
                </Space>
            </Header>
            <Content style={{ background: '#111', overflow: 'hidden' }}>
                <LiveKitRoom
                    video={true}
                    audio={true}
                    token={tokenData.token}
                    serverUrl={serverUrl}
                    data-lk-theme="default"
                    onDisconnected={() => navigate(-1)}
                    style={{ height: 'calc(100vh - 56px)' }}
                >
                    <VideoConference />
                    <RoomAudioRenderer />
                    <ChatPersistence sessionId={sessionId!} senderName={user?.fullName || 'Unknown'} />
                </LiveKitRoom>
            </Content>
        </Layout>
    );
}