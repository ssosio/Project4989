import React, { useContext, useState, useEffect } from 'react';
import {
    Box,
    Drawer,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    IconButton,
    Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CircleIcon from '@mui/icons-material/Circle';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

// 기존 ChatMain.jsx에 있던 스타일들을 가져와서 재활용
const StyledDrawer = styled(Drawer)(() => ({
    '& .MuiDrawer-paper': {
        width: 320,
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
        border: 'none',
        background: '#fff'
    }
}));

const NotificationHeader = styled(Box)(() => ({
    padding: '16px 24px',
    borderBottom: '1px solid #f0f2f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#fff'
}));

const NotificationItem = styled(ListItem)(() => ({
    padding: '16px 24px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
        backgroundColor: '#f8f9fa'
    },
    '&:active': {
        backgroundColor: '#e3f0fd'
    }
}));

// 컴포넌트 이름을 NotificationMain으로 변경
const NotificationMain = ({ open, onClose, onUnreadCountChange }) => {
    const [notifications, setNotifications] = useState([]);
    const { userInfo, token } = useContext(AuthContext);
    const SERVER_IP = '192.168.10.138';
    const SERVER_PORT = '4989';

    // 시간 포맷팅 함수 (채팅에서 가져온 그대로 사용)
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            return date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric'
            });
        }
    };

    // 안 읽은 알림 개수 계산 함수
    const calculateAndNotifyUnreadCount = (list) => {
        const totalUnreadCount = list.reduce((sum, noti) => sum + (noti.isRead ? 0 : 1), 0);
        if (onUnreadCountChange) {
            onUnreadCountChange(totalUnreadCount);
        }
    };

    // 알림 목록을 가져오는 함수
    const fetchNotifications = () => {
        if (!userInfo || !userInfo.memberId) {
            setNotifications([]);
            return;
        }

        const url = `http://${SERVER_IP}:${SERVER_PORT}/api/notifications/declarations?memberId=${userInfo.memberId}`;

        axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (Array.isArray(res.data)) {
                    // null 데이터 필터링 후 정렬
                    const filteredNotifications = res.data.filter(n => n && n.createdAt);
                    const sortedNotifications = filteredNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                    setNotifications(sortedNotifications);
                    calculateAndNotifyUnreadCount(sortedNotifications); // 이 부분은 이제 정상 작동합니다.
                } else {
                    setNotifications([]);
                    calculateAndNotifyUnreadCount([]);
                }
            })
            .catch(error => {
                console.error("알림 목록 가져오기 실패:", error);
                setNotifications([]);
                calculateAndNotifyUnreadCount([]);
            });
    };

    // 알림 목록 창이 열릴 때마다 목록을 다시 불러오도록 설정
    useEffect(() => {
        if (open && userInfo) {
            fetchNotifications();
        }
    }, [open, userInfo]);

    // 알림 클릭 시 실행되는 함수
    const handleNotificationClick = (notificationId) => {
        const url = `http://${SERVER_IP}:${SERVER_PORT}/api/notifications/declarations/read/${notificationId}`;

        axios.post(url, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(() => {
                // 성공적으로 읽음 처리되면 상태 업데이트
                setNotifications(prevNoti =>
                    prevNoti.map(noti =>
                        noti.declarationId === notificationId ? { ...noti, isRead: true } : noti
                    )
                );
            })
            .catch(error => {
                console.error("알림 읽음 처리 실패:", error);
            });
    };

    return (
        <>
            <StyledDrawer
                anchor="right"
                open={open}
                onClose={onClose}
                ModalProps={{
                    keepMounted: true
                }}
            >
                <NotificationHeader>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#222' }}>
                        알림
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseRoundedIcon />
                    </IconButton>
                </NotificationHeader>

                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <List sx={{ p: 0 }}>
                        {notifications && Array.isArray(notifications) && notifications.length > 0 ? (
                            notifications.map((noti, index) => {
                                if (!noti) return null;

                                const displayMessage = `"${noti.reportedChatContent}" 채팅이 신고되었습니다.`;

                                return (
                                    <React.Fragment key={noti.declarationId}>
                                        <NotificationItem onClick={() => handleNotificationClick(noti.declarationId)}>
                                            <ListItemAvatar>
                                                <Avatar sx={{
                                                    width: 48,
                                                    height: 48,
                                                    bgcolor: '#f2f2f2',
                                                    fontSize: '20px'
                                                }}>
                                                    🚨
                                                </Avatar>
                                            </ListItemAvatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#222' }}>
                                                        채팅 신고
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#666', fontSize: '12px' }}>
                                                        {formatTime(noti.createdAt)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: '#666',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: 180,
                                                            fontSize: '14px',
                                                            fontWeight: noti.isRead ? 'normal' : 'bold', // isRead 값에 따라 스타일 적용
                                                        }}
                                                    >
                                                        {displayMessage}
                                                    </Typography>
                                                    {!noti.isRead && ( // isRead 값에 따라 "N" 뱃지 표시
                                                        <Chip
                                                            label="N"
                                                            size="small"
                                                            sx={{
                                                                height: 20,
                                                                minWidth: 20,
                                                                fontSize: '11px',
                                                                fontWeight: 600,
                                                                backgroundColor: '#3182f6',
                                                                color: '#fff'
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        </NotificationItem>
                                        {index < notifications.length - 1 && (
                                            <Divider sx={{ mx: 3 }} />
                                        )}
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: 200,
                                color: '#666'
                            }}>
                                <Typography variant="body2">
                                    알림이 없습니다.
                                </Typography>
                            </Box>
                        )}
                    </List>
                </Box>
            </StyledDrawer>
        </>
    );
};

export default NotificationMain;