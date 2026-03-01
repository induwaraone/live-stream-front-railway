import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function LoginPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (values: { email: string; password: string }) => {
        setError('');
        setLoading(true);
        try {
            const data = await loginUser(values.email, values.password);
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
            <Card style={{ width: 420, borderRadius: 12 }} bordered={false}>
                <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 24 }}>
                    <Title level={3} style={{ margin: 0 }}>Sign In</Title>
                    <Text type="secondary">Welcome back to your LMS account</Text>
                </Space>

                {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

                <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
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
                        rules={[{ required: true, message: 'Please enter your password' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" size="large" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block size="large">
                            Sign In
                        </Button>
                    </Form.Item>
                </Form>

                <Text style={{ display: 'block', textAlign: 'center' }}>
                    Don't have an account? <Link to="/register">Register here</Link>
                </Text>
            </Card>
        </div>
    );
}
