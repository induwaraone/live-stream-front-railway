import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Layout, Button, Typography, Space, Empty } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function InstructorDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Title level={4} style={{ margin: 0 }}>👨‍🏫 Instructor Dashboard</Title>
                <Space>
                    <Text>Welcome, {user?.fullName}</Text>
                    <Button icon={<LogoutOutlined />} onClick={handleLogout} danger>Logout</Button>
                </Space>
            </Header>
            <Content style={{ padding: 32 }}>
                <Empty description="Session management will be implemented in Phase 3." />
            </Content>
        </Layout>
    );
}
