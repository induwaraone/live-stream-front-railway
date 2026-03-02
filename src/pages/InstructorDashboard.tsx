import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSessions, createSession, updateSession, deleteSession, endSession } from '../services/api';
import type { SessionData } from '../services/api';
import {
    Button, Typography, Card, Tag, Row, Col, Modal, Form, Input, DatePicker, Divider,
    message, Popconfirm, Empty, Spin, Space
} from 'antd';
import {
    PlusOutlined, CalendarOutlined, EditOutlined, DeleteOutlined,
    PlayCircleOutlined, StopOutlined, VideoCameraOutlined
} from '@ant-design/icons';
import DashboardLayout from '../components/DashboardLayout';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;

export default function InstructorDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editSession, setEditSession] = useState<SessionData | null>(null);
    const [isSchedule, setIsSchedule] = useState(false);
    const [form] = Form.useForm();

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

    useEffect(() => {
        fetchSessions();
        // Re-fetch every 30s so Scheduled→Live transitions appear automatically
        const interval = setInterval(async () => {
            try {
                setSessions(await getSessions());
            } catch { /* silent */ }
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const openCreateModal = (schedule: boolean) => {
        setEditSession(null);
        setIsSchedule(schedule);
        form.resetFields();
        setModalOpen(true);
    };

    const openEditModal = (session: SessionData) => {
        setEditSession(session);
        setIsSchedule(!!session.scheduledStartTime);
        form.setFieldsValue({
            title: session.title,
            description: session.description,
            scheduledStartTime: session.scheduledStartTime ? dayjs(session.scheduledStartTime) : undefined,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (values: any) => {
        try {
            const scheduled = values.scheduledStartTime ? values.scheduledStartTime.format('YYYY-MM-DDTHH:mm:ss') : undefined;
            if (editSession) {
                await updateSession(editSession.sessionId, values.title, values.description || '', scheduled);
                message.success('Session updated');
            } else {
                await createSession(values.title, values.description || '', scheduled);
                message.success(scheduled ? 'Session scheduled' : 'Session created & is now live');
            }
            setModalOpen(false);
            fetchSessions();
        } catch (err: any) {
            message.error(err.message);
        }
    };

    const handleDelete = async (sessionId: string) => {
        try {
            await deleteSession(sessionId);
            message.success('Session deleted');
            fetchSessions();
        } catch {
            message.error('Failed to delete session');
        }
    };

    const handleEnd = async (sessionId: string) => {
        try {
            await endSession(sessionId);
            message.success('Session ended');
            fetchSessions();
        } catch {
            message.error('Failed to end session');
        }
    };

    const statusColor = (status: string) => {
        if (status === 'Live') return 'green';
        if (status === 'Scheduled') return 'blue';
        return 'default';
    };

    return (
        <DashboardLayout role="Instructor">
            <div style={{
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                padding: 24,
                minHeight: 'calc(100vh - 56px - 48px)',
                display: 'flex',
                flexDirection: 'column',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0 }}>Sessions</Title>
                    <Space wrap>
                        <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => openCreateModal(false)}>
                            Go Live Now
                        </Button>
                        <Button icon={<CalendarOutlined />} onClick={() => openCreateModal(true)}>
                            Schedule Session
                        </Button>
                    </Space>
                </div>
                <Divider style={{ marginTop: 0, marginBottom: 24 }} />

                {loading ? (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div>
                ) : sessions.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Empty description="No active sessions. Create one to get started!" />
                    </div>
                ) : (
                    <Row gutter={[16, 16]}>
                        {sessions.map(session => {
                            const isMine = session.creatorId === user?.userId;
                            return (
                                <Col xs={24} sm={12} lg={8} key={session.sessionId}>
                                    <Card
                                        title={session.title}
                                        extra={<Tag color={statusColor(session.status)}>{session.status}</Tag>}
                                        actions={[
                                            ...(session.status === 'Live' ? [
                                                <Button type="link" icon={<VideoCameraOutlined />} onClick={() => navigate(`/classroom/${session.sessionId}`)}>Join</Button>
                                            ] : []),
                                            ...(isMine && session.status === 'Live' ? [
                                                <Popconfirm title="End this session?" onConfirm={() => handleEnd(session.sessionId)}>
                                                    <Button type="link" danger icon={<StopOutlined />}>End</Button>
                                                </Popconfirm>
                                            ] : []),
                                            ...(isMine ? [
                                                <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(session)}>Edit</Button>,
                                                <Popconfirm title="Delete this session?" onConfirm={() => handleDelete(session.sessionId)}>
                                                    <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
                                                </Popconfirm>
                                            ] : []),
                                        ]}
                                    >
                                        <Text type="secondary">{session.description || 'No description'}</Text>
                                        <div style={{ marginTop: 8 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                By {session.creatorName}
                                                {session.scheduledStartTime && ` · Scheduled: ${dayjs(session.scheduledStartTime).format('MMM D, YYYY h:mm A')}`}
                                            </Text>
                                        </div>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </div>

            <Modal
                title={editSession ? 'Edit Session' : (isSchedule ? 'Schedule Session' : 'Create Live Session')}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter a title' }]}>
                        <Input placeholder="e.g. Math 101 - Lecture 5" size="large" />
                    </Form.Item>
                    <Form.Item label="Description" name="description">
                        <TextArea rows={3} placeholder="Optional description" />
                    </Form.Item>
                    {isSchedule && (
                        <Form.Item label="Scheduled Start Time" name="scheduledStartTime" rules={[{ required: true, message: 'Select a date and time' }]}>
                            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} size="large" />
                        </Form.Item>
                    )}
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block size="large" icon={<PlusOutlined />}>
                            {editSession ? 'Save Changes' : (isSchedule ? 'Schedule Session' : 'Go Live Now')}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </DashboardLayout>
    );
}
