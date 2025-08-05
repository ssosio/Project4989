import React, { useState } from 'react';
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

const StyledDialog = styled(Dialog)(({ theme, zindex, offset }) => ({
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

    console.log('DetailChat props:', { open, chatRoom });

    // chatRoom이 유효하지 않은 경우 처리
    if (!chatRoom) {
        console.warn('DetailChat: chatRoom이 유효하지 않습니다.');
        return null;
    }

    // 임시 메시지 데이터
    const messages = [

    ];

    const handleSendMessage = () => {
        if (message.trim()) {
            // 여기에 메시지 전송 로직 추가
            console.log('메시지 전송:', message);
            setMessage('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    console.log('DetailChat 렌더링:', { open, chatRoom });

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
                    {chatRoom.avatar}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#222' }}>
                        {chatRoom.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                        {chatRoom.isOnline ? '온라인' : '오프라인'}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseRoundedIcon />
                </IconButton>
            </ChatHeader>

            <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: '#f8f9fa'
            }}>
                {/* 메시지 영역 */}
                <Box sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {messages.map((msg) => (
                        <Box
                            key={msg.id}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: msg.isOwn ? 'flex-end' : 'flex-start',
                                mb: 1
                            }}
                        >
                            <MessageBubble isOwn={msg.isOwn}>
                                <Typography variant="body2">
                                    {msg.text}
                                </Typography>
                            </MessageBubble>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#666',
                                    fontSize: '11px',
                                    alignSelf: msg.isOwn ? 'flex-end' : 'flex-start'
                                }}
                            >
                                {msg.time}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                <Divider />

                {/* 메시지 입력 영역 */}
                <Box sx={{ p: 2, background: '#fff' }}>
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