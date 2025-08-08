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
    CircularProgress,
    Menu,
    MenuItem
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert'; // 햄버거 메뉴 아이콘 추가
import ExitToAppIcon from '@mui/icons-material/ExitToApp'; // 나가기 아이콘
import FlagIcon from '@mui/icons-material/Flag'; // 신고 아이콘
import DeleteIcon from '@mui/icons-material/Delete';
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

const DetailChat = ({ open, onClose, chatRoom, zIndex = 1000, offset = 0, onLeaveChat }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const { userInfo } = useContext(AuthContext);
    const messagesContainerRef = useRef(null);
    const [stompClient, setStompClient] = useState(null);
    const [otherUserInfo, setOtherUserInfo] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const fileInputRef = useRef(null);
    const [anchorEl, setAnchorEl] = useState(null); // 메뉴 상태 관리
    const [messageMenuAnchorEl, setMessageMenuAnchorEl] = useState(null);
    const [selectedMessageId, setSelectedMessageId] = useState(null);

    const chatRoomId = chatRoom?.chatRoomId;
    const SERVER_IP = '192.168.10.136';
    const SERVER_PORT = '4989';

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // ✅ 메시지 메뉴 열기 함수
    const handleMessageMenuOpen = (event, messageId) => {
        event.preventDefault(); // 기본 우클릭 메뉴 방지
        setMessageMenuAnchorEl({ mouseX: event.clientX, mouseY: event.clientY });
        setSelectedMessageId(messageId);
    };

    // ✅ 메시지 메뉴 닫기 함수
    const handleMessageMenuClose = () => {
        setMessageMenuAnchorEl(null);
        setSelectedMessageId(null);
    };

    // ✅ 메시지 삭제 함수
    const handleDeleteMessage = async () => {
        handleMessageMenuClose();
        console.log('--- 삭제 요청 직전 ---');
        console.log('selectedMessageId:', selectedMessageId);
        if (!selectedMessageId) return;

        try {
            const response = await axios.post(
                `http://${SERVER_IP}:${SERVER_PORT}/chat/deleteMessage`,
                {
                    messageId: selectedMessageId,
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if (response.status === 200) {
                console.log('메시지 삭제 성공:', response.data);
                // UI에서 메시지 삭제 (deleted_at이 추가되었다면 필터링으로 처리)
                setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                        msg.message_id === selectedMessageId
                            ? { ...msg, message_content: '삭제된 메시지입니다.', message_type: 'deleted' }
                            : msg
                    )
                );
            } else {
                console.error('메시지 삭제 실패:', response.status);
                alert('메시지 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('메시지 삭제 API 호출 오류:', error);
            alert('메시지 삭제 중 오류가 발생했습니다.');
        }
    };

    // DetailChat.js 파일의 handleLeaveChat 함수
    const handleLeaveChat = async () => {
        console.log("채팅방 나가기 클릭됨");
        handleMenuClose();
        try {
            // 1. axios.post로 변경하고, 요청 본문(body)에 chatRoomId와 currentMemberId를 담아 보냅니다.
            const response = await axios.post(
                `http://${SERVER_IP}:${SERVER_PORT}/chat/exit`,
                {
                    chatRoomId: chatRoomId, // DTO에 맞게 카멜케이스로 보냅니다.
                    currentMemberId: userInfo.memberId
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            if (response.status === 200) {
                console.log('채팅방 나가기 성공:', response.data);
                // 성공 시, 채팅방 UI 닫기
                onClose();
                if (onLeaveChat) {
                    onLeaveChat(); // ChatMain의 목록 업데이트 함수 호출
                }
            } else {
                console.error('채팅방 나가기 실패:', response.status);
                alert('채팅방을 나가는 데 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('채팅방 나가기 API 호출 오류:', error);
            alert('채팅방을 나가는 도중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    };

    const handleReportChat = () => {
        // 여기에 채팅방 신고하기 로직을 구현합니다.
        // 예: 신고 모달 띄우기, 백엔드 API 호출 등
        console.log("채팅방 신고하기 클릭됨");
        handleMenuClose();
    };

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

        try {
            for (const image of selectedImages) {
                const formData = new FormData();
                formData.append('file', image.file);
                formData.append('chatRoomId', chatRoomId);
                formData.append('senderId', userInfo.memberId);

                await axios.post(
                    `http://${SERVER_IP}:${SERVER_PORT}/chat/uploadImage`,
                    formData,
                    {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    }
                );
            }

            setSelectedImages([]);

        } catch (error) {
            console.error('이미지 업로드 및 전송 실패:', error);
            alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const handleSendMessage = () => {
        if (selectedImages.length > 0) {
            sendAllImages();
        } else if (message.trim()) {
            if (!stompClient || !stompClient.active) {
                console.error("STOMP 클라이언트가 연결되지 않았습니다.");
                return;
            }

            const chatMessage = {
                type: 'CHAT',
                chat_room_id: chatRoomId,
                sender_id: userInfo.memberId,
                message_content: message,
                message_type: 'text',
            };

            // ✨ 비동기 함수로 변경하여 DB 저장 로직을 추가합니다.
            const sendMessageAsync = async () => {
                try {
                    // 1. DB에 메시지 저장 요청
                    const response = await axios.post(`http://${SERVER_IP}:${SERVER_PORT}/insertMessage`, chatMessage);
                    const createdMessageId = response.data; // 백엔드에서 반환된 message_id

                    console.log('✅ DB에서 받은 createdMessageId:', createdMessageId); // 👈 ID 값 확인

                    // 2. 웹소켓으로 전송할 완전한 메시지 객체 생성
                    const fullNewMessage = {
                        ...chatMessage,
                        message_id: createdMessageId,
                        created_at: new Date().toISOString(),
                        is_read: 0,
                        deleted_at: null
                    };

                    // 3. 프론트엔드 상태를 즉시 업데이트
                    setMessages(prevMessages => [...prevMessages, fullNewMessage]);

                    // 4. 웹소켓으로 메시지 전송
                    stompClient.publish({
                        destination: `/app/chat.sendMessage/${chatRoomId}`,
                        body: JSON.stringify(fullNewMessage),
                    });

                    setMessage(''); // 메시지 입력창 초기화

                } catch (error) {
                    console.error('텍스트 메시지 전송 실패:', error);
                }
            };

            sendMessageAsync();
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

        // DetailChat.jsx 파일

        const fetchChatData = async () => {
            setLoading(true);
            try {
                const messageResponse = await axios.get(`http://${SERVER_IP}:${SERVER_PORT}/listMessage?chat_room_id=${chatRoomId}`);
                const otherUserResponse = await axios.get(`http://${SERVER_IP}:${SERVER_PORT}/chat/otherUser?chat_room_id=${chatRoomId}&member_id=${userInfo.memberId}`);

                const rawMessages = Array.isArray(messageResponse.data) ? messageResponse.data.filter(msg => msg !== null && msg !== undefined) : [];

                // ✨ 백엔드에서 받은 메시지 데이터를 프론트엔드에서 한 번 더 가공합니다.
                const processedMessages = rawMessages.map(msg => {
                    // 1. 삭제된 메시지인 경우 먼저 처리
                    if (msg.deleted_at !== null && msg.deleted_at !== undefined) {
                        return {
                            ...msg,
                            message_content: "삭제된 메시지입니다.",
                            message_type: "deleted"
                        };
                    }
                    // 2. 이미지 메시지인 경우 처리
                    else if (msg.message_type === 'image' && msg.message_content && !msg.message_content.startsWith('http')) {
                        return {
                            ...msg,
                            message_content: `http://${SERVER_IP}:${SERVER_PORT}${msg.message_content}`
                        };
                    }
                    // 3. 위의 조건에 해당하지 않는 모든 경우 (텍스트 메시지 포함)는 원본 메시지 그대로 반환
                    else {
                        return msg;
                    }
                });

                setMessages(processedMessages);
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

                // 텍스트 메시지 삭제 이벤트를 처리하는 로직 추가
                if (receivedMessage.type === 'DELETE') {
                    setMessages(prevMessages =>
                        prevMessages.map(msg =>
                            msg.message_id === receivedMessage.messageId
                                ? {
                                    ...msg,
                                    message_content: '삭제된 메시지입니다.',
                                    message_type: 'deleted',
                                    deleted_at: new Date().toISOString() // 삭제 시간도 상태에 추가
                                }
                                : msg
                        )
                    );
                } else if (receivedMessage.type === 'READ_UPDATE') {
                    setMessages(prevMessages =>
                        prevMessages.map(msg => ({
                            ...msg,
                            is_read: msg.is_read === 0 && receivedMessage.senderId === msg.sender_id ? 1 : msg.is_read,
                        }))
                    );
                } else if (receivedMessage.chatRoomId === chatRoomId) {
                    const convertedMessage = {
                        message_id: receivedMessage.messageId,
                        chat_room_id: receivedMessage.chatRoomId,
                        sender_id: receivedMessage.senderId,
                        message_type: receivedMessage.messageType,
                        message_content: receivedMessage.messageContent,
                        created_at: receivedMessage.timestamp,
                        is_read: 0
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
                {/* 햄버거 메뉴 버튼 추가 */}
                <IconButton
                    aria-label="more"
                    aria-controls="long-menu"
                    aria-haspopup="true"
                    onClick={handleMenuOpen}
                >
                    <MoreVertIcon />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={handleLeaveChat}>
                        <ExitToAppIcon sx={{ mr: 1 }} />
                        채팅방 나가기
                    </MenuItem>
                    <MenuItem onClick={handleReportChat}>
                        <FlagIcon sx={{ mr: 1 }} />
                        신고하기
                    </MenuItem>
                </Menu>
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
                        const isDeletedMessage = msg.message_type === 'deleted'; // ✅ 삭제된 메시지인지 확인

                        let imageUrl = msg?.message_content;
                        if (msg?.message_type === 'image' && imageUrl && !imageUrl.startsWith('http')) {
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
                                // ✅ 우클릭 이벤트 추가
                                onContextMenu={(e) => {
                                    console.log('우클릭 이벤트 발생! messageId:', msg.message_id); //
                                    handleMessageMenuOpen(e, msg.message_id);
                                }}
                            >
                                <MessageBubble isOwn={isOwnMessage}>
                                    {/* ✅ isDeletedMessage 상태에 따라 렌더링 내용 변경 */}
                                    {isDeletedMessage ? (
                                        <Typography variant="body2" sx={{ color: '#aaa', fontStyle: 'italic' }}>
                                            {msg.message_content}
                                        </Typography>
                                    ) : msg.message_type === 'image' ? (
                                        <Box sx={{ maxWidth: '200px' }}>
                                            <img
                                                src={imageUrl}
                                                alt="전송된 이미지"
                                                style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                                            />
                                        </Box>
                                    ) : (
                                        <Typography variant="body2">
                                            {msg.message_content || '메시지 내용 없음'}
                                        </Typography>
                                    )}
                                </MessageBubble>
                                {!isDeletedMessage && ( // ✅ 삭제된 메시지는 시간, 읽음 여부 표시하지 않음
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
                                            sx={{ color: '#666', fontSize: '11px' }}
                                        >
                                            {formatTime(msg.created_at)}
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
                                                        color: msg.is_read === 1 ? '#3182f6' : '#ccc',
                                                        fontSize: '10px',
                                                        fontWeight: msg.is_read === 1 ? 'bold' : 'normal'
                                                    }}
                                                >
                                                    {msg.is_read === 1 ? '읽음' : '안읽음'}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>
                {/* ✅ 메시지 삭제 메뉴 컴포넌트 추가 */}
                <Menu
                    open={messageMenuAnchorEl !== null}
                    onClose={handleMessageMenuClose}
                    anchorReference="anchorPosition"
                    anchorPosition={
                        messageMenuAnchorEl !== null
                            ? { top: messageMenuAnchorEl.mouseY, left: messageMenuAnchorEl.mouseX }
                            : undefined
                    }
                >
                    <MenuItem onClick={handleDeleteMessage}>
                        <DeleteIcon sx={{ mr: 1 }} />
                        삭제
                    </MenuItem>
                </Menu>

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