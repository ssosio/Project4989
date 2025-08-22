import React, { useContext, useState, useEffect, useRef } from 'react';
import {
    Box,
    Dialog,
    IconButton,
    Typography,
    Avatar,
    TextField,
    InputAdornment,
    CircularProgress,
    Divider,
    Menu,
    MenuItem,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import FlagIcon from '@mui/icons-material/Flag';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import DeleteIcon from '@mui/icons-material/Delete';
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import SearchIcon from '@mui/icons-material/Search';

const StyledDialog = styled(Dialog)(({ zindex, offset }) => ({
    '& .MuiDialog-paper': {
        position: 'absolute',
        right: 0,
        top: 0,
        height: '100vh',
        maxHeight: '100vh',
        width: 450,
        maxWidth: 'none',
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
        transform: `translateX(${offset}px)`,
        zIndex: zindex,
        display: 'flex',
        flexDirection: 'column'
    }
}));

const ChatHeader = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #f0f2f5',
    background: '#fff',
    gap: '12px'
}));

const MessageBubble = styled(Box)(({ isOwn }) => ({
    padding: '10px 14px',
    borderRadius: '18px',
    maxWidth: '70%',
    wordBreak: 'break-word',
    backgroundColor: isOwn ? '#3182f6' : '#fff',
    color: isOwn ? '#fff' : '#222',
    alignSelf: isOwn ? 'flex-end' : 'flex-start',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
}));

const DetailChat = ({ open, onClose, chatRoom, zIndex = 1000, offset = 0, onLeaveChat, onUpdateLastMessage, onMarkAsRead, onIncrementUnreadCount, isChatRoomActive }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const { userInfo } = useContext(AuthContext);
    const messagesContainerRef = useRef(null);
    // 수정: stompClient 상태를 다시 추가합니다.
    const [stompClient, setStompClient] = useState(null);
    const [otherUserInfo, setOtherUserInfo] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const fileInputRef = useRef(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [messageMenuAnchorEl, setMessageMenuAnchorEl] = useState(null);
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDetail, setReportDetail] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentResultIndex, setCurrentResultIndex] = useState(0);
    const messageRefs = useRef({});
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const isInitialScrollDone = useRef(false);

    const chatRoomId = chatRoom?.chatRoomId;
    const SERVER_IP = '192.168.10.138';
    const SERVER_PORT = '4989';

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const toggleSearch = () => {
        setIsSearchOpen(prev => {
            const next = !prev;
            if (!next) {
                setSearchQuery('');
                setSearchResults([]);
                setCurrentResultIndex(0);
            }
            return next;
        });
    };

    const handleMessageMenuOpen = (event, message) => {
        event.preventDefault();
        // ⭐ 변경: 자신이 보낸 메시지인 경우에만 메뉴를 엽니다.
        if (String(message.sender_id) === String(userInfo.memberId)) {
            setMessageMenuAnchorEl({ mouseX: event.clientX, mouseY: event.clientY });
            setSelectedMessageId(message.message_id);
        }
    };

    const handleMessageMenuClose = () => {
        setMessageMenuAnchorEl(null);
        setSelectedMessageId(null);
    };

    const handleSearchChange = (e) => {
        const q = e.target.value;
        setSearchQuery(q);
    };


    useEffect(() => {
        if (!searchQuery || !searchQuery.trim()) {
            setSearchResults([]);
            setCurrentResultIndex(0);
            return;
        }
        const qLower = searchQuery.toLowerCase();
        const results = messages.filter(msg =>
            msg?.message_type === 'text' &&
            msg?.message_content &&
            msg.message_content.toLowerCase().includes(qLower)
        );
        setSearchResults(results);
        setCurrentResultIndex(0);

        if (results.length > 0) {
            const firstId = results[0].message_id;
            setTimeout(() => {
                if (messageRefs.current[firstId]) {
                    messageRefs.current[firstId].scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 100);
        }
    }, [searchQuery, messages]);

    // ⭐ 수정된 useEffect: 초기 메시지 로드 후 한 번만 스크롤합니다.
    useEffect(() => {
        if (!open || !chatRoomId || !userInfo) {
            // 채팅방 닫힘 또는 필수 정보가 없을 때 상태 초기화 및 연결 해제
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
            // ⭐ 초기 스크롤 플래그 초기화
            isInitialScrollDone.current = false;
            return;
        } // <-- 이 중괄호가 빠져 있었습니다.

        // 이 아래에 나머지 로직을 이어서 작성하시면 됩니다.
        // ...
    }, [open, chatRoomId, userInfo?.memberId]);


    const handleDeleteMessage = async () => {
        handleMessageMenuClose();
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
                const updatedMessage = response.data;
                setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                        msg.message_id === selectedMessageId
                            ? { ...msg, message_content: '삭제된 메시지입니다.', message_type: 'deleted' }
                            : msg
                    )
                );
                if (onUpdateLastMessage) {
                    onUpdateLastMessage(
                        chatRoomId,
                        '삭제된 메시지입니다.',
                        'deleted',
                        updatedMessage.createdAt || new Date().toISOString()
                    );
                }
            } else {
                // 커스텀 모달로 변경 필요
                console.error('메시지 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('메시지 삭제 API 호출 오류:', error);
            // 커스텀 모달로 변경 필요
        }
    };

    const handleLeaveChat = async () => {
        handleMenuClose();
        try {
            const response = await axios.post(
                `http://${SERVER_IP}:${SERVER_PORT}/chat/exit`,
                {
                    chatRoomId: chatRoomId,
                    currentMemberId: userInfo.memberId
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            if (response.status === 200) {
                onClose();
                if (onLeaveChat) onLeaveChat();
            } else {
                // 커스텀 모달로 변경 필요
                console.error('채팅방을 나가는 데 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('채팅방 나가기 API 호출 오류:', error);
            // 커스텀 모달로 변경 필요
        }
    };

    const handleReportChat = () => {
        handleMenuClose();
        setReportModalOpen(true);
    };

    const handleReportModalClose = () => {
        setReportModalOpen(false);
        setReportReason('');
        setReportDetail('');
    };

    const handleReportSubmit = async () => {
        if (!reportReason) {
            // 커스텀 모달로 변경 필요
            console.error('신고 이유를 선택해주세요.');
            return;
        }
        try {
            const reportData = {
                declaration_chat_room_id: chatRoomId,
                declaration_memberid: userInfo.memberId,
                declaration_opposite_memberid: otherUserInfo.memberId,
                declaration_type: reportReason,
                declaration_content: reportDetail
            };
            const response = await axios.post(
                `http://${SERVER_IP}:${SERVER_PORT}/submit`,
                reportData,
                { headers: { 'Content-Type': 'application/json' } }
            );
            if (response.status === 200 || response.status === 201) {
                // 커스텀 모달로 변경 필요
                console.log('신고가 접수되었습니다. 감사합니다.');
                handleReportModalClose();
            } else {
                // 커스텀 모달로 변경 필요
                console.error('신고 접수에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('신고 API 호출 오류:', error);
            // 커스텀 모달로 변경 필요
        }
    };

    const markMessagesAsRead = () => {
        const hasUnreadMessages = messages.some(msg =>
            String(msg.sender_id) !== String(userInfo.memberId) && msg.is_read === 0
        );

        if (hasUnreadMessages) {
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.sender_id !== userInfo.memberId ? { ...msg, is_read: 1 } : msg
                )
            );
        }

        if (stompClient?.active) {
            stompClient.publish({
                destination: `/app/chat.readMessageStatus`,
                body: JSON.stringify({
                    type: 'READ',
                    chatRoomId: String(chatRoom.chatRoomId),
                    senderId: String(userInfo.memberId),
                    timestamp: new Date().toISOString()
                })
            });
        }

        if (onMarkAsRead) {
            onMarkAsRead(chatRoom.chatRoomId);
        }
    };
    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            // 🔧 수정: 더 안정적인 스크롤 처리
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    };

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files || []);
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
        if (selectedImages.length === 0 || !chatRoomId || !userInfo?.memberId) return;
        try {
            for (const image of selectedImages) {
                const formData = new FormData();
                formData.append('file', image.file);
                formData.append('chatRoomId', chatRoomId);
                formData.append('senderId', userInfo.memberId);
                const response = await axios.post(
                    `http://${SERVER_IP}:${SERVER_PORT}/chat/uploadImage`,
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );
                const sentMessage = response.data;
                if (onUpdateLastMessage) {
                    onUpdateLastMessage(chatRoomId, "사진", 'image', sentMessage.createdAt);
                }
            }
            setSelectedImages([]);
        } catch (error) {
            console.error('이미지 업로드 및 전송 실패:', error);
            // 커스텀 모달로 변경 필요
        }
    };

    const handleSendMessage = () => {
        if (selectedImages.length > 0) {
            sendAllImages();
            return;
        }
        if (!message.trim()) return;
        if (!stompClient || !stompClient.active) {
            console.error("STOMP 클라이언트가 연결되지 않았습니다.");
            return;
        }

        const webSocketMessage = {
            type: 'CHAT',
            chat_room_id: chatRoomId,
            sender_id: userInfo.memberId,
            message_content: message,
            message_type: 'text',
        };

        // 🔧 추가: 낙관적 업데이트로 메시지를 먼저 화면에 표시
        const newMessage = {
            message_id: Date.now(),
            chat_room_id: chatRoomId,
            sender_id: userInfo.memberId,
            message_type: 'text',
            message_content: message,
            created_at: new Date().toISOString(),
            is_read: 1,
            status: 'sending'
        };

        // 메시지를 먼저 상태에 추가
        setMessages(prevMessages => [...prevMessages, newMessage]);

        // 입력창 비우기
        setMessage('');

        try {
            stompClient.publish({
                destination: '/app/chat.sendMessage',
                body: JSON.stringify(webSocketMessage),
            });

            if (onUpdateLastMessage) {
                onUpdateLastMessage(chatRoomId, message, 'text', new Date().toISOString());
            }

            // 🔧 제거: useEffect에서 자동으로 스크롤 처리하므로 여기서는 불필요

        } catch (error) {
            console.error('텍스트 메시지 전송 실패:', error);
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

    // 수정: STOMP 연결, 구독, 초기 메시지 로드를 한 useEffect에서 관리
    useEffect(() => {
        if (!open || !chatRoomId || !userInfo) {
            // 컴포넌트가 닫히거나 필수 정보가 없으면,
            // 기존 연결이 있다면 해제하고 상태를 초기화합니다.
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
                const rawMessages = Array.isArray(messageResponse.data) ? messageResponse.data.filter(msg => msg !== null && msg !== undefined) : [];
                const processedMessages = rawMessages.map(msg => {
                    if (msg.deleted_at !== null && msg.deleted_at !== undefined) {
                        return msg;
                    } else if (msg.message_type === 'image' && msg.message_content && !msg.message_content.startsWith('http')) {
                        return {
                            ...msg,
                            message_content: `http://${SERVER_IP}:${SERVER_PORT}${msg.message_content}`
                        };
                    } else {
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
                // ⭐ 추가: 초기 로딩이 완료되고 아직 스크롤하지 않았다면
                if (!isInitialScrollDone.current) {
                    // 메시지가 모두 로드된 후 스크롤이 되도록 setTimeout 사용
                    setTimeout(() => {
                        scrollToBottom();
                        // ⭐ 스크롤 완료 플래그를 true로 설정
                        isInitialScrollDone.current = true;
                    }, 100);
                }
            }
        };

        fetchChatData();

        // STOMP 클라이언트 생성 및 연결
        const client = new Client({
            brokerURL: `ws://${SERVER_IP}:${SERVER_PORT}/ws`,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            console.log('STOMP 연결 성공');
            setStompClient(client);

            // 구독 설정
            client.subscribe(`/topic/chat/${chatRoomId}`, (incomingMessage) => {
                const receivedMessage = JSON.parse(incomingMessage.body);
                if (receivedMessage.type === 'DELETE') {
                    setMessages(prevMessages =>
                        prevMessages.map(msg =>
                            msg.message_id === receivedMessage.messageId
                                ? { ...msg, message_content: '삭제된 메시지입니다.', message_type: 'deleted', deleted_at: new Date().toISOString() }
                                : msg
                        )
                    );
                    if (onUpdateLastMessage) {
                        onUpdateLastMessage(chatRoomId, '삭제된 메시지입니다.', 'deleted', new Date().toISOString());
                    }
                } else if (receivedMessage.type === 'READ_UPDATE') {
                    setMessages(prevMessages =>
                        prevMessages.map(msg => {
                            // 동시에 해당 메시지가 내가 보낸 메시지(msg.sender_id)일 경우
                            if (String(receivedMessage.senderId) !== String(userInfo.memberId) &&
                                String(msg.sender_id) === String(userInfo.memberId)) {
                                return { ...msg, is_read: 1 };
                            }
                            return msg;
                        })
                    );
                } else if (receivedMessage.type === 'CHAT' || receivedMessage.type === 'IMAGE') {
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
                    if (onUpdateLastMessage) {
                        const lastMessageContent = receivedMessage.messageType === 'image' ? '사진' : receivedMessage.messageContent;
                        onUpdateLastMessage(receivedMessage.chatRoomId, lastMessageContent, receivedMessage.messageType, receivedMessage.timestamp);
                    }

                    // 🔹 채팅방이 닫혀있으면 unreadCount 증가 요청
                    if (onIncrementUnreadCount && !isChatRoomActive(receivedMessage.chatRoomId)) {
                        onIncrementUnreadCount(receivedMessage.chatRoomId);
                    }
                }
            });
            // 연결 직후 읽음 처리 메시지 전송
            const timeoutId = setTimeout(markMessagesAsRead, 500);
            return () => clearTimeout(timeoutId);
        };

        client.onStompError = (frame) => {
            console.error('브로커 오류:', frame);
        };

        client.activate();

        // 컴포넌트 언마운트 시 클라이언트 비활성화
        return () => {
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

    // 🔧 추가: 메시지가 추가될 때마다 자동 스크롤 (본인이 보낸 메시지일 때만)
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && String(lastMessage.sender_id) === String(userInfo?.memberId)) {
                // 본인이 보낸 메시지일 때만 스크롤
                setTimeout(() => {
                    scrollToBottom();
                }, 50);
            }
        }
    }, [messages.length, userInfo?.memberId]);

    // 수정: 컴포넌트가 열릴 때 읽음 처리를 요청하는 별도의 useEffect
    useEffect(() => {
        if (open && stompClient && stompClient.active) {
            const timeoutId = setTimeout(markMessagesAsRead, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [open, messages, stompClient, chatRoomId, userInfo?.memberId]);

    useEffect(() => {
        return () => {
            selectedImages.forEach(image => URL.revokeObjectURL(image.preview));
        };
    }, [selectedImages]);

    useEffect(() => {
        // 컴포넌트가 마운트될 때 (채팅방에 들어갈 때)
        if (stompClient && stompClient.active) {
            // 서버에 읽음 처리 메시지 전송
            const readMessage = { chatRoomId: chatRoom.chatRoomId, memberId: userInfo.memberId };
            stompClient.publish({
                destination: `/app/chat/markAsRead`, // 서버의 읽음 처리 엔드포인트
                body: JSON.stringify(readMessage)
            });
        }
        // ... (기타 useEffect 로직)
    }, [stompClient, chatRoom.chatRoomId, userInfo?.memberId, otherUserInfo?.memberId]);

    // ... (기존 코드)

    useEffect(() => {
        if (!chatRoomId || !userInfo?.memberId) return;

        const token = localStorage.getItem('accessToken');

        fetch(`http://${SERVER_IP}:${SERVER_PORT}/read?chat_room_id=${chatRoomId}&member_id=${userInfo.memberId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
    }, [chatRoomId, userInfo?.memberId]);

    const scrollToMessage = (messageId) => {
        if (messageRefs.current[messageId]) {
            messageRefs.current[messageId].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    };

    const handleNextResult = () => {
        if (searchResults.length === 0) return;
        const nextIndex = (currentResultIndex + 1) % searchResults.length;
        setCurrentResultIndex(nextIndex);
        scrollToMessage(searchResults[nextIndex].message_id);
    };

    const handlePrevResult = () => {
        if (searchResults.length === 0) return;
        const prevIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
        setCurrentResultIndex(prevIndex);
        scrollToMessage(searchResults[prevIndex].message_id);
    };

    if (!open) return null;
    return (
        <>
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

                    <IconButton onClick={toggleSearch}>
                        <SearchIcon />
                    </IconButton>

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

                {/* 검색창(토글) — 채팅 목록 바로 위에 노출되도록 */}
                {isSearchOpen && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            padding: '8px 12px',
                            borderBottom: '1px solid #e6e6e6',
                            backgroundColor: '#fafafa'
                        }}
                    >
                        <SearchIcon sx={{ color: '#666' }} />
                        <input
                            type="text"
                            placeholder="검색할 내용을 입력하세요"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontSize: 14
                            }}
                        />
                        <Typography variant="caption" sx={{ color: '#666' }}>
                            {searchResults.length > 0 ? `${currentResultIndex + 1}/${searchResults.length}` : '0/0'}
                        </Typography>
                        <Button
                            onClick={handlePrevResult}
                            size="small"
                            variant="outlined"
                            disabled={searchResults.length === 0}
                        >
                            이전
                        </Button>
                        <Button
                            onClick={handleNextResult}
                            size="small"
                            variant="outlined"
                            disabled={searchResults.length === 0}
                        >
                            다음
                        </Button>
                    </Box>
                )}

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
                            const isDeletedMessage = msg.message_type === 'deleted';

                            let imageUrl = msg?.message_content;
                            if (msg?.message_type === 'image' && imageUrl && !imageUrl.startsWith('http')) {
                                imageUrl = `http://${SERVER_IP}:${SERVER_PORT}${imageUrl}`;
                            }

                            // 하이라이트 여부
                            const isMatch = searchQuery && msg.message_type === 'text' &&
                                msg.message_content?.toLowerCase().includes(searchQuery.toLowerCase());

                            return (
                                <Box
                                    key={msg.message_id || Math.random()}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                                        mb: 1,
                                        // 검색 일치 메시지는 부모 박스에도 약간 패딩/배경 적용해서 더 눈에 띄게
                                        backgroundColor: isMatch ? 'rgba(255,243,205,0.9)' : 'transparent',
                                        borderRadius: isMatch ? '8px' : '0',
                                        padding: isMatch ? '6px' : 0
                                    }}
                                    onContextMenu={(event) => handleMessageMenuOpen(event, msg)}
                                    ref={el => {
                                        if (msg.message_id) messageRefs.current[msg.message_id] = el;
                                    }}
                                >
                                    <MessageBubble isOwn={isOwnMessage}>
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
                                    {!isDeletedMessage && (
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
                        {/* ⭐ 변경: 자신의 메시지인 경우에만 삭제 메뉴를 보여줍니다. */}
                        {selectedMessageId && messages.find(m => m.message_id === selectedMessageId && String(m.sender_id) === String(userInfo.memberId)) && (
                            <MenuItem onClick={handleDeleteMessage}>
                                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                                메시지 삭제
                            </MenuItem>
                        )}
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

            {/* 신고 모달 */}
            <Dialog open={reportModalOpen} onClose={handleReportModalClose}>
                <DialogTitle>채팅방 신고하기</DialogTitle>
                <DialogContent sx={{ minWidth: 400 }}>
                    <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
                        <InputLabel id="report-reason-label">신고 유형</InputLabel>
                        <Select
                            labelId="report-reason-label"
                            value={reportReason}
                            label="신고 유형"
                            onChange={(e) => setReportReason(e.target.value)}
                        >
                            <MenuItem value="">
                                <em>선택</em>
                            </MenuItem>
                            <MenuItem value="스팸">스팸</MenuItem>
                            <MenuItem value="괴롭힘">괴롭힘</MenuItem>
                            <MenuItem value="부적절한 내용">부적절한 내용</MenuItem>
                            <MenuItem value="기타">기타</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="신고 상세 내용"
                        type="text"
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        value={reportDetail}
                        onChange={(e) => setReportDetail(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleReportModalClose}>취소</Button>
                    <Button onClick={handleReportSubmit} variant="contained" color="error">신고</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default DetailChat;