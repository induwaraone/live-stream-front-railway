import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout, Menu, Typography, Avatar, Dropdown, Grid } from 'antd';
import {
    VideoCameraOutlined,
    MessageOutlined,
    LogoutOutlined,
    UserOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    DownOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

const { Sider, Header, Content } = Layout;
const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

interface DashboardLayoutProps {
    children: ReactNode;
    role?: 'Student' | 'Instructor';
}

export default function DashboardLayout({ children, role: roleProp }: DashboardLayoutProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const [collapsed, setCollapsed] = useState(false);

    const role = roleProp || user?.userType || 'Student';

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
    ];

    const selectedKey = location.pathname.startsWith('/chat') ? '/chat' : dashboardPath;

    const handleMenuClick = (info: { key: string }) => {
        navigate(info.key);
        if (isMobile) setCollapsed(true);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const avatarDropdownItems = {
        items: [
            {
                key: 'name',
                label: <Text strong>{user?.fullName}</Text>,
                disabled: true,
            },
            {
                key: 'role',
                label: <Text type="secondary">{role}</Text>,
                disabled: true,
            },
            { type: 'divider' as const },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Logout',
                danger: true,
                onClick: handleLogout,
            },
        ],
    };

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
                {/* Logo */}
                <div style={{
                    padding: collapsed && !isMobile ? '20px 0' : '20px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                }}>
                    <Title level={collapsed && !isMobile ? 5 : 3} style={{
                        margin: 0,
                        color: '#fff',
                        fontWeight: 800,
                        letterSpacing: 2,
                        background: 'linear-gradient(135deg, #1677ff, #69b1ff)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        {collapsed && !isMobile ? 'Z' : 'Zolo'}
                    </Title>
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
                            {role} Dashboard
                        </Text>
                    </div>

                    <Dropdown menu={avatarDropdownItems} placement="bottomRight" trigger={['click']}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: 8,
                            transition: 'background 0.2s ease',
                        }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#8c8c8c' }} />
                            {!isMobile && (
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    {user?.fullName}
                                </Text>
                            )}
                            <DownOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
                        </div>
                    </Dropdown>
                </Header>

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
