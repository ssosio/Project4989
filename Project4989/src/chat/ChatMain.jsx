import React, { useState } from 'react';
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
    Badge,
    Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CircleIcon from '@mui/icons-material/Circle';
import DetailChat from './detailChat';

const StyledDrawer = styled(Drawer)(({ theme }) => ({
    '& .MuiDrawer-paper': {
        width: 320,
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
        border: 'none',
        background: '#fff'
    }
}));

const ChatHeader = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2, 3),
    borderBottom: '1px solid #f0f2f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#fff'
}));

const ChatItem = styled(ListItem)(({ theme }) => ({
    padding: theme.spacing(2, 3),
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
        backgroundColor: '#f8f9fa'
    },
    '&:active': {
        backgroundColor: '#e3f0fd'
    }
}));

const ChatMain = ({ open, onClose }) => {
    const [openChatRooms, setOpenChatRooms] = useState([]);

    // 임시 채팅방 데이터
    const chatRooms = [
        {
            id: 1,
            name: "아이폰 14 Pro 팝니다",
            lastMessage: "안녕하세요! 아이폰 14 Pro 구매하고 싶은데요",
            time: "14:30",
            unreadCount: 2,
            isOnline: true,
            avatar: "📱"
        },
        {
            id: 2,
            name: "맥북 에어 M2",
            lastMessage: "가격 협의 가능할까요?",
            time: "12:15",
            unreadCount: 0,
            isOnline: false,
            avatar: "💻"
        },
        {
            id: 3,
            name: "나이키 운동화",
            lastMessage: "사이즈 270 있나요?",
            time: "09:45",
            unreadCount: 1,
            isOnline: true,
            avatar: "👟"
        },
        {
            id: 4,
            name: "갤럭시 S23",
            lastMessage: "배터리 상태는 어떤가요?",
            time: "어제",
            unreadCount: 0,
            isOnline: false,
            avatar: "📱"
        },
        {
            id: 5,
            name: "아디다스 트레이닝복",
            lastMessage: "색상이 어떤 것들이 있나요?",
            time: "어제",
            unreadCount: 3,
            isOnline: true,
            avatar: "👕"
        }
    ];

    const handleChatRoomClick = (room) => {
        console.log('채팅방 클릭됨:', room);
        // 이미 열린 채팅방인지 확인
        const isAlreadyOpen = openChatRooms.find(openRoom => openRoom.id === room.id);
        if (!isAlreadyOpen) {
            setOpenChatRooms(prev => [...prev, room]);
        }
    };

    const handleDetailChatClose = (roomId) => {
        console.log('상세 채팅 닫기:', roomId);
        setOpenChatRooms(prev => prev.filter(room => room.id !== roomId));
    };

    return (
        <StyledDrawer
            anchor="right"
            open={open}
            onClose={onClose}
            ModalProps={{
                keepMounted: true
            }}
        >
            <ChatHeader>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#222' }}>
                    채팅
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseRoundedIcon />
                </IconButton>
            </ChatHeader>

            <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List sx={{ p: 0 }}>
                    {chatRooms.map((room, index) => (
                        <React.Fragment key={room.id}>
                            <ChatItem onClick={() => handleChatRoomClick(room)}>
                                <ListItemAvatar>
                                    <Box sx={{ position: 'relative' }}>
                                        <Avatar sx={{
                                            width: 48,
                                            height: 48,
                                            bgcolor: '#e3f0fd',
                                            fontSize: '20px'
                                        }}>
                                            {room.avatar}
                                        </Avatar>
                                        {room.isOnline && (
                                            <CircleIcon
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    right: 0,
                                                    color: '#4caf50',
                                                    fontSize: 16,
                                                    background: '#fff',
                                                    borderRadius: '50%'
                                                }}
                                            />
                                        )}
                                    </Box>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#222' }}>
                                                {room.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#666', fontSize: '12px' }}>
                                                {room.time}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: '#666',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: 180
                                                }}
                                            >
                                                {room.lastMessage}
                                            </Typography>
                                            {room.unreadCount > 0 && (
                                                <Chip
                                                    label={room.unreadCount}
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
                                    }
                                />
                            </ChatItem>
                            {index < chatRooms.length - 1 && (
                                <Divider sx={{ mx: 3 }} />
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </Box>

            {/* 상세 채팅 모달들 */}
            {openChatRooms.map((room, index) => (
                <DetailChat
                    key={room.id}
                    open={true}
                    onClose={() => handleDetailChatClose(room.id)}
                    chatRoom={room}
                    zIndex={1000 + index}
                    offset={index}
                />
            ))}
        </StyledDrawer>
    );
};

export default ChatMain; 