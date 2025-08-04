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
    Badge,
    Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CircleIcon from '@mui/icons-material/Circle';
import DetailChat from './detailChat';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';


const StyledDrawer = styled(Drawer)(() => ({
    '& .MuiDrawer-paper': {
        width: 320,
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
        border: 'none',
        background: '#fff'
    }
}));

const ChatHeader = styled(Box)(() => ({
    padding: '16px 24px',
    borderBottom: '1px solid #f0f2f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#fff'
}));

const ChatItem = styled(ListItem)(() => ({
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



const ChatMain = ({ open, onClose }) => {
    const [openChatRooms, setOpenChatRooms] = useState([]);
    const [chatList, setChatList] = useState([]);
    const { userInfo } = useContext(AuthContext);

    // 채팅방 목록 가져오기
    useEffect(() => {
        if (userInfo) {
            fetchChatList();
        }
    }, [userInfo]);

    const fetchChatList = () => {
        console.log("현재 사용자 정보:", userInfo);

        // JWT 토큰 디코딩하여 확인
        const token = localStorage.getItem('jwtToken');
        if (token) {
            try {
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                console.log("JWT 토큰 내용:", decodedToken);
            } catch (error) {
                console.error("JWT 토큰 디코딩 실패:", error);
            }
        }

        if (!userInfo || !userInfo.loginId) {
            console.log("사용자 정보가 없습니다.");
            setChatList([]);
            return;
        }

        let url = `http://localhost:4989/chatlist?login_id=${userInfo.loginId}`;
        console.log("API 호출 URL:", url);

        axios.get(url)
            .then(res => {
                console.log("채팅방 목록 응답:", res.data);
                console.log("응답 데이터 타입:", typeof res.data);
                console.log("응답 데이터 길이:", Array.isArray(res.data) ? res.data.length : "배열이 아님");

                // 데이터가 null이거나 undefined인 경우 빈 배열로 설정
                if (res.data === null || res.data === undefined) {
                    console.log("응답 데이터가 null입니다. 빈 배열로 설정합니다.");
                    setChatList([]);
                } else {
                    setChatList(res.data);
                }
            })
            .catch(error => {
                console.error("채팅방 목록 가져오기 실패:", error);
                console.error("에러 응답:", error.response?.data);
                setChatList([]);
            });
    };

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
                    {chatList && Array.isArray(chatList) && chatList.length > 0 ? (
                        chatList.map((room, index) => {
                            // room 객체가 유효한지 확인
                            if (!room) {
                                console.warn("유효하지 않은 채팅방 데이터:", room);
                                return null;
                            }

                            return (
                                <React.Fragment key={room.chat_room_id || room.id || index}>
                                    <ChatItem onClick={() => handleChatRoomClick(room)}>
                                        <ListItemAvatar>
                                            <Box sx={{ position: 'relative' }}>
                                                <Avatar sx={{
                                                    width: 48,
                                                    height: 48,
                                                    bgcolor: '#e3f0fd',
                                                    fontSize: '20px'
                                                }}>
                                                    {room.opponent_nickname ? room.opponent_nickname.charAt(0) : 'U'}
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
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#222' }}>
                                                    {room.opponent_nickname || 'Unknown'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#666', fontSize: '12px' }}>
                                                    {room.last_message_at ? new Date(room.last_message_at).toLocaleString() : ''}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span
                                                    style={{
                                                        color: '#666',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        maxWidth: 180,
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    상품 ID: {room.product_id}
                                                </span>
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
                                        </Box>
                                    </ChatItem>
                                    {index < chatList.length - 1 && (
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
                                채팅방이 없습니다.
                            </Typography>
                        </Box>
                    )}
                </List>
            </Box>

            {/* 상세 채팅 모달들 */}
            {openChatRooms && Array.isArray(openChatRooms) && openChatRooms.map((room, index) => {
                if (!room) return null;

                return (
                    <DetailChat
                        key={room.chat_rood_id || room.id || index}
                        open={true}
                        onClose={() => handleDetailChatClose(room.chat_rood_id || room.id)}
                        chatRoom={room}
                        zIndex={1000 + index}
                        offset={index}
                    />
                );
            })}
        </StyledDrawer>
    );
};

export default ChatMain; 