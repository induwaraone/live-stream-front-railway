import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessions } from '../services/api';
import type { SessionData } from '../services/api';
import { Button, Typography, Card, Tag, Row, Col, Empty, Spin, message } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import DashboardLayout from '../components/DashboardLayout';
import dayjs from 'dayjs';

const { Text } = Typography;

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
    }, []);

    const statusColor = (status: string) => {
        if (status === 'Live') return 'green';
        if (status === 'Scheduled') return 'blue';
        return 'default';
    };

    return (
        <DashboardLayout role="Student">
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
        </DashboardLayout>
    );
}
