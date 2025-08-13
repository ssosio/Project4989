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
import { Client } from '@stomp/stompjs';

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
    const [stompClient, setStompClient] = useState(null);
    const SERVER_IP = '192.168.10.136';
    const SERVER_PORT = '4989';

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

    const handleUpdateLastMessage = (updatedChatRoomId, lastMessageContent, lastMessageType, lastMessageTime) => {
        setChatList(prevList => {
            const newList = prevList.map(room => {
                if (room.chatRoomId === updatedChatRoomId) {
                    return {
                        ...room,
                        lastMessage: lastMessageContent,
                        lastMessageType: lastMessageType,
                        lastMessageTime: lastMessageTime,
                    };
                }
                return room;
            });
            return newList.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        });
    };

    // 추가: DetailChat에서 호출할 읽음 처리 핸들러
    const handleMarkAsRead = (chatRoomId) => {
        setChatList(prevList =>
            prevList.map(room => {
                if (room.chatRoomId === chatRoomId) {
                    return { ...room, unreadCount: 0 };
                }
                return room;
            })
        );
    };

    // 채팅방 목록 가져오기
    useEffect(() => {
        if (userInfo) {
            fetchChatList();
        }
    }, [userInfo]);

    const fetchChatList = () => {
        if (!userInfo || !userInfo.memberId) {
            setChatList([]);
            return;
        }
        let url = `http://${SERVER_IP}:${SERVER_PORT}/chat/rooms?memberId=${userInfo.memberId}`;
        axios.get(url)
            .then(res => {
                if (Array.isArray(res.data)) {
                    const sortedChatRooms = res.data.sort((a, b) => {
                        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                        return timeB - timeA;
                    });
                    setChatList(sortedChatRooms);
                } else {
                    setChatList([]);
                }
            })
            .catch(error => {
                console.error("채팅방 목록 가져오기 실패:", error);
                setChatList([]);
            });
    };

    // Stomp 클라이언트 연결 및 구독
    useEffect(() => {
        if (!open || !userInfo) {
            if (stompClient && stompClient.active) {
                stompClient.deactivate();
            }
            setStompClient(null);
            return;
        }

        const client = new Client({
            brokerURL: `ws://${SERVER_IP}:${SERVER_PORT}/ws`,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            console.log('STOMP 연결 성공');
            setStompClient(client);

            client.subscribe(`/user/${userInfo.memberId}/queue/chat-rooms`, message => {
                const chatRoomUpdate = JSON.parse(message.body);
                setChatList(prevList => {
                    const existingIndex = prevList.findIndex(room => room.chatRoomId === chatRoomUpdate.chatRoomId);
                    if (existingIndex > -1) {
                        const newList = [...prevList];
                        // 서버에서 보낸 unreadCount를 그대로 사용
                        newList[existingIndex] = { ...newList[existingIndex], ...chatRoomUpdate };
                        return newList.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
                    } else {
                        // 새로운 채팅방일 경우 추가
                        return [chatRoomUpdate, ...prevList].sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
                    }
                });
            });

            // 읽음 처리 메시지 수신 구독
            client.subscribe(`/user/${userInfo.memberId}/queue/read`, message => {
                const readUpdate = JSON.parse(message.body);
                console.log("읽음 처리 WebSocket 메시지 수신:", readUpdate);
                console.log("받은 chatRoomId 타입:", typeof readUpdate.chatRoomId);

                setChatList(prevList =>
                    prevList.map(room => {
                        console.log(`채팅방 ${room.chatRoomId} 비교:`, room.chatRoomId, 'vs', readUpdate.chatRoomId, '일치:', room.chatRoomId === readUpdate.chatRoomId);
                        // chatRoomId가 Long 타입으로 들어오므로, Number로 변환하여 비교합니다.
                        if (room.chatRoomId === Number(readUpdate.chatRoomId)) {
                            return { ...room, unreadCount: 0 };
                        }
                        return room;
                    })
                );
            });
        };

        client.onStompError = (frame) => {
            console.error('브로커 오류:', frame);
        };

        client.activate();

        return () => {
            if (client && client.active) {
                client.deactivate();
            }
        };
    }, [open, userInfo?.memberId, SERVER_IP, SERVER_PORT]);

    const handleChatRoomClick = (room) => {
        const isAlreadyOpen = openChatRooms.find(openRoom => openRoom.chatRoomId === room.chatRoomId);
        if (!isAlreadyOpen) {
            setOpenChatRooms(prev => [...prev, room]);
        }

        // 채팅방을 열 때 unreadCount를 0으로 바로 업데이트 (UI 반응성 향상)
        handleMarkAsRead(room.chatRoomId);

        // 서버로 읽음 처리 요청
        if (stompClient && stompClient.active) {
            const readMessage = { chatRoomId: room.chatRoomId, memberId: userInfo.memberId };
            stompClient.publish({
                destination: `/app/chat/markAsRead`, // 서버의 읽음 처리 엔드포인트
                body: JSON.stringify(readMessage)
            });
        }
    };

    const handleDetailChatClose = (roomId) => {
        setOpenChatRooms(prev => prev.filter(room => room.chatRoomId !== roomId));
    };

    const handleLeaveChatSuccess = () => {
        fetchChatList();
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
                                    return null;
                                }
                                const otherUserNickname = room.otherUserNickname || room.otherUser?.nickname;
                                const otherUserProfileImage = room.otherUserProfileImage || room.otherUser?.profileImage;

                                return (
                                    <React.Fragment key={room.chatRoomId}>
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
            </StyledDrawer>

            {openChatRooms && Array.isArray(openChatRooms) && openChatRooms.map((room, index) => {
                if (!room) return null;

                return (
                    <DetailChat
                        key={room.chatRoomId}
                        open={true}
                        onClose={() => handleDetailChatClose(room.chatRoomId)}
                        chatRoom={room}
                        zIndex={1000 + index}
                        offset={index * 460}
                        onLeaveChat={handleLeaveChatSuccess}
                        onUpdateLastMessage={handleUpdateLastMessage}
                        onMarkAsRead={handleMarkAsRead} // 추가: DetailChat 컴포넌트에 읽음 처리 함수 전달
                        stompClient={stompClient}
                    />
                );
            })}
        </>
    );
};

export default ChatMain;
