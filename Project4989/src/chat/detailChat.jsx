import React, { useEffect, useState, useContext, useRef } from 'react';
import {
    Box,
    Dialog,
    DialogContent,
    Typography,
    IconButton,
    TextField,
    Avatar,
    Divider,
    Paper,
    InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Client } from '@stomp/stompjs';

const StyledDialog = styled(Dialog)(({ zindex, offset }) => ({
    '& .MuiDialog-paper': {
        width: '100%',
        maxWidth: 600,
        height: '80vh',
        maxHeight: 600,
        margin: 0,
        borderRadius: 12,
        overflow: 'hidden',
        zIndex: zindex,
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) translate(${offset * 20}px, ${offset * 20}px)`
    },
    '& .MuiBackdrop-root': {
        zIndex: zindex - 1
    }
}));

const ChatHeader = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2, 3),
    borderBottom: '1px solid #f0f2f5',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    background: '#fff'
}));

const MessageBubble = styled(Box)(({ theme, isOwn }) => ({
    maxWidth: '70%',
    padding: theme.spacing(1.5, 2),
    borderRadius: 18,
    marginBottom: theme.spacing(1),
    alignSelf: isOwn ? 'flex-end' : 'flex-start',
    backgroundColor: isOwn ? '#3182f6' : '#f0f2f5',
    color: isOwn ? '#fff' : '#222',
    wordBreak: 'break-word'
}));

const DetailChat = ({ open, onClose, chatRoom, zIndex = 1000, offset = 0 }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const { userInfo } = useContext(AuthContext);
    const messagesContainerRef = useRef(null);
    const [stompClient, setStompClient] = useState(null);

    const chatRoomId = chatRoom?.chat_room_id;
    
    // ⭐⭐ 여기 IP 주소를 서버가 실행되는 컴퓨터의 실제 IP 주소로 변경하세요.
    // 예: 'http://192.168.10.136'
    // 만약 `localhost`로 사용한다면, 이 코드는 서버 컴퓨터에서만 작동합니다.
    const SERVER_IP = '192.168.10.136'; 

    const markMessagesAsRead = () => {
        if (stompClient && chatRoomId && userInfo?.memberId) {
            const hasUnreadMessages = messages.some(msg =>
                msg.sender_id !== userInfo.memberId && msg.is_read === 0
            );

            if (hasUnreadMessages) {
                const readMessage = {
                    type: 'READ',
                    chatRoomId: chatRoomId,
                    senderId: userInfo.memberId,
                    timestamp: new Date().toISOString()
                };

                console.log('읽음 처리 요청:', readMessage);
                stompClient.publish({
                    destination: '/app/chat.readMessage',
                    body: JSON.stringify(readMessage)
                });
            }
        }
    };

    const connectWebSocket = () => {
        const client = new Client({
            // ⭐⭐ 수정된 부분: brokerURL에 SERVER_IP 변수 사용
            brokerURL: `ws://${SERVER_IP}:4989/ws`,
            connectHeaders: {},
            debug: function (str) {
                console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            setStompClient(client);

            client.subscribe(`/topic/chat/${chatRoomId}`, (message) => {
                const receivedMessage = JSON.parse(message.body);
                console.log('받은 WebSocket 메시지:', receivedMessage);

                if (receivedMessage.type === 'READ_UPDATE') {
                    setMessages(prevMessages =>
                        prevMessages.map(msg => {
                            if (msg.sender_id !== userInfo?.memberId && msg.is_read === 0) {
                                console.log('메시지 읽음 처리:', msg.message_id);
                                return { ...msg, is_read: 1 };
                            }
                            return msg;
                        })
                    );
                } else {
                    const convertedMessage = {
                        message_id: Date.now(),
                        chat_room_id: receivedMessage.chatRoomId,
                        sender_id: receivedMessage.senderId,
                        message_type: receivedMessage.messageType,
                        message_content: receivedMessage.messageContent,
                        created_at: receivedMessage.timestamp,
                        is_read: 0
                    };
                    setMessages(prevMessages => [...prevMessages, convertedMessage]);
                }
            });
        };

        client.activate();
    };

    const disconnectWebSocket = () => {
        if (stompClient) {
            const leaveMessage = {
                type: 'LEAVE',
                chatRoomId: chatRoomId,
                senderId: userInfo?.memberId,
                timestamp: new Date().toISOString()
            };

            stompClient.publish({
                destination: '/app/chat.leaveRoom',
                body: JSON.stringify(leaveMessage)
            });

            stompClient.deactivate();
            setStompClient(null);
        }
    };

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        console.log('DetailChat useEffect 실행:', { open, chatRoomId, chatRoom });
        if (open && chatRoomId) {
            console.log('메시지 가져오기 조건 만족, chatRoomId:', chatRoomId);
            fetchMessages(chatRoomId);
            
            if (!stompClient) {
                connectWebSocket();
            }

            setTimeout(() => {
                markMessagesAsRead();
            }, 1000);

            const handleScroll = () => {
                if (messagesContainerRef.current) {
                    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
                    if (scrollTop + clientHeight >= scrollHeight - 10) {
                        markMessagesAsRead();
                    }
                }
            };

            if (messagesContainerRef.current) {
                messagesContainerRef.current.addEventListener('scroll', handleScroll);
            }
        } else {
            console.log('메시지 가져오기 조건 불만족:', { open, chatRoomId });
            disconnectWebSocket();
        }

        return () => {
            disconnectWebSocket();
        };
    }, [open, chatRoomId]);

    if (!chatRoom) {
        console.warn('DetailChat: chatRoom이 유효하지 않습니다.');
        return null;
    }

    const fetchMessages = async (roomId) => {
        setLoading(true);
        console.log('메시지 가져오기 시작, roomId:', roomId);
        
        // ⭐⭐ 수정된 부분: API 요청 URL에 SERVER_IP 변수 사용
        const url = `http://${SERVER_IP}:4989/listMessage?chat_room_id=${roomId}`;
        console.log('요청 URL:', url);

        try {
            const response = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 5000
            });
            console.log('API 응답 상태:', response.status);
            console.log('API 응답 헤더:', response.headers);
            console.log('API 응답 데이터:', response.data);
            console.log('응답 데이터 타입:', typeof response.data);
            console.log('응답 데이터 길이:', Array.isArray(response.data) ? response.data.length : '배열이 아님');

            const filteredMessages = Array.isArray(response.data)
                ? response.data.filter(msg => {
                    console.log('메시지 객체:', msg);
                    console.log('메시지 타입:', typeof msg);
                    console.log('메시지 키들:', msg ? Object.keys(msg) : 'null');
                    return msg !== null && msg !== undefined;
                })
                : [];
            console.log('필터링된 메시지:', filteredMessages);
            setMessages(filteredMessages);
        } catch (error) {
            console.error('메시지 목록 가져오기 실패:', error);
            console.error('에러 응답:', error.response);
            console.error('에러 상태:', error.response?.status);
            console.error('에러 데이터:', error.response?.data);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (message.trim() && chatRoomId && userInfo?.memberId && stompClient) {
            try {
                const chatMessage = {
                    type: 'CHAT',
                    chatRoomId: chatRoomId,
                    senderId: userInfo.memberId,
                    messageContent: message,
                    messageType: 'text',
                    timestamp: new Date().toISOString()
                };

                stompClient.publish({
                    destination: '/app/chat.sendMessage',
                    body: JSON.stringify(chatMessage)
                });

                const ownMessage = {
                    message_id: Date.now(),
                    chat_room_id: chatRoomId,
                    sender_id: userInfo.memberId,
                    message_type: 'text',
                    message_content: message,
                    created_at: new Date().toISOString(),
                    is_read: 0
                };
                setMessages(prevMessages => [...prevMessages, ownMessage]);

                setMessage('');
            } catch (error) {
                console.error('메시지 전송 실패:', error);
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    console.log('DetailChat 렌더링:', { open, chatRoom, chatRoomId, userInfo });
    console.log('현재 messages 상태:', messages);

    return (
        <StyledDialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            zindex={zIndex}
            offset={offset}
        >
            <ChatHeader>
                <IconButton onClick={onClose} size="small">
                    <ArrowBackRoundedIcon />
                </IconButton>
                <Avatar sx={{
                    width: 40,
                    height: 40,
                    bgcolor: '#e3f0fd',
                    fontSize: '16px'
                }}>
                    {chatRoom?.avatar || 'U'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#222' }}>
                        {chatRoom?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                        {chatRoom?.isOnline ? '온라인' : '오프라인'}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseRoundedIcon />
                </IconButton>
            </ChatHeader>

            <Box sx={{
                height: 'calc(100% - 80px)',
                display: 'flex',
                flexDirection: 'column',
                background: '#f8f9fa'
            }}>
                <Box
                    ref={messagesContainerRef}
                    sx={{
                        flex: 1,
                        overflow: 'auto',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0
                    }}
                >
                    {loading ? (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography>메시지를 불러오는 중...</Typography>
                        </Box>
                    ) : (messages || []).map((msg) => {
                        if (!msg) return null;

                        const isOwnMessage = msg?.sender_id === userInfo?.memberId || msg?.senderId === userInfo?.memberId;

                        const formatTime = (dateString) => {
                            if (!dateString) return '';
                            const date = new Date(dateString);
                            const hours = date.getHours().toString().padStart(2, '0');
                            const minutes = date.getMinutes().toString().padStart(2, '0');
                            return `${hours}:${minutes}`;
                        };

                        return (
                            <Box
                                key={msg.message_id || msg.id || Math.random()}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                                    mb: 1
                                }}
                            >
                                <MessageBubble isOwn={isOwnMessage}>
                                    <Typography variant="body2">
                                        {msg?.message_content || msg?.messageContent || msg?.text || '메시지 내용 없음'}
                                    </Typography>
                                </MessageBubble>

                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                                        mt: 0.5
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#666',
                                            fontSize: '11px'
                                        }}
                                    >
                                        {formatTime(msg?.created_at || msg?.timestamp)}
                                    </Typography>

                                    {isOwnMessage && (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.2
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: msg?.is_read === 0 ? '#3182f6' : '#ccc',
                                                    fontSize: '10px',
                                                    fontWeight: msg?.is_read === 0 ? 'bold' : 'normal'
                                                }}
                                            >
                                                {msg?.is_read === 0 ? '읽음' : '1'}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>

                <Divider />

                <Box sx={{
                    p: 2,
                    background: '#fff',
                    flexShrink: 0
                }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="메시지를 입력하세요..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        variant="outlined"
                        size="small"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={handleSendMessage}
                                        disabled={!message.trim()}
                                        sx={{
                                            color: message.trim() ? '#3182f6' : '#ccc'
                                        }}
                                    >
                                        <SendRoundedIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: 24,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 24
                                }
                            }
                        }}
                    />
                </Box>
            </Box>
        </StyledDialog>
    );
};

export default DetailChat;