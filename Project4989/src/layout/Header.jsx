import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Avatar, Menu, MenuItem, InputBase, Badge } from '@mui/material';
import { styled  } from '@mui/material/styles';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';

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

export const Header = () => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" elevation={0} sx={{ 
      background: '#fff', 
      color: '#222', 
      borderBottom: '1px solid #f0f2f5',
      height: '64px',
      width: '100%'
    }}>
      <Toolbar sx={{ 
        height: '64px',
        minHeight: '64px',
        px: { xs: 2, sm: 4 },
        width: '100%'
      }}>
        {/* 로고 */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/4989로고.png" 
            alt="4989 로고" 
            style={{ 
              height: '60px', 
              width: 'auto',
              marginRight: '15px'
            }} 
          />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#3182f6', letterSpacing: '-1px', fontSize: 24 }}>
            사9팔9  
          </Typography>
        </Box>
        {/* 검색바 */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <TossSearch>
            <SearchIconWrapper>
              <SearchRoundedIcon />
            </SearchIconWrapper>
            <StyledInputBase placeholder="물품이나 동네를 검색하세요" inputProps={{ 'aria-label': 'search' }} />
          </TossSearch>
        </Box>
        {/* 우측 아이콘 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" sx={{ p: 1 }}>
            <Badge badgeContent={2} color="primary" sx={{ '& .MuiBadge-badge': { background: '#3182f6' } }}>
              <NotificationsNoneRoundedIcon fontSize="medium" />
            </Badge>
          </IconButton>
          <IconButton onClick={handleMenu} color="inherit" sx={{ p: 1 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#e3f0fd', color: '#3182f6' }}>
              <PersonOutlineRoundedIcon />
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleClose}>내 프로필</MenuItem>
            <MenuItem onClick={handleClose}>내 거래</MenuItem>
            <MenuItem onClick={handleClose}>로그아웃</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header
