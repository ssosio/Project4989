import React, { useEffect, useState, useContext, useRef } from 'react';
import {
    Box,
    Dialog,
    Typography,
    IconButton,
    TextField,
    Avatar,
    Divider,
    InputAdornment,
    CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
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
    const [otherUserInfo, setOtherUserInfo] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const fileInputRef = useRef(null);

    const chatRoomId = chatRoom?.chatRoomId;
    const SERVER_IP = '192.168.10.136';
    const SERVER_PORT = '4989';

    const markMessagesAsRead = () => {
        if (stompClient && stompClient.active && chatRoomId && userInfo?.memberId) {
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
                try {
                    stompClient.publish({
                        destination: '/app/chat.readMessage',
                        body: JSON.stringify(readMessage)
                    });
                } catch (e) {
                    console.error("읽음 처리 메시지 전송 실패:", e);
                }
            }
        }
    };

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        const imagePreviews = imageFiles.map(file => ({
            id: Date.now() + Math.random(),
            file: file,
            preview: URL.createObjectURL(file)
        }));
        setSelectedImages(prev => [...prev, ...imagePreviews]);
    };

    const removeImage = (imageId) => {
        setSelectedImages(prev => prev.filter(img => img.id !== imageId));
    };

    const sendAllImages = async () => {
        if (selectedImages.length === 0 || !chatRoomId || !userInfo?.memberId) {
            return;
        }

        // 이미지 업로드 시작 시, 로딩 상태를 표시할 수는 있지만
        // 메시지 목록에 임시 메시지를 추가하는 코드는 절대 넣지 않아야 합니다.

        try {
            // 이미지를 하나씩 업로드하는 루프
            for (const image of selectedImages) {
                const formData = new FormData();
                formData.append('file', image.file);
                formData.append('chatRoomId', chatRoomId);
                formData.append('senderId', userInfo.memberId);

                // 서버에 이미지 업로드만 요청하고, 서버가 웹소켓 메시지를 보내도록 함
                await axios.post(
                    `http://${SERVER_IP}:${SERVER_PORT}/chat/uploadImage`,
                    formData,
                    {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    }
                );
            }

            // 업로드가 완료되면 미리보기 상태만 초기화
            setSelectedImages([]);

        } catch (error) {
            console.error('이미지 업로드 및 전송 실패:', error);
            alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const handleSendMessage = () => {
        if (selectedImages.length > 0) {
            sendAllImages();
            // 이미지 전송 후 텍스트 필드도 비워야 하므로 여기에도 추가
            setMessage('');
        } else if (message.trim()) {
            if (!stompClient || !stompClient.active) {
                console.error("STOMP 클라이언트가 연결되지 않았습니다.");
                return;
            }
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
                body: JSON.stringify(chatMessage),
            });
            // 텍스트 메시지 전송 후 텍스트 필드를 비웁니다.
            setMessage('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    useEffect(() => {
        if (!open || !chatRoomId || !userInfo) {
            if (stompClient && stompClient.active) {
                try {
                    const leaveMessage = {
                        type: 'LEAVE',
                        chatRoomId: chatRoomId,
                        senderId: userInfo?.memberId,
                        timestamp: new Date().toISOString(),
                    };
                    stompClient.publish({
                        destination: '/app/chat.leaveRoom',
                        body: JSON.stringify(leaveMessage),
                    });
                } catch (e) {
                    console.error("LEAVE 메시지 전송 실패:", e);
                }
                stompClient.deactivate();
            }
            setStompClient(null);
            setMessages([]);
            setOtherUserInfo(null);
            setLoading(false);
            setMessage('');
            selectedImages.forEach(image => URL.revokeObjectURL(image.preview));
            setSelectedImages([]);
            return;
        }

        const fetchChatData = async () => {
            setLoading(true);
            try {
                const messageResponse = await axios.get(`http://${SERVER_IP}:${SERVER_PORT}/listMessage?chat_room_id=${chatRoomId}`);
                const otherUserResponse = await axios.get(`http://${SERVER_IP}:${SERVER_PORT}/chat/otherUser?chat_room_id=${chatRoomId}&member_id=${userInfo.memberId}`);
                const filteredMessages = Array.isArray(messageResponse.data) ? messageResponse.data.filter(msg => msg !== null && msg !== undefined) : [];
                setMessages(filteredMessages);
                setOtherUserInfo(otherUserResponse.data);
            } catch (error) {
                console.error('채팅 데이터 로드 실패:', error);
                setMessages([]);
                setOtherUserInfo(null);
            } finally {
                setLoading(false);
            }
        };

        fetchChatData();

        const client = new Client({
            brokerURL: `ws://${SERVER_IP}:${SERVER_PORT}/ws`,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            console.log('WebSocket 연결 성공!');
            setStompClient(client);

            client.subscribe(`/topic/chat/${chatRoomId}`, (incomingMessage) => {
                const receivedMessage = JSON.parse(incomingMessage.body);
                console.log('받은 WebSocket 메시지:', receivedMessage);

                if (receivedMessage.type === 'READ_UPDATE') {
                    setMessages(prevMessages =>
                        prevMessages.map(msg => ({
                            ...msg,
                            is_read: msg.is_read === 0 && receivedMessage.senderId === msg.sender_id ? 1 : msg.is_read,
                        }))
                    );
                } else if (receivedMessage.chatRoomId === chatRoomId) {
                    const convertedMessage = {
                        message_id: receivedMessage.messageId, // 백엔드에서 받은 messageId 사용
                        chat_room_id: receivedMessage.chatRoomId,
                        sender_id: receivedMessage.senderId,
                        message_type: receivedMessage.messageType,
                        message_content: receivedMessage.messageContent,
                        created_at: receivedMessage.timestamp,
                        is_read: 0 // 새로 받은 메시지는 읽지 않은 상태로 초기화
                    };

                    setMessages(prevMessages => {
                        const isDuplicate = prevMessages.some(
                            msg => msg.message_id && msg.message_id === convertedMessage.message_id
                        );
                        return isDuplicate ? prevMessages : [...prevMessages, convertedMessage];
                    });
                }
            });

            const timeoutId = setTimeout(markMessagesAsRead, 500);
            return () => clearTimeout(timeoutId);
        };

        client.onStompError = (frame) => {
            console.error('브로커 오류:', frame);
        };

        client.activate();

        return () => {
            console.log('cleanup 함수 실행');
            if (client && client.active) {
                try {
                    const leaveMessage = {
                        type: 'LEAVE',
                        chatRoomId: chatRoomId,
                        senderId: userInfo?.memberId,
                        timestamp: new Date().toISOString(),
                    };
                    client.publish({
                        destination: '/app/chat.leaveRoom',
                        body: JSON.stringify(leaveMessage),
                    });
                } catch (e) {
                    console.error("LEAVE 메시지 전송 실패:", e);
                }
                client.deactivate();
            }
        };
    }, [open, chatRoomId, userInfo?.memberId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        return () => {
            selectedImages.forEach(image => {
                URL.revokeObjectURL(image.preview);
            });
        };
    }, [selectedImages]);

    if (!open) return null;

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
                    {otherUserInfo?.profileImage ? (
                        <img src={otherUserInfo.profileImage} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        otherUserInfo?.nickname?.charAt(0) || 'U'
                    )}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#222' }}>
                        {otherUserInfo?.nickname || 'Unknown'}
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
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress />
                        </Box>
                    ) : (messages || []).map((msg) => {
                        if (!msg) return null;
                        const isOwnMessage = msg?.sender_id === userInfo?.memberId;

                        // 이미지 URL을 조건에 따라 다르게 설정
                        let imageUrl = msg?.message_content;
                        if (msg?.message_type === 'image' && imageUrl && !imageUrl.startsWith('http')) {
                            // DB에서 불러온 상대 경로일 경우에만 서버 URL을 추가
                            imageUrl = `http://${SERVER_IP}:${SERVER_PORT}${imageUrl}`;
                        }
                        return (
                            <Box
                                key={msg.message_id || Math.random()}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                                    mb: 1
                                }}
                            >
                                <MessageBubble isOwn={isOwnMessage}>
                                    {msg?.message_type === 'image' ? (
                                        <Box sx={{ maxWidth: '200px' }}>
                                            <img
                                                src={imageUrl} // ⭐⭐ 백엔드에서 받은 완전한 URL을 그대로 사용
                                                alt="전송된 이미지"
                                                style={{
                                                    width: '100%',
                                                    height: 'auto',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                        </Box>
                                    ) : (
                                        <Typography variant="body2">
                                            {msg?.message_content || '메시지 내용 없음'}
                                        </Typography>
                                    )}
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
                                        {formatTime(msg?.created_at)}
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
                                                    color: msg?.is_read === 1 ? '#3182f6' : '#ccc',
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

                <Box sx={{
                    p: 2,
                    background: '#fff',
                    flexShrink: 0
                }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                    />
                    {selectedImages.length > 0 && (
                        <Box sx={{
                            display: 'flex',
                            gap: 1,
                            mb: 2,
                            flexWrap: 'wrap',
                            maxHeight: '120px',
                            overflow: 'auto'
                        }}>
                            {selectedImages.map((image) => (
                                <Box key={image.id} sx={{ position: 'relative' }}>
                                    <img
                                        src={image.preview}
                                        alt="미리보기"
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd'
                                        }}
                                    />
                                    <IconButton
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: -8,
                                            right: -8,
                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: 'rgba(0,0,0,0.9)'
                                            }
                                        }}
                                        onClick={() => removeImage(image.id)}
                                    >
                                        <CloseRoundedIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                            onClick={() => fileInputRef.current?.click()}
                            sx={{ color: '#666' }}
                        >
                            <AttachFileRoundedIcon />
                        </IconButton>
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
                                            disabled={!message.trim() && selectedImages.length === 0}
                                            sx={{
                                                color: (message.trim() || selectedImages.length > 0) ? '#3182f6' : '#ccc'
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
            </Box>
        </StyledDialog>
    );
};

export default DetailChat;