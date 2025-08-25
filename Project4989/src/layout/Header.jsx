import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Avatar, Menu, MenuItem, InputBase, Badge, Paper, List, ListItem, ListItemText, Popper, ClickAwayListener } from '@mui/material';
import { styled } from '@mui/material/styles';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ChatMain from '../chat/ChatMain';
import './Header.css';
import axios from 'axios';
import NotificationMain from '../chat/NotificationMain';

// --- Styled Components (디자인을 위한 코드) ---
const TossSearch = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 12,
  backgroundColor: '#F4F1EE',
  marginLeft: 0,
  width: '100%',
  maxWidth: 360,
  border: '1px solid #E0E0E0',
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
  color: '#6B7766',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: '#2E3C2E',
  width: '100%',
  fontFamily: 'Spoqa Han Sans Neo, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.2, 1, 1.2, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    fontSize: 15,
    background: 'transparent',
    borderRadius: 12,
    '&::placeholder': {
      color: '#6B7766',
      opacity: 1,
    },
  },
}));
// --- Styled Components 끝 ---

export const Header = () => {
  // useContext를 사용해 Root 컴포넌트의 userInfo와 handleLogout 함수를 가져옵니다.
  const { userInfo, handleLogout } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0); // 👈 읽지 않은 메시지 개수를 저장할 상태
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0); // 👈 읽지 않은 알림 개수를 저장할 상태
  
  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchAnchorEl, setSearchAnchorEl] = useState(null);
  const [searchError, setSearchError] = useState(null);
  
  const navi = useNavigate();

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleChatClick = () => {
    setChatDrawerOpen(true);
  };
  const handleChatClose = () => {
    setChatDrawerOpen(false);
  };
  const handleNotificationClick = () => {
    setNotificationDrawerOpen(true);
  };
  const handleNotificationClose = () => {
    setNotificationDrawerOpen(false);
  };
  
  // 검색 관련 함수들
  const handleSearchInputChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    setSearchAnchorEl(event.currentTarget);
    
    if (query.trim()) {
      performSearch(query);
    } else {
      setSearchResults([]);
      setSearchAnchorEl(null);
    }
  };

  const performSearch = async (query) => {
    if (!query.trim()) return;
    
    try {
      setSearchLoading(true);
      setSearchError(null);
      
      const { data } = await axios.get('http://localhost:4989/post/search-simple', {
        params: { 
          keyword: query.trim(),
          page: 1,
          size: 5 // 헤더에서는 5개만 표시
        }
      });
      
      setSearchResults(data.content || []);
    } catch (error) {
      console.error('검색 오류:', error);
      setSearchError(error?.response?.data?.error || '검색 중 오류가 발생했습니다.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchResultClick = (post) => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchAnchorEl(null);
    navi(`/board/GoodsDetail?postId=${post.postId}`);
  };

  const handleSearchClose = () => {
    setSearchAnchorEl(null);
    setSearchResults([]);
  };

  // 검색어 초기화 함수
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchAnchorEl(null);
    setSearchError(null);
  };

  // 로고 클릭 핸들러
  const handleLogoClick = () => {
    clearSearch();
    navi('/');
  };

  // 검색 입력 필드 포커스 핸들러
  const handleSearchFocus = () => {
    clearSearch();
  };

  // ✅ 수정: useCallback을 사용하여 함수를 메모이제이션
  const handleUnreadCountChange = useCallback((count) => {
    // console.log("🔔 Header handleUnreadCountChange 호출됨 - count:", count);
    
    // 불필요한 상태 업데이트를 막기 위해 현재 값과 다른지 확인
    setUnreadMessageCount(prevCount => {
      // console.log("📊 Header 이전 값:", prevCount, "새로운 값:", count);
      
      if (prevCount !== count) {
        // console.log("✅ Header에서 새로운 읽지 않은 메시지 개수 수신:", count);
        return count;
      }
      // console.log("🔄 Header 값이 동일하여 업데이트 건너뜀");
      return prevCount; // 값이 같으면 상태를 업데이트하지 않아 재렌더링을 막음
    });
  }, []); // 💡 빈 의존성 배열을 넣어 컴포넌트가 처음 마운트될 때만 함수가 생성되도록 함

  // 읽지 않은 알림 개수를 가져오는 함수
  const fetchUnreadNotificationCount = useCallback(async () => {
    if (userInfo && userInfo.memberId) {
      try {
        const response = await axios.get(`http://localhost:4989/api/chat-declarations/unread-count/${userInfo.memberId}`);
        setUnreadNotificationCount(response.data);
      } catch (error) {
        console.error('읽지 않은 알림 개수 조회 실패:', error);
        setUnreadNotificationCount(0);
      }
    }
  }, [userInfo]);

  // 사용자 정보가 변경될 때마다 읽지 않은 알림 개수 조회
  useEffect(() => {
    fetchUnreadNotificationCount();
  }, [fetchUnreadNotificationCount]);

  // 💡 참고: 기존의 useEffect는 ChatMain으로 이동되었으므로 주석 처리하거나 제거 가능
  // useEffect(() => {
  //     ... (이 코드는 ChatMain에서 처리)
  // }, [userInfo]);
  useEffect(() => {
    // console.log("Header received userInfo:", userInfo);
  }, [userInfo]);

  // 💡 useEffect 훅을 사용하여 읽지 않은 메시지 개수를 가져옵니다.
  useEffect(() => {
    // userInfo가 존재할 때만 API를 호출합니다.
    if (userInfo) {
      const fetchUnreadCount = async () => {
        try {
          const response = await axios.get('/api/chat/unread-count', {
            params: {
              login_id: userInfo.loginId
            }
          });
          setUnreadMessageCount(response.data);
        } catch (error) {
          // console.error('읽지 않은 메시지 개수를 가져오는 데 실패했습니다.', error);
          setUnreadMessageCount(0);
        }
      };

      // 초기 로드
      fetchUnreadCount();

      // 실시간 업데이트를 위해 30초마다 API를 호출 (STOMP 실시간 업데이트와 함께 사용)
      const intervalId = setInterval(fetchUnreadCount, 3000);

      // 컴포넌트 언마운트 시 인터벌 해제
      return () => clearInterval(intervalId);
    } else {
      setUnreadMessageCount(0);
    }
  }, [userInfo]); // userInfo가 변경될 때마다 useEffect를 실행합니다.

  return (
    <AppBar position="static" elevation={0} sx={{
      background: '#FFFFFF',
      color: '#2E5BBA',
      height: '80px',
      width: '100%',
      fontFamily: 'Spoqa Han Sans Neo, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 20px rgba(74, 144, 226, 0.1)'
    }}>
      <Toolbar sx={{ height: '80px', minHeight: '80px', px: { xs: 3, sm: 6 }, width: '100%' }}>
        {/* 로고 */}


        <Box className="header-logo-container" sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '12px',
          background: 'transparent',
          border: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(74, 144, 226, 0.08)',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 15px rgba(74, 144, 226, 0.15)'
          }
        }} onClick={handleLogoClick}>
          <img src="/4989로고.png" alt="4989 로고" className="header-logo-img" style={{
            height: '48px',
            width: 'auto',
            marginRight: '16px',
            borderRadius: '8px',
            objectFit: 'contain'
          }} />
          <Typography variant="h6" sx={{
            fontWeight: 800,
            color: '#4A90E2',
            letterSpacing: '-0.8px',
            fontSize: 25,
            fontFamily: "'Gugi', sans-serif",
          }} style={{ fontFamily: "'Gugi', sans-serif" }}>
            중고거래 4989!
          </Typography>
        </Box>


        {/* 검색바 */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          maxWidth: '600px',
          margin: '0 auto',
          position: 'relative'
        }}>
          <TossSearch>
            <SearchIconWrapper><SearchRoundedIcon /></SearchIconWrapper>
            <StyledInputBase 
              placeholder="🔍 물품이나 동네를 검색하세요" 
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={handleSearchFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navi(`/board/search?keyword=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
            />
          </TossSearch>
          
          {/* 검색 결과 드롭다운 */}
          <Popper
            open={Boolean(searchAnchorEl) && (searchResults.length > 0 || searchLoading || searchError)}
            anchorEl={searchAnchorEl}
            placement="bottom-start"
            style={{ zIndex: 1300, width: searchAnchorEl ? searchAnchorEl.offsetWidth : 'auto' }}
          >
            <ClickAwayListener onClickAway={handleSearchClose}>
              <Paper 
                elevation={8}
                sx={{
                  mt: 1,
                  maxHeight: 400,
                  overflow: 'auto',
                  borderRadius: 2,
                  border: '1px solid #E0E0E0'
                }}
              >
                {searchLoading && (
                  <Box sx={{ p: 2, textAlign: 'center', color: '#666' }}>
                    검색 중...
                  </Box>
                )}
                
                {searchError && (
                  <Box sx={{ p: 2, textAlign: 'center', color: 'error.main' }}>
                    {searchError}
                  </Box>
                )}
                
                {!searchLoading && !searchError && searchResults.length > 0 && (
                  <List sx={{ p: 0 }}>
                    {searchResults.map((post) => (
                      <ListItem
                        key={post.postId}
                        button
                        onClick={() => handleSearchResultClick(post)}
                        sx={{
                          borderBottom: '1px solid #f0f0f0',
                          '&:hover': {
                            backgroundColor: '#f8f9fa'
                          },
                          '&:last-child': {
                            borderBottom: 'none'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#007bff' }}>
                                [{post.postType}] {post.title}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                                {post.price?.toLocaleString?.() ?? post.price}원
                              </Typography>
                                                             {post.content && (
                                 <Typography variant="caption" sx={{ color: '#888', display: 'block', mt: 0.5 }}>
                                   {post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content}
                                 </Typography>
                               )}
                               {/* 타입별 상세 정보 */}
                               {post.postType === "CARS" && post.car && (
                                 <Typography variant="caption" sx={{ color: '#555', display: 'block', mt: 0.5 }}>
                                   🚗 {post.car.brand} {post.car.model} / {post.car.year}년식 · {post.car.mileage?.toLocaleString()}km
                                 </Typography>
                               )}
                               {post.postType === "REAL_ESTATES" && post.estate && (
                                 <Typography variant="caption" sx={{ color: '#555', display: 'block', mt: 0.5 }}>
                                   🏠 {post.estate.propertyType === 'apt' ? '아파트' : 
                                       post.estate.propertyType === 'studio' ? '오피스텔' : 
                                       post.estate.propertyType === 'oneroom' ? '원룸' : 
                                       post.estate.propertyType === 'tworoom' ? '투룸' : post.estate.propertyType} · {post.estate.area}㎡
                                 </Typography>
                               )}
                               {post.postType === "ITEMS" && post.item && (
                                 <Typography variant="caption" sx={{ color: '#555', display: 'block', mt: 0.5 }}>
                                   📦 {post.item.categoryId === 1 ? '전자제품' : 
                                       post.item.categoryId === 2 ? '의류' : 
                                       post.item.categoryId === 3 ? '가구' : 
                                       post.item.categoryName || `카테고리 ${post.item.categoryId}`}
                                 </Typography>
                               )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                    {searchResults.length >= 5 && (
                      <ListItem
                        button
                        onClick={() => {
                          navi(`/board/search?keyword=${encodeURIComponent(searchQuery.trim())}`);
                          handleSearchClose();
                        }}
                        sx={{
                          backgroundColor: '#f8f9fa',
                          '&:hover': {
                            backgroundColor: '#e9ecef'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ textAlign: 'center', color: '#007bff', fontWeight: 600 }}>
                              더 많은 결과 보기
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                )}
                
                {!searchLoading && !searchError && searchResults.length === 0 && searchQuery.trim() && (
                  <Box sx={{ p: 2, textAlign: 'center', color: '#666' }}>
                    검색 결과가 없습니다.
                  </Box>
                )}
              </Paper>
            </ClickAwayListener>
          </Popper>
        </Box>

        {/* 우측 아이콘 및 버튼 영역 (로그인 상태에 따라 분기) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

          {userInfo ? (
            // 로그인 후 UI
            <>
                             <IconButton color="inherit" sx={{
                 // ... (기존 스타일) ...
               }} onClick={handleChatClick}>
                 {/* 💡 unreadMessageCount가 0보다 클 때만 Badge를 표시 */}
                 {unreadMessageCount > 0 ? (
                   <Badge badgeContent={unreadMessageCount} color="primary" sx={{
                     '& .MuiBadge-badge': {
                       background: '#4A90E2',
                       fontSize: '10px',
                       fontWeight: '600'
                     }
                   }}>
                     <ChatBubbleOutlineRoundedIcon />
                   </Badge>
                 ) : (
                   <ChatBubbleOutlineRoundedIcon />
                 )}

               </IconButton>
              <IconButton color="inherit" sx={{
                p: 1.5,
                color: '#5B9BD5',
                borderRadius: '12px',
                margin: '0 4px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(74, 144, 226, 0.1)',
                  color: '#4A90E2',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(74, 144, 226, 0.2)'
                }
              }} onClick={handleNotificationClick}>
                <Badge badgeContent={unreadNotificationCount} color="primary" sx={{
                  '& .MuiBadge-badge': {
                    background: '#4A90E2',
                    fontSize: '10px',
                    fontWeight: '600'
                  }
                }}>
                  <NotificationsNoneRoundedIcon fontSize="medium" />
                </Badge>
              </IconButton>
              <Box
                onClick={handleMenu}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  ml: 2,
                  p: '8px 16px',
                  borderRadius: '16px',
                  background: 'rgba(74, 144, 226, 0.08)',
                  border: '1px solid rgba(74, 144, 226, 0.15)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(74, 144, 226, 0.15)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(74, 144, 226, 0.2)'
                  },
                  fontFamily: 'Spoqa Han Sans Neo, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif'
                }}
              >
                <Avatar src={'http://localhost:4989' + userInfo.profileImageUrl || 'https://placehold.co/40x40'} sx={{
                  width: 36,
                  height: 36,
                  mr: 1.5,
                  border: '2px solid rgba(74, 144, 226, 0.25)',
                  boxShadow: '0 2px 8px rgba(74, 144, 226, 0.15)'
                }} />
                <Typography sx={{
                  fontWeight: 600,
                  color: '#2E3C2E',
                  fontSize: 14,
                  fontFamily: 'Spoqa Han Sans Neo, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif'
                }}>
                  {userInfo.nickname}님
                </Typography>
              </Box>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={() => {
                  navi('/mypage');
                  handleClose();
                }}>마이페이지</MenuItem>
                {userInfo.role === 'ROLE_ADMIN' && (
                  <MenuItem onClick={() => {
                    navi('/admin');
                    handleClose();
                  }}>관리자페이지</MenuItem>
                )}
                <MenuItem onClick={() => {
                  handleLogout();
                  handleClose();
                }}>로그아웃</MenuItem>
              </Menu>
            </>
          ) : (
            // 로그인 전 UI
            <>
              <button
                type='button'
                className='header-login-btn'
                onClick={() => navi('/login')}
                style={{
                  background: 'transparent',
                  border: '2px solid #4A90E2',
                  color: '#4A90E2',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'Spoqa Han Sans Neo, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
                  transition: 'all 0.3s ease',
                  marginRight: '12px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#4A90E2';
                  e.target.style.color = '#FFFFFF';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(74, 144, 226, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#4A90E2';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                로그인
              </button>
              <button
                type='button'
                className='header-signup-btn'
                onClick={() => navi('/signup')}
                style={{
                  background: '#4A90E2',
                  border: '2px solid #4A90E2',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'Spoqa Han Sans Neo, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(74, 144, 226, 0.2)'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#2E5BBA';
                  e.target.style.borderColor = '#2E5BBA';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(74, 144, 226, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#4A90E2';
                  e.target.style.borderColor = '#4A90E2';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(74, 144, 226, 0.2)';
                }}
              >
                회원가입
              </button>
            </>
          )}
        </Box>
      </Toolbar>

      {/* 채팅 드로어 */}
      <ChatMain
        open={chatDrawerOpen}
        onClose={handleChatClose}
        onUnreadCountChange={handleUnreadCountChange}
      />
                  <NotificationMain 
              open={notificationDrawerOpen} 
              onClose={handleNotificationClose}
              onUnreadCountChange={fetchUnreadNotificationCount}
            />
    </AppBar>
  );
};

export default Header;