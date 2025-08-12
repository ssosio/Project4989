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
    const SERVER_IP = '192.168.10.136';
    const SERVER_PORT = '4989';

    // 시간 포맷팅 함수는 그대로 유지
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

    /**
     * @description DetailChat에서 메시지 업데이트를 요청할 때 호출될 함수
     * @param {number} updatedChatRoomId 업데이트할 채팅방 ID
     * @param {string} lastMessageContent 마지막 메시지 내용
     * @param {string} lastMessageType 마지막 메시지 타입 ('text' 또는 'image')
     * @param {string} lastMessageTime 마지막 메시지 시간 (ISOString)
     */
    const handleUpdateLastMessage = (updatedChatRoomId, lastMessageContent, lastMessageType, lastMessageTime) => {
        setChatList(prevList => {
            const newList = prevList.map(room => {
                // 현재 업데이트 대상 채팅방을 찾아서 상태를 변경합니다.
                if (room.chatRoomId === updatedChatRoomId) {
                    return {
                        ...room,
                        lastMessage: lastMessageContent,
                        lastMessageType: lastMessageType,
                        lastMessageTime: lastMessageTime,
                        // unreadCount는 DetailChat에서 읽음 처리 로직에 따라 별도로 관리될 수 있습니다.
                    };
                }
                return room;
            });
            // 최신 메시지 순으로 목록을 정렬합니다.
            return newList.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        });
    };

    // 채팅방 목록 가져오기
    useEffect(() => {
        if (userInfo) {
            fetchChatList();
        }
    }, [userInfo]);

    const fetchChatList = () => {
        console.log("현재 사용자 정보:", userInfo);

        if (!userInfo || !userInfo.memberId) {
            console.log("사용자 정보가 없습니다.");
            setChatList([]);
            return;
        }

        let url = `http://${SERVER_IP}:${SERVER_PORT}/chat/rooms?memberId=${userInfo.memberId}`;
        console.log("API 호출 URL:", url);

        axios.get(url)
            .then(res => {
                console.log("채팅방 목록 응답:", res.data);
                if (Array.isArray(res.data)) {
                    // ✅ lastMessageTime을 기준으로 목록을 정렬합니다.
                    const sortedChatRooms = res.data.sort((a, b) => {
                        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                        return timeB - timeA;
                    });
                    setChatList(sortedChatRooms);
                } else {
                    console.warn("API 응답이 배열이 아닙니다. 빈 배열로 설정합니다.");
                    setChatList([]);
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

        const isAlreadyOpen = openChatRooms.find(openRoom => openRoom.chatRoomId === room.chatRoomId);
        if (!isAlreadyOpen) {
            setOpenChatRooms(prev => [...prev, room]);
        }
    };

    const handleDetailChatClose = (roomId) => {
        console.log('상세 채팅 닫기:', roomId);
        // chatRoomId를 기반으로 닫기
        setOpenChatRooms(prev => prev.filter(room => room.chatRoomId !== roomId));
    };

    const handleLeaveChatSuccess = () => {
        console.log("채팅방 나가기 성공. 목록을 다시 불러옵니다.");
        fetchChatList(); // 채팅방 목록을 다시 불러오는 함수 호출
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
                            if (!room) {
                                console.warn("유효하지 않은 채팅방 데이터:", room);
                                return null;
                            }
                            // API 응답 데이터 필드명이 일치하도록 통일
                            const otherUserNickname = room.otherUserNickname || room.otherUser?.nickname;
                            const otherUserProfileImage = room.otherUserProfileImage || room.otherUser?.profileImage;

                            return (
                                <React.Fragment key={room.chatRoomId || index}>
                                    <ChatItem onClick={() => handleChatRoomClick(room)}>
                                        <ListItemAvatar>
                                            <Box sx={{ position: 'relative' }}>
                                                <Avatar sx={{
                                                    width: 48,
                                                    height: 48,
                                                    bgcolor: '#e3f0fd',
                                                    fontSize: '20px'
                                                }}>
                                                    {otherUserProfileImage ? (
                                                        <img src={otherUserProfileImage} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        otherUserNickname?.charAt(0) || 'U'
                                                    )}
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
                                                    {otherUserNickname || 'Unknown'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#666', fontSize: '12px' }}>
                                                    {formatTime(room.lastMessageTime)}
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
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    {room.lastMessageType === 'image' ? '사진' : room.lastMessage || '메시지가 없습니다'}
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
                        key={room.chatRoomId}
                        open={true}
                        onClose={() => handleDetailChatClose(room.chatRoomId)}
                        chatRoom={room}
                        zIndex={1000 + index}
                        offset={index * 460} // 각 채팅창이 겹치지 않게 옆으로 이동
                        onLeaveChat={handleLeaveChatSuccess}
                        // ✅ onUpdateLastMessage prop을 추가하고, 상위 컴포넌트의 상태를 업데이트하는 함수를 전달합니다.
                        onUpdateLastMessage={handleUpdateLastMessage}
                    />
                );
            })}
        </StyledDrawer>
    );
};

export default ChatMain;