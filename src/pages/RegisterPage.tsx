import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/api';
import { Form, Input, Button, Card, Typography, Alert, Space, Segmented } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function RegisterPage() {
    const [userType, setUserType] = useState<string>('Student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (values: { fullName: string; email: string; password: string }) => {
        setError('');
        setLoading(true);
        try {
            const data = await registerUser(values.fullName, values.email, values.password, userType);
            login(data.token, {
                userId: data.userId,
                fullName: data.fullName,
                email: data.email,
                userType: data.userType,
            });
            if (data.userType === 'Student') {
                navigate('/student');
            } else {
                navigate('/instructor');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
            <Card style={{ width: 450, borderRadius: 12 }} bordered={false}>
                <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 24 }}>
                    <Title level={3} style={{ margin: 0 }}>Create Account</Title>
                    <Text type="secondary">Register to join live sessions</Text>
                </Space>

                {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

                <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
                    <Form.Item
                        label="Full Name"
                        name="fullName"
                        rules={[{ required: true, message: 'Please enter your full name' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Enter your full name" size="large" />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter your email' },
                            { type: 'email', message: 'Enter a valid email' },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="Enter your email" size="large" />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                            { required: true, message: 'Please enter a password' },
                            { min: 6, message: 'Password must be at least 6 characters' },
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Create a password" size="large" />
                    </Form.Item>

                    <Form.Item label="I am a...">
                        <Segmented
                            options={[
                                { label: '🎓 Student', value: 'Student' },
                                { label: '👨‍🏫 Instructor', value: 'Instructor' },
                            ]}
                            value={userType}
                            onChange={(val) => setUserType(val as string)}
                            block
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block size="large">
                            Create Account
                        </Button>
                    </Form.Item>
                </Form>

                <Text style={{ display: 'block', textAlign: 'center' }}>
                    Already have an account? <Link to="/login">Sign in here</Link>
                </Text>
            </Card>
        </div>
    );
}
