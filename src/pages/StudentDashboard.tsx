import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessions } from '../services/api';
import type { SessionData } from '../services/api';
import { Button, Typography, Card, Tag, Row, Col, Empty, Spin, message, Divider } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import DashboardLayout from '../components/DashboardLayout';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

export default function StudentDashboard() {
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
        // Re-fetch every 30s so Scheduled→Live transitions appear automatically
        const interval = setInterval(async () => {
            try {
                setSessions(await getSessions());
            } catch { /* silent */ }
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const statusColor = (status: string) => {
        if (status === 'Live') return 'green';
        if (status === 'Scheduled') return 'blue';
        return 'default';
    };

    return (
        <DashboardLayout role="Student">
            <div style={{
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                padding: 24,
                minHeight: 'calc(100vh - 56px - 48px)',
                display: 'flex',
                flexDirection: 'column',
            }}>
                <Title level={4} style={{ marginBottom: 0, marginTop: 0 }}>Sessions</Title>
                <Divider style={{ marginTop: 12, marginBottom: 24 }} />
                {loading ? (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div>
                ) : sessions.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Empty description="No sessions available right now. Check back later!" />
                    </div>
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
            </div>
        </DashboardLayout>
    );
}
