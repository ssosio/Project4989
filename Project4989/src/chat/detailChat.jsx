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

    // 메시지 읽음 처리 함수
    const markMessagesAsRead = () => {
        if (stompClient && chatRoomId && userInfo?.memberId) {
            // 상대방이 보낸 메시지 중 안읽은 것이 있는지 확인 (is_read === 0)
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

    // WebSocket 연결
    const connectWebSocket = () => {
        const client = new Client({
            brokerURL: 'ws://localhost:4989/ws',
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

            // 채팅방 구독
            client.subscribe(`/topic/chat/${chatRoomId}`, (message) => {
                const receivedMessage = JSON.parse(message.body);
                console.log('받은 WebSocket 메시지:', receivedMessage);

                if (receivedMessage.type === 'READ_UPDATE') {
                    // 읽음 상태 업데이트 (0 → 1)
                    setMessages(prevMessages =>
                        prevMessages.map(msg => {
                            // 상대방이 보낸 메시지이고 아직 안읽은 상태(0)인 메시지들을 읽음 처리(1)
                            if (msg.sender_id !== userInfo?.memberId && msg.is_read === 0) {
                                console.log('메시지 읽음 처리:', msg.message_id);
                                return { ...msg, is_read: 1 };
                            }
                            return msg;
                        })
                    );
                } else {
                    // 새 메시지는 안읽은 상태(0)로 추가
                    const convertedMessage = {
                        message_id: Date.now(), // 임시 ID
                        chat_room_id: receivedMessage.chatRoomId,
                        sender_id: receivedMessage.senderId,
                        message_type: receivedMessage.messageType,
                        message_content: receivedMessage.messageContent,
                        created_at: receivedMessage.timestamp,
                        is_read: 0 // 새 메시지는 안읽은 상태
                    };
                    setMessages(prevMessages => [...prevMessages, convertedMessage]);
                }
            });
        };

        client.activate();
    };

    // 개선된 연결 해제 함수
    const disconnectWebSocket = () => {
        if (stompClient) {
            // 서버에 나가기 알림 전송
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

            // 연결 종료
            stompClient.deactivate();
            setStompClient(null);
        }
    };

    // 스크롤을 맨 아래로 이동시키는 함수
    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    // 메시지가 변경될 때마다 스크롤을 맨 아래로 이동
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 채팅방이 열릴 때마다 메시지 목록 가져오기 및 WebSocket 연결
    useEffect(() => {
        console.log('DetailChat useEffect 실행:', { open, chatRoomId, chatRoom });
        if (open && chatRoomId) {
            console.log('메시지 가져오기 조건 만족, chatRoomId:', chatRoomId);
            fetchMessages(chatRoomId);
            // WebSocket이 이미 연결되어 있지 않은 경우에만 연결
            if (!stompClient) {
                connectWebSocket();
            }

            // 채팅방 진입 시 읽음 처리 (1초 후)
            setTimeout(() => {
                markMessagesAsRead();
            }, 1000);

            // 스크롤이 맨 아래에 있을 때 자동 읽음 처리
            const handleScroll = () => {
                if (messagesContainerRef.current) {
                    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
                    if (scrollTop + clientHeight >= scrollHeight - 10) {
                        markMessagesAsRead();
                    }
                }
            };

            // 스크롤 이벤트 리스너 추가
            if (messagesContainerRef.current) {
                messagesContainerRef.current.addEventListener('scroll', handleScroll);
            }
        } else {
            console.log('메시지 가져오기 조건 불만족:', { open, chatRoomId });
            disconnectWebSocket();
        }

        // 컴포넌트 언마운트 시 WebSocket 연결 해제
        return () => {
            disconnectWebSocket();
        };
    }, [open, chatRoomId]);

    // chatRoom이 유효하지 않은 경우 처리
    if (!chatRoom) {
        console.warn('DetailChat: chatRoom이 유효하지 않습니다.');
        return null;
    }

    const fetchMessages = async (roomId) => {
        setLoading(true);
        console.log('메시지 가져오기 시작, roomId:', roomId);
        console.log('요청 URL:', `http://localhost:4989/listMessage?chat_room_id=${roomId}`);

        try {
            const response = await axios.get(`http://localhost:4989/listMessage?chat_room_id=${roomId}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 5000 // 5초 타임아웃
            });
            console.log('API 응답 상태:', response.status);
            console.log('API 응답 헤더:', response.headers);
            console.log('API 응답 데이터:', response.data);
            console.log('응답 데이터 타입:', typeof response.data);
            console.log('응답 데이터 길이:', Array.isArray(response.data) ? response.data.length : '배열이 아님');

            // null 값들을 필터링하고 더 자세한 로그 추가
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

    // 메시지 전송 함수
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
                setMessage('');
            } catch (error) {
                console.error('메시지 전송 실패:', error);
            }
        } else {
            console.error('메시지 전송 실패: 필요한 정보가 부족합니다', {
                message: message.trim(),
                chatRoomId,
                memberId: userInfo?.memberId,
                stompClient: !!stompClient
            });
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
                height: 'calc(100% - 80px)', // 헤더 높이를 제외한 나머지 공간
                display: 'flex',
                flexDirection: 'column',
                background: '#f8f9fa'
            }}>
                {/* 메시지 영역 */}
                <Box
                    ref={messagesContainerRef}
                    sx={{
                        flex: 1,
                        overflow: 'auto',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0 // 스크롤이 제대로 작동하도록 설정
                    }}
                >
                    {loading ? (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography>메시지를 불러오는 중...</Typography>
                        </Box>
                    ) : (messages || []).map((msg) => {
                        // msg가 null이거나 undefined인 경우 건너뛰기
                        if (!msg) return null;

                        const isOwnMessage = msg?.sender_id === userInfo?.memberId || msg?.senderId === userInfo?.memberId;

                        // 시간 포맷팅 함수
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

                                {/* 시간과 조회 상태 */}
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

                                    {/* 내가 보낸 메시지일 때만 조회 상태 표시 */}
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
                                                    color: msg?.is_read === 1 ? '#3182f6' : '#ccc', // 파란색 (읽음) / 회색 (안읽음)
                                                    fontSize: '10px',
                                                    fontWeight: msg?.is_read === 1 ? 'bold' : 'normal'
                                                }}
                                            >
                                                {msg?.is_read === 1 ? '읽음' : '안읽음'}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>

                <Divider />

                {/* 메시지 입력 영역 - 고정 높이 */}
                <Box sx={{
                    p: 2,
                    background: '#fff',
                    flexShrink: 0 // 입력 영역이 축소되지 않도록 설정
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