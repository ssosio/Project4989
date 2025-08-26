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
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CircleIcon from '@mui/icons-material/Circle';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

// CSS 애니메이션을 위한 스타일
const pulseKeyframes = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.7;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

// 스타일 태그를 head에 추가
if (typeof document !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.textContent = pulseKeyframes;
    if (!document.head.querySelector('style[data-pulse-animation]')) {
        styleTag.setAttribute('data-pulse-animation', 'true');
        document.head.appendChild(styleTag);
    }
}

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

// 신고 상세 정보 모달 컴포넌트
const DeclarationDetailModal = ({ open, onClose, notification, onMarkAsRead }) => {
    if (!notification) return null;

    const handleMarkAsRead = () => {
        onMarkAsRead(notification.chatdeclarationresultId);
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderBottom: 'none',
                padding: '24px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        backdropFilter: 'blur(10px)'
                    }}>
                        🚨
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                            신고 결과 상세 정보
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 400 }}>
                            신고 처리 결과를 확인하세요
                        </Typography>
                    </Box>
                </Box>
                <IconButton 
                    onClick={onClose} 
                    size="large"
                    sx={{ 
                        color: 'white',
                        '&:hover': { 
                            background: 'rgba(255, 255, 255, 0.1)',
                            transform: 'rotate(90deg)',
                            transition: 'all 0.3s ease'
                        }
                    }}
                >
                    <CloseRoundedIcon />
                </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ p: 4 }}>
                    <Grid container spacing={3}>
                        {/* 신고 기본 정보 */}
                        <Grid item xs={12}>
                            <Box sx={{
                                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                borderRadius: 3,
                                p: 3,
                                border: '1px solid #e9ecef',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: '#007bff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mr: 2
                                    }}>
                                        <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>ℹ️</span>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#495057' }}>
                                        신고 기본 정보
                                    </Typography>
                                </Box>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ 
                                            background: 'white', 
                                            p: 2.5, 
                                            borderRadius: 2,
                                            border: '1px solid #e9ecef',
                                            height: '100%'
                                        }}>
                                            <Typography variant="body2" sx={{ 
                                                color: '#6c757d', 
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                mb: 1
                                            }}>
                                                신고 ID
                                            </Typography>
                                            <Typography variant="h6" sx={{ 
                                                fontWeight: 700, 
                                                color: '#212529',
                                                fontFamily: 'monospace'
                                            }}>
                                                #{notification.chatdeclarationresultId}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ 
                                            background: 'white', 
                                            p: 2.5, 
                                            borderRadius: 2,
                                            border: '1px solid #e9ecef',
                                            height: '100%'
                                        }}>
                                            <Typography variant="body2" sx={{ 
                                                color: '#6c757d', 
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                mb: 1
                                            }}>
                                                신고 유형
                                            </Typography>
                                            <Typography variant="h6" sx={{ 
                                                fontWeight: 600, 
                                                color: '#495057'
                                            }}>
                                                {notification.declarationType || '미분류'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ 
                                            background: 'white', 
                                            p: 2.5, 
                                            borderRadius: 2,
                                            border: '1px solid #e9ecef',
                                            height: '100%'
                                        }}>
                                            <Typography variant="body2" sx={{ 
                                                color: '#6c757d', 
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                mb: 1
                                            }}>
                                                신고한 사용자
                                            </Typography>
                                            <Typography variant="h6" sx={{ 
                                                fontWeight: 600, 
                                                color: '#495057'
                                            }}>
                                                {notification.reportedMemberNickname || 'Unknown'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ 
                                            background: 'white', 
                                            p: 2.5, 
                                            borderRadius: 2,
                                            border: '1px solid #e9ecef',
                                            height: '100%'
                                        }}>
                                            <Typography variant="body2" sx={{ 
                                                color: '#6c757d', 
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                mb: 1
                                            }}>
                                                신고 시간
                                            </Typography>
                                            <Typography variant="h6" sx={{ 
                                                fontWeight: 600, 
                                                color: '#495057'
                                            }}>
                                                {new Date(notification.createdAt).toLocaleString('ko-KR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>

                        {/* 신고 내용 */}
                        <Grid item xs={12}>
                            <Box sx={{
                                background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                                borderRadius: 3,
                                p: 3,
                                border: '1px solid #ffeaa7',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: '#ffc107',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mr: 2
                                    }}>
                                        <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>⚠️</span>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#856404' }}>
                                        신고된 내용
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    background: 'white',
                                    p: 3,
                                    borderRadius: 2,
                                    border: '1px solid #ffeaa7',
                                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <Typography variant="body1" sx={{ 
                                        color: '#495057',
                                        lineHeight: 1.6,
                                        fontSize: '15px'
                                    }}>
                                        {notification.declarationContent || '신고 내용이 없습니다.'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        {/* 조치 결과 */}
                        <Grid item xs={12}>
                            <Box sx={{
                                background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
                                borderRadius: 3,
                                p: 3,
                                border: '1px solid #c3e6cb',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: '#28a745',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mr: 2
                                    }}>
                                        <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>✅</span>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#155724' }}>
                                        조치 결과
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    background: 'white',
                                    p: 3,
                                    borderRadius: 2,
                                    border: '1px solid #c3e6cb',
                                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <Typography variant="body1" sx={{ 
                                        color: '#495057',
                                        lineHeight: 1.6,
                                        fontSize: '15px',
                                        fontWeight: 500
                                    }}>
                                        {notification.resultContent || '조치 결과가 없습니다.'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        {/* 읽음 상태 */}
                        <Grid item xs={12}>
                            <Box sx={{
                                background: notification.isRead === 0 
                                    ? 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)'
                                    : 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
                                borderRadius: 3,
                                p: 3,
                                border: notification.isRead === 0 ? '1px solid #ffeaa7' : '1px solid #c3e6cb',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: notification.isRead === 0 ? '#ffc107' : '#28a745',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mr: 2
                                    }}>
                                        <span style={{ 
                                            color: 'white', 
                                            fontSize: '16px', 
                                            fontWeight: 'bold' 
                                        }}>
                                            {notification.isRead === 0 ? '📬' : '📭'}
                                        </span>
                                    </Box>
                                    <Typography variant="h6" sx={{ 
                                        fontWeight: 600, 
                                        color: notification.isRead === 0 ? '#856404' : '#155724'
                                    }}>
                                        읽음 상태
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    background: 'white',
                                    p: 3,
                                    borderRadius: 2,
                                    border: notification.isRead === 0 ? '1px solid #ffeaa7' : '1px solid #c3e6cb',
                                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Chip 
                                                label={notification.isRead === 0 ? "읽지 않음" : "읽음"}
                                                color={notification.isRead === 0 ? "warning" : "success"}
                                                size="medium"
                                                sx={{ 
                                                    fontWeight: 600,
                                                    fontSize: '13px',
                                                    height: '32px'
                                                }}
                                            />
                                            {notification.isRead === 0 && (
                                                <Typography variant="body2" sx={{ 
                                                    color: '#6c757d',
                                                    fontStyle: 'italic'
                                                }}>
                                                    클릭하여 읽음 처리할 수 있습니다.
                                                </Typography>
                                            )}
                                        </Box>
                                        {notification.isRead === 0 && (
                                            <Box sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                background: '#dc3545',
                                                animation: 'pulse 2s infinite'
                                            }} />
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            
            <DialogActions sx={{ 
                p: 3, 
                background: '#f8f9fa',
                borderTop: '1px solid #e9ecef',
                gap: 2
            }}>
                <Button 
                    onClick={onClose} 
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        py: 1.5,
                        borderColor: '#6c757d',
                        color: '#6c757d',
                        '&:hover': {
                            borderColor: '#495057',
                            background: '#e9ecef'
                        }
                    }}
                >
                    닫기
                </Button>
                {notification.isRead === 0 && (
                    <Button 
                        onClick={handleMarkAsRead} 
                        variant="contained" 
                        sx={{
                            background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            py: 1.5,
                            boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #0056b3 0%, #004085 100%)',
                                boxShadow: '0 6px 16px rgba(0, 123, 255, 0.4)',
                                transform: 'translateY(-1px)'
                            }
                        }}
                        startIcon={<span style={{ fontSize: '18px' }}>✓</span>}
                    >
                        읽음 처리
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

// 컴포넌트 이름을 NotificationMain으로 변경
const NotificationMain = ({ open, onClose, onUnreadCountChange }) => {
    const [notifications, setNotifications] = useState([]);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const { userInfo, token } = useContext(AuthContext);
    const SERVER_IP = 'localhost';
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
        const totalUnreadCount = list.reduce((sum, noti) => sum + (noti.isRead === 0 ? 1 : 0), 0);
        if (onUnreadCountChange) {
            onUnreadCountChange(totalUnreadCount);
        }
    };

    // 신고 결과 알림 목록을 가져오는 함수
    const fetchNotifications = () => {
        if (!userInfo || !userInfo.memberId) {
            setNotifications([]);
            return;
        }

        const url = `http://${SERVER_IP}:${SERVER_PORT}/api/chat-declarations/result-notifications?resultMemberId=${userInfo.memberId}`;

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
                    calculateAndNotifyUnreadCount(sortedNotifications);
                } else {
                    setNotifications([]);
                    calculateAndNotifyUnreadCount([]);
                }
            })
            .catch(error => {
                console.error("신고 결과 알림 목록 가져오기 실패:", error);
                setNotifications([]);
                calculateAndNotifyUnreadCount([]);
            });
    };

    // 신고 결과 알림 목록 창이 열릴 때마다 목록을 다시 불러오도록 설정
    useEffect(() => {
        if (open && userInfo) {
            fetchNotifications();
        }
    }, [open, userInfo]);

    // 신고 목록 클릭 시 모달 열기
    const handleNotificationClick = (notification) => {
        setSelectedNotification(notification);
        setModalOpen(true);
    };

    // 모달 닫기
    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedNotification(null);
    };

    // 신고 결과 알림을 읽음 처리하는 함수
    const handleMarkAsRead = (chatdeclarationresultId) => {
        const url = `http://${SERVER_IP}:${SERVER_PORT}/api/chat-declarations/result-notifications/${chatdeclarationresultId}/read`;

        axios.put(url, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(() => {
                // 성공적으로 읽음 처리되면 상태 업데이트
                setNotifications(prevNoti =>
                    prevNoti.map(noti =>
                        noti.chatdeclarationresultId === chatdeclarationresultId ? { ...noti, isRead: 1 } : noti
                    )
                );
                // 읽음 처리 후 전체 목록 다시 불러오기
                fetchNotifications();
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

                                // 후기 알림인지 신고 알림인지 구분
                                const isReviewNotification = noti.notificationType === 'REVIEW_REQUEST';
                                
                                if (isReviewNotification) {
                                    // 후기 알림 표시
                                    return (
                                        <React.Fragment key={noti.chatdeclarationresultId}>
                                            <NotificationItem onClick={() => handleNotificationClick(noti)}>
                                                <ListItemAvatar>
                                                    <Box sx={{ position: 'relative' }}>
                                                        <Avatar sx={{
                                                            width: 48,
                                                            height: 48,
                                                            bgcolor: '#fff3cd',
                                                            fontSize: '20px'
                                                        }}>
                                                            ⭐
                                                        </Avatar>
                                                    </Box>
                                                </ListItemAvatar>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#222' }}>
                                                            후기 작성 요청
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#666', fontSize: '12px' }}>
                                                            {formatTime(noti.createdAt)}
                                                        </Typography>
                                                    </Box>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: '#856404',
                                                            fontSize: '13px',
                                                            fontWeight: 500,
                                                            mb: 0.5,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: 200
                                                        }}
                                                    >
                                                        ⭐ 후기 작성 요청
                                                    </Typography>
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
                                                                fontWeight: noti.isRead === 0 ? 'bold' : 'normal',
                                                            }}
                                                        >
                                                            {noti.reviewerNickname || 'Unknown'}님이 후기를 작성했습니다. 
                                                            {noti.postTitle ? ` (${noti.postTitle})` : ''} 
                                                            후기를 작성해주세요.
                                                        </Typography>
                                                        {noti.isRead === 0 && (
                                                            <Chip
                                                                label="N"
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    minWidth: 20,
                                                                    fontSize: '11px',
                                                                    fontWeight: 600,
                                                                    backgroundColor: '#ffc107',
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
                                } else {
                                    // 신고 알림 표시 (기존 로직)
                                    const displayMessage = noti.resultContent || '신고 조치가 완료되었습니다.';
                                    const reportedContent = noti.reportedChatContent || noti.declarationContent || '신고된 내용';

                                    return (
                                        <React.Fragment key={noti.chatdeclarationresultId}>
                                            <NotificationItem onClick={() => handleNotificationClick(noti)}>
                                                <ListItemAvatar>
                                                    <Box sx={{ position: 'relative' }}>
                                                        <Avatar sx={{
                                                            width: 48,
                                                            height: 48,
                                                            bgcolor: '#e3f0fd',
                                                            fontSize: '20px'
                                                        }}>
                                                            🚨
                                                        </Avatar>
                                                    </Box>
                                                </ListItemAvatar>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#222' }}>
                                                            {noti.reportedMemberNickname || 'Unknown'}님 신고
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#666', fontSize: '12px' }}>
                                                            {formatTime(noti.createdAt)}
                                                        </Typography>
                                                    </Box>
                                                    {/* 신고 유형 표시 */}
                                                    {noti.declarationType && (
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: '#4A90E2',
                                                                fontSize: '13px',
                                                                fontWeight: 500,
                                                                mb: 0.5,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                maxWidth: 200
                                                            }}
                                                        >
                                                            🚨 {noti.declarationType}
                                                        </Typography>
                                                    )}
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
                                                                fontWeight: noti.isRead === 0 ? 'bold' : 'normal',
                                                            }}
                                                        >
                                                            {displayMessage}
                                                        </Typography>
                                                        {noti.isRead === 0 && (
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
                                }
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

            {/* 신고 상세 정보 모달 */}
            <DeclarationDetailModal
                open={modalOpen}
                onClose={handleModalClose}
                notification={selectedNotification}
                onMarkAsRead={handleMarkAsRead}
            />
        </>
    );
};

export default NotificationMain;