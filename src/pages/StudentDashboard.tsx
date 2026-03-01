import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getSessions } from '../services/api';
import type { SessionData } from '../services/api';
import { Layout, Button, Typography, Space, Card, Tag, Row, Col, Empty, Spin, message } from 'antd';
import { LogoutOutlined, VideoCameraOutlined, MessageOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            setLoading(true);
            try {
                const data = await getSessions();
                setSessions(data);
            } catch {
                message.error('Failed to load sessions');
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const statusColor = (status: string) => {
        if (status === 'Live') return 'green';
        if (status === 'Scheduled') return 'blue';
        return 'default';
    };

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Title level={4} style={{ margin: 0 }}>🎓 Student Dashboard</Title>
                <Space>
                    <Text>Welcome, {user?.fullName}</Text>
                    <Button icon={<MessageOutlined />} onClick={() => navigate('/chat')}>Messages</Button>
                    <Button icon={<LogoutOutlined />} onClick={handleLogout} danger>Logout</Button>
                </Space>
            </Header>

            <Content style={{ padding: 32 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', paddingTop: 60 }}><Spin size="large" /></div>
                ) : sessions.length === 0 ? (
                    <Empty description="No sessions available right now. Check back later!" />
                ) : (
                    <Row gutter={[16, 16]}>
                        {sessions.map(session => (
                            <Col xs={24} sm={12} lg={8} key={session.sessionId}>
                                <Card
                                    title={session.title}
                                    extra={<Tag color={statusColor(session.status)}>{session.status}</Tag>}
                                    actions={
                                        session.status === 'Live'
                                            ? [
                                                <Button type="primary" icon={<VideoCameraOutlined />} onClick={() => navigate(`/classroom/${session.sessionId}`)}>
                                                    Join Session
                                                </Button>
                                            ]
                                            : [
                                                <Button disabled>
                                                    Upcoming
                                                </Button>
                                            ]
                                    }
                                >
                                    <Text type="secondary">{session.description || 'No description'}</Text>
                                    <div style={{ marginTop: 8 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Instructor: {session.creatorName}
                                            {session.scheduledStartTime && ` · Starts: ${dayjs(session.scheduledStartTime).format('MMM D, YYYY h:mm A')}`}
                                        </Text>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Content>
        </Layout>
    );
}
