import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout, Menu, Typography, Avatar, Badge, Grid } from 'antd';
import {
    VideoCameraOutlined,
    MessageOutlined,
    LogoutOutlined,
    UserOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

interface DashboardLayoutProps {
    children: ReactNode;
    role: 'Student' | 'Instructor';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const [collapsed, setCollapsed] = useState(false);

    // Auto-collapse on mobile
    useEffect(() => {
        setCollapsed(isMobile);
    }, [isMobile]);

    const dashboardPath = role === 'Student' ? '/student' : '/instructor';

    const menuItems = [
        {
            key: dashboardPath,
            icon: <VideoCameraOutlined />,
            label: 'Sessions',
        },
        {
            key: '/chat',
            icon: <MessageOutlined />,
            label: 'Messages',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            danger: true,
        },
    ];

    const selectedKey = location.pathname.startsWith('/chat') ? '/chat' : dashboardPath;

    const handleMenuClick = (info: { key: string }) => {
        if (info.key === 'logout') {
            logout();
            navigate('/login');
        } else {
            navigate(info.key);
        }
    };

    const roleColor = role === 'Instructor' ? '#722ed1' : '#1677ff';
    const roleEmoji = role === 'Instructor' ? '👨‍🏫' : '🎓';

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                trigger={null}
                width={240}
                collapsedWidth={isMobile ? 0 : 72}
                breakpoint="md"
                className="dashboard-sider"
                style={{
                    background: 'linear-gradient(180deg, #001529 0%, #002140 100%)',
                    boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
                    position: isMobile ? 'fixed' : 'relative',
                    height: '100vh',
                    zIndex: 100,
                    left: isMobile && collapsed ? -240 : 0,
                    transition: 'all 0.2s ease',
                }}
            >
                {/* Logo / User Info */}
                <div style={{
                    padding: collapsed && !isMobile ? '20px 12px' : '20px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                }}>
                    <Avatar
                        size={collapsed && !isMobile ? 36 : 56}
                        icon={<UserOutlined />}
                        style={{
                            backgroundColor: roleColor,
                            marginBottom: 8,
                            transition: 'all 0.2s ease',
                        }}
                    />
                    {(!collapsed || isMobile) && (
                        <div>
                            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 600, display: 'block' }}>
                                {user?.fullName}
                            </Text>
                            <Badge
                                count={`${roleEmoji} ${role}`}
                                style={{
                                    backgroundColor: roleColor,
                                    fontSize: 11,
                                    marginTop: 4,
                                }}
                            />
                        </div>
                    )}
                </div>

                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    onClick={handleMenuClick}
                    items={menuItems}
                    style={{
                        background: 'transparent',
                        borderRight: 0,
                        marginTop: 8,
                    }}
                />
            </Sider>

            {/* Mobile overlay */}
            {isMobile && !collapsed && (
                <div
                    onClick={() => setCollapsed(true)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        zIndex: 99,
                        transition: 'opacity 0.2s ease',
                    }}
                />
            )}

            <Layout>
                {/* Top Header */}
                <Header className="dashboard-header" style={{
                    background: '#fff',
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    height: 56,
                    lineHeight: '56px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Mobile menu toggle */}
                        <span
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: 18,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#333',
                            }}
                        >
                            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        </span>
                        <Text strong style={{ fontSize: 16 }}>
                            {roleEmoji} {role} Dashboard
                        </Text>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: roleColor }} />
                        {!isMobile && (
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                {user?.fullName}
                            </Text>
                        )}
                    </div>
                </Header>

                {/* Main Content */}
                <Content style={{
                    padding: isMobile ? 16 : 24,
                    background: '#f5f5f5',
                    minHeight: 'calc(100vh - 56px)',
                    overflow: 'auto',
                }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
