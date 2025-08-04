import React, { useContext, useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Avatar, Menu, MenuItem, InputBase, Badge } from '@mui/material';
import { styled } from '@mui/material/styles';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ChatMain from '../chat/ChatMain';


// --- Styled Components (디자인을 위한 코드) ---
const TossSearch = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 16,
  backgroundColor: '#f5f6fa',
  marginLeft: 0,
  width: '100%',
  maxWidth: 360,
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(2),
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#b0b8c1',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: '#222',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.2, 1, 1.2, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    fontSize: 16,
    background: 'transparent',
    borderRadius: 16,
  },
}));
// --- Styled Components 끝 ---



export const Header = () => {
  // useContext를 사용해 Root 컴포넌트의 userInfo와 handleLogout 함수를 가져옵니다.
  const { userInfo, handleLogout } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const navi = useNavigate();

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleChatClick = () => {
    setChatDrawerOpen(true);
  };
  const handleChatClose = () => {
    setChatDrawerOpen(false);
  };
  useEffect(() => {
    console.log("Header received userInfo:", userInfo);
  }, [userInfo]);


  return (
    <AppBar position="static" elevation={0} sx={{ background: '#fff', color: '#222', borderBottom: '1px solid #f0f2f5', height: '64px', width: '100%' }}>
      <Toolbar sx={{ height: '64px', minHeight: '64px', px: { xs: 2, sm: 4 }, width: '100%' }}>
        {/* 로고 */}


        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navi('/')}>
          <img src="/4989로고.png" alt="4989 로고" style={{ height: '60px', width: 'auto', marginRight: '15px' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#3182f6', letterSpacing: '-1px', fontSize: 24 }}>
            중고러래 사9팔9!
          </Typography>
        </Box>


        {/* 검색바 */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <TossSearch>
            <SearchIconWrapper><SearchRoundedIcon /></SearchIconWrapper>
            <StyledInputBase placeholder="물품이나 동네를 검색하세요" />
          </TossSearch>
        </Box>

        {/* 우측 아이콘 및 버튼 영역 (로그인 상태에 따라 분기) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

          {userInfo ? (
            // 로그인 후 UI
            <>
              <IconButton color="inherit" sx={{ p: 1 }} onClick={handleChatClick}>
                <Badge badgeContent={2} color="primary" sx={{ '& .MuiBadge-badge': { background: '#3182F6' } }}>
                  <ChatBubbleOutlineRoundedIcon />
                </Badge>
              </IconButton>
              <IconButton color="inherit" sx={{ p: 1 }}>
                <Badge badgeContent={2} color="primary" sx={{ '& .MuiBadge-badge': { background: '#3182F6' } }}>
                  <NotificationsNoneRoundedIcon fontSize="medium" />
                </Badge>
              </IconButton>
              <Box
                onClick={handleMenu}
                sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', ml: 1, p: 1, borderRadius: '8px', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <Avatar src={'http://localhost:4989/save'+userInfo.profileImageUrl || 'https://placehold.co/40x40'} sx={{ width: 32, height: 32, mr: 1 }} />
                <Typography sx={{ fontWeight: 'bold' }}>
                  {userInfo.nickname}님
                </Typography>
              </Box>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleClose}>내 프로필</MenuItem>
                <MenuItem onClick={() => {
                  handleLogout();
                  handleClose();
                }}>로그아웃</MenuItem>
              </Menu>
            </>
          ) : (
            // 로그인 전 UI
            <>
              <button type='button' className='btn btn-info' onClick={() => navi('/login')}>로그인</button>
              <button type='button' className='btn btn-info' onClick={() => navi('/signup')}>회원가입</button>
            </>
          )}
        </Box>
      </Toolbar>

      {/* 채팅 드로어 */}
      <ChatMain open={chatDrawerOpen} onClose={handleChatClose} />
    </AppBar>
  );
};

export default Header;
