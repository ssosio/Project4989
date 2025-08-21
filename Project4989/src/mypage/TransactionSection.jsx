import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Badge,
  Divider
} from '@mui/material';
import {
  Store as StoreIcon,
  Gavel as AuctionIcon,
  CardGiftcard as GiftIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Chat as ChatIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  MonetizationOn as MoneyIcon
} from '@mui/icons-material';
import axios from 'axios';

const TransactionSection = ({ userInfo }) => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [myPosts, setMyPosts] = useState([]);
  const [allPostsForStatusCounts, setAllPostsForStatusCounts] = useState([]); // 상태별 필터 개수 계산용 (항상 전체 게시글)

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState({
    total: 0,
    auction: 0,
    general: 0,
    giveaway: 0,
    cancelled: 0
  });

  // 로컬스토리지에서 토큰 가져오기
  const getAuthToken = () => {
    return localStorage.getItem('jwtToken');
  };

  // 내 게시글 타입별 개수 조회 (위쪽 필터용 - 고정)
  const fetchMyPostsCounts = async () => {
    try {
      const token = getAuthToken();
      if (!token || !userInfo?.memberId) {
        return;
      }

      const response = await axios.get(
        `http://192.168.10.138:4989/auction/my-posts-counts/${userInfo.memberId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('내 게시글 개수 조회 성공:', response.data);
      setCounts(response.data);
    } catch (error) {
      console.error('내 게시글 개수 조회 실패:', error);
    }
  };



  // 내 게시글 데이터 가져오기 (3개 API를 따로 호출)
  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userInfo?.memberId) {
        setError('인증 정보가 없습니다.');
        return;
      }

      const token = getAuthToken();
      if (!token) {
        setError('인증 토큰이 없습니다.');
        return;
      }

      let allPosts = [];
      let allPostsForCounts = []; // 상태별 필터 개수 계산용 (항상 전체 게시글)

      // 경매 게시글은 항상 가져오기 (유찰 개수 계산용)
      try {
        const allAuctionResponse = await axios.get(
          `http://192.168.10.138:4989/auction/my-auction-posts/${userInfo.memberId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        

        
        // 타입 필터에 따라 해당하는 게시글만 가져오기
        if (typeFilter === 'all' || typeFilter === 'auction') {
          // 유찰 상태일 때는 경매에서만 유찰 게시글 가져오기
          if (statusFilter === 'cancelled') {
            const cancelledResponse = await axios.get(
              `http://192.168.10.138:4989/auction/my-cancelled-auction-posts/${userInfo.memberId}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            allPosts = [...allPosts, ...cancelledResponse.data];
          } else {
            const auctionResponse = await axios.get(
              `http://192.168.10.138:4989/auction/my-auction-posts/${userInfo.memberId}`,
              {
                params: {
                  status: statusFilter === 'all' ? null : statusFilter
                },
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            allPosts = [...allPosts, ...auctionResponse.data];
          }
          
          allPostsForCounts = [...allPostsForCounts, ...allAuctionResponse.data];
        }
      } catch (error) {
        console.error('경매 게시글 조회 실패:', error);
      }
      
      // 일반거래 게시글 가져오기 (타입 필터가 'all' 또는 'general'일 때만, 유찰이 아닐 때만)
      if ((typeFilter === 'all' || typeFilter === 'general') && statusFilter !== 'cancelled') {
        try {
          const generalResponse = await axios.get(
            `http://192.168.10.138:4989/auction/my-general-posts/${userInfo.memberId}`,
            {
              params: {
                status: statusFilter === 'all' ? null : statusFilter
              },
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          allPosts = [...allPosts, ...generalResponse.data];
          
          // 전체 일반거래 게시글도 가져오기 (개수 계산용)
          const allGeneralResponse = await axios.get(
            `http://192.168.10.138:4989/auction/my-general-posts/${userInfo.memberId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          allPostsForCounts = [...allPostsForCounts, ...allGeneralResponse.data];
        } catch (error) {
          console.error('일반거래 게시글 조회 실패:', error);
        }
      }
      
      // 나눔 게시글 가져오기 (타입 필터가 'all' 또는 'giveaway'일 때만, 유찰이 아닐 때만)
      if ((typeFilter === 'all' || typeFilter === 'giveaway') && statusFilter !== 'cancelled') {
        try {
          const giveawayResponse = await axios.get(
            `http://192.168.10.138:4989/auction/my-giveaway-posts/${userInfo.memberId}`,
            {
              params: {
                status: statusFilter === 'all' ? null : statusFilter
              },
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          allPosts = [...allPosts, ...giveawayResponse.data];
          
          // 전체 나눔 게시글도 가져오기 (개수 계산용)
          const allGiveawayResponse = await axios.get(
            `http://192.168.10.138:4989/auction/my-giveaway-posts/${userInfo.memberId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          allPostsForCounts = [...allPostsForCounts, ...allGiveawayResponse.data];
        } catch (error) {
          console.error('나눔 게시글 조회 실패:', error);
        }
      }
      


      // 작성일 순으로 정렬 (최신순)
      allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      allPostsForCounts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      console.log('내 게시글 조회 성공:', allPosts);
      setMyPosts(allPosts);
      
             // 상태별 필터 개수 계산용으로 항상 전체 게시글 저장 (타입 필터와 관계없이 고정)
       setAllPostsForStatusCounts(allPostsForCounts);      

    } catch (error) {
      console.error('내 게시글 조회 실패:', error);
      setError('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo?.memberId) {
      fetchMyPostsCounts(); // 위쪽 필터 숫자 고정
      fetchMyPosts(); // 실제 게시글 목록
    }
  }, [userInfo]);

  useEffect(() => {
    if (userInfo?.memberId) {
      // 타입 필터가 변경되면 상태 필터를 'all'로 리셋하고 해당 타입의 전체 게시글 조회
      if (statusFilter !== 'all') {
        setStatusFilter('all');
      } else {
        fetchMyPosts(); // 실제 게시글 목록 갱신
      }
    }
  }, [typeFilter]);

  useEffect(() => {
    if (userInfo?.memberId) {
      fetchMyPosts(); // 상태 필터 변경 시에만 게시글 목록 갱신
    }
  }, [statusFilter]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
             {/* 헤더 */}
       <Typography variant="h4" gutterBottom fontWeight="bold">
         판매 내역
       </Typography>
      
             {/* 타입별 버튼 (대형 버튼) */}
       <Box sx={{ mb: 4 }}>
         <Grid container spacing={2}>
           <Grid item xs={12} sm={3}>
             <Button
               variant={typeFilter === 'all' ? 'contained' : 'outlined'}
               fullWidth
               size="large"
               sx={{ 
                 py: 3, 
                 fontSize: '1.1rem', 
                 fontWeight: 'bold',
                 minHeight: '80px',
                 flexDirection: 'column',
                 gap: 0.5
               }}
               onClick={() => setTypeFilter('all')}
             >
                              <Box sx={{ fontSize: '1.3rem', fontWeight: 'bold' }}>전체</Box>
               <Box sx={{ 
                 fontSize: '1.5rem', 
                 fontWeight: 'bold', 
                 color: typeFilter === 'all' ? 'white' : 'text.primary' 
               }}>{counts.total}개</Box>
             </Button>
           </Grid>
           <Grid item xs={12} sm={3}>
             <Button
               variant={typeFilter === 'auction' ? 'contained' : 'outlined'}
               color="error"
               fullWidth
               size="large"
               sx={{ 
                 py: 3, 
                 fontSize: '1.1rem',
                 fontWeight: 'bold',
                 minHeight: '80px',
                 flexDirection: 'column',
                 gap: 0.5
               }}
               onClick={() => setTypeFilter('auction')}
             >
               <Box sx={{ fontSize: '1.3rem', fontWeight: 'bold' }}>경매</Box>
               <Box sx={{ 
                 fontSize: '1.5rem', 
                 fontWeight: 'bold', 
                 color: typeFilter === 'auction' ? 'white' : 'error.main' 
               }}>{counts.auction}개</Box>
             </Button>
           </Grid>
           <Grid item xs={12} sm={3}>
             <Button
               variant={typeFilter === 'general' ? 'contained' : 'outlined'}
               color="primary"
               fullWidth
               size="large"
               sx={{ 
                 py: 3, 
                 fontSize: '1.1rem', 
                 fontWeight: 'bold',
                 minHeight: '80px',
                 flexDirection: 'column',
                 gap: 0.5
               }}
               onClick={() => setTypeFilter('general')}
             >
               <Box sx={{ fontSize: '1.3rem', fontWeight: 'bold' }}>일반거래</Box>
               <Box sx={{ 
                 fontSize: '1.5rem', 
                 fontWeight: 'bold', 
                 color: typeFilter === 'general' ? 'white' : 'primary.main' 
               }}>{counts.general}개</Box>
             </Button>
           </Grid>
           <Grid item xs={12} sm={3}>
             <Button
               variant={typeFilter === 'giveaway' ? 'contained' : 'outlined'}
               color="success"
               fullWidth
               size="large"
               sx={{ 
                 py: 3, 
                 fontSize: '1.1rem', 
                 fontWeight: 'bold',
                 minHeight: '80px',
                 flexDirection: 'column',
                 gap: 0.5
               }}
               onClick={() => setTypeFilter('giveaway')}
             >
               <Box sx={{ fontSize: '1.3rem', fontWeight: 'bold' }}>나눔</Box>
               <Box sx={{ 
                 fontSize: '1.5rem', 
                 fontWeight: 'bold', 
                 color: typeFilter === 'giveaway' ? 'white' : 'success.main' 
               }}>{counts.giveaway}개</Box>
             </Button>
           </Grid>
         </Grid>
       </Box>

             {/* 상태별 필터 (Chip) */}
       <Box sx={{ mb: 3 }}>
         <Typography variant="h6" gutterBottom>
           상태별 필터
         </Typography>
         <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                       <Button
              variant={statusFilter === 'all' ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => setStatusFilter('all')}
              sx={{ 
                minWidth: '100px',
                minHeight: '70px',
                flexDirection: 'column',
                gap: 0.5,
                py: 1.5
              }}
            >
              <Box sx={{ 
                fontSize: '1rem', 
                fontWeight: 'bold',
                color: statusFilter === 'all' ? 'white' : 'text.primary'
              }}>전체</Box>
                             <Box sx={{ 
                 fontSize: '1.2rem', 
                 fontWeight: 'bold', 
                 color: statusFilter === 'all' ? 'white' : 'text.primary' 
                               }}>{allPostsForStatusCounts.length}개</Box>
            </Button>
           
                       <Button
              variant={statusFilter === 'active' ? 'contained' : 'outlined'}
              color="info"
              onClick={() => setStatusFilter('active')}
              sx={{ 
                minWidth: '100px',
                minHeight: '70px',
                flexDirection: 'column',
                gap: 0.5,
                py: 1.5
              }}
            >
              <Box sx={{ fontSize: '1rem', fontWeight: 'bold' }}>판매중</Box>
                             <Box sx={{ 
                 fontSize: '1.2rem', 
                 fontWeight: 'bold', 
                 color: statusFilter === 'active' ? 'white' : 'info.main' 
                               }}>{allPostsForStatusCounts.filter(post => post.postStatus === 'active').length}개</Box>
            </Button>
           
                       <Button
              variant={statusFilter === 'reserved' ? 'contained' : 'outlined'}
              color="warning"
              onClick={() => setStatusFilter('reserved')}
              sx={{ 
                minWidth: '100px',
                minHeight: '70px',
                flexDirection: 'column',
                gap: 0.5,
                py: 1.5
              }}
            >
              <Box sx={{ fontSize: '1rem', fontWeight: 'bold' }}>예약중</Box>
                                                           <Box sx={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold', 
                  color: statusFilter === 'reserved' ? 'white' : 'warning.main' 
                                 }}>{allPostsForStatusCounts.filter(post => post.postStatus === 'reserved').length}개</Box>
            </Button>
            
            <Button
              variant={statusFilter === 'completed' ? 'contained' : 'outlined'}
              color="success"
              onClick={() => setStatusFilter('completed')}
              sx={{ 
                minWidth: '100px',
                minHeight: '70px',
                flexDirection: 'column',
                gap: 0.5,
                py: 1.5
              }}
            >
              <Box sx={{ fontSize: '1rem', fontWeight: 'bold' }}>거래완료</Box>
                             <Box sx={{ 
                 fontSize: '1rem', 
                 fontWeight: 'bold', 
                 color: statusFilter === 'completed' ? 'white' : 'success.main' 
                               }}>{allPostsForStatusCounts.filter(post => post.postStatus === 'completed').length}개</Box>
            </Button>
            
                         <Button
               variant={statusFilter === 'cancelled' ? 'contained' : 'outlined'}
               color="error"
               onClick={() => setStatusFilter('cancelled')}
               sx={{ 
                 minWidth: '100px',
                 minHeight: '70px',
                 flexDirection: 'column',
                 gap: 0.5,
                 py: 1.5
               }}
             >
               <Box sx={{ fontSize: '1rem', fontWeight: 'bold' }}>유찰</Box>
                                               <Box sx={{ 
                   fontSize: '1.2rem', 
                   fontWeight: 'bold', 
                   color: statusFilter === 'cancelled' ? 'white' : 'error.main' 
                                   }}>{allPostsForStatusCounts.filter(post => post.postStatus === 'cancelled').length}개</Box>
             </Button>
         </Box>
       </Box>

      <Divider sx={{ mb: 3 }} />

      {/* 게시글 목록 */}
      <MyPostsList posts={myPosts} />
    </Box>
  );
};

// 게시글 목록 컴포넌트
const MyPostsList = ({ posts }) => {
  if (posts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography variant="h6" color="text.secondary">
          게시글이 없습니다.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid 
      container 
      spacing={2}
      sx={{ 
        justifyContent: 'center',
        alignItems: 'stretch'
      }}
    >
      {posts.map((post) => (
        <Grid 
          item 
          xs={12} 
          sm={6} 
          lg={4} 
          key={post.postId}
          sx={{
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          {post.type === 'auction' && <AuctionCard post={post} />}
          {post.type === 'general' && <GeneralCard post={post} />}
          {post.type === 'giveaway' && <GiveawayCard post={post} />}
        </Grid>
      ))}
    </Grid>
  );
};

// 경매 카드 컴포넌트
const AuctionCard = ({ post }) => {
  const typeInfo = getTypeInfo(post.type);
  const statusInfo = getStatusInfo(post.postStatus, post.type);

  const handleView = () => {
    window.location.href = `/auction/detail/${post.postId}`;
  };

  const handleEdit = () => {
    console.log('수정:', post.postId);
  };

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      console.log('삭제:', post.postId);
    }
  };

  const handleChat = () => {
    console.log('채팅:', post.postId);
  };

  return (
    <Card 
      sx={{ 
        height: '480px',
        width: '100%',
        maxWidth: '380px',
        minWidth: '300px',
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: 2,
        '&:hover': { 
          boxShadow: 8,
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease'
        },
        borderRadius: 3,
        overflow: 'hidden'
      }}
    >
      {/* 이미지 */}
      <Box sx={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={post.image ? `http://192.168.10.138:4989${post.image}` : '/default-image.png'}
          alt={post.title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        {/* 타입 배지 */}
        <Chip
          label={typeInfo.label}
          color={typeInfo.color}
          size="small"
          sx={{ 
            position: 'absolute', 
            top: 12, 
            left: 12,
            fontWeight: 'bold',
            fontSize: '0.75rem',
            height: '24px'
          }}
        />
        {/* 상태 배지 */}
        <Chip
          label={statusInfo.label}
          color={statusInfo.color}
          size="small"
          sx={{ 
            position: 'absolute', 
            top: 12, 
            right: 12,
            fontWeight: 'bold',
            fontSize: '0.75rem',
            height: '24px'
          }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 제목 */}
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            fontSize: '1rem',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            height: '2.6rem',
            mb: 1,
            flexShrink: 0
          }}
        >
          {post.title}
        </Typography>

        {/* 카테고리 */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            fontSize: '0.8rem',
            mb: 1,
            fontWeight: 500,
            height: '1.2rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          {post.category}
        </Typography>

        {/* 가격 정보 - 스크롤 가능한 영역 */}
        <Box sx={{ 
          mb: 2, 
          flex: 1, 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '4px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '2px'
          }
        }}>
          {/* 시작가 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '0.75rem', fontWeight: 500, minWidth: '50px' }}
            >
              시작가:
            </Typography>
            <Typography 
              variant="body2" 
              color="primary" 
              fontWeight="bold"
              sx={{ 
                fontSize: '0.9rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100px'
              }}
            >
              {formatPrice(post.price)}
            </Typography>
          </Box>

          {/* 현재가/낙찰가 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '0.75rem', fontWeight: 500, minWidth: '50px' }}
            >
              {post.postStatus === 'completed' ? '낙찰가:' : '현재가:'}
            </Typography>
            <Typography 
              variant="body2" 
              color="primary" 
              fontWeight="bold"
              sx={{ 
                fontSize: '0.9rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100px'
              }}
            >
              {formatPrice(post.currentPrice)}
            </Typography>
          </Box>

          {/* 입찰자 */}
          {post.biddersCount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: '0.75rem', fontWeight: 500, minWidth: '50px' }}
              >
                입찰자:
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.75rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100px'
                }}
              >
                {post.biddersCount}명
              </Typography>
            </Box>
          )}

          {/* 종료시간 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '0.7rem', fontWeight: 500, minWidth: '35px' }}
            >
              종료:
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.7rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '120px'
              }}
            >
              {post.endTime ? formatDate(post.endTime) : '-'}
            </Typography>
          </Box>
        </Box>

        {/* 추가 정보 */}
        <Box sx={{ mt: 'auto', flexShrink: 0 }}>
          {/* 조회수 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '0.7rem', fontWeight: 500, minWidth: '35px' }}
            >
              조회:
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.7rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '60px'
              }}
            >
              {post.viewCount}
            </Typography>
          </Box>

          {/* 작성일 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '0.7rem', fontWeight: 500, minWidth: '35px' }}
            >
              작성일:
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.7rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '120px'
              }}
            >
              {formatDate(post.createdAt)}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <Divider />

      <CardActions sx={{ p: 1.5, justifyContent: 'space-between', bgcolor: 'grey.50' }}>
        <Button 
          startIcon={<ViewIcon />} 
          size="small" 
          onClick={handleView}
          sx={{ 
            fontSize: '0.75rem',
            fontWeight: 500,
            px: 1.5,
            py: 0.5,
            minWidth: '60px'
          }}
        >
          보기
        </Button>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {post.postStatus === 'active' && (
            <Button 
              startIcon={<EditIcon />} 
              size="small" 
              onClick={handleEdit}
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 500,
                px: 1.5,
                py: 0.5,
                minWidth: '60px'
              }}
            >
              수정
            </Button>
          )}
          <Button 
            startIcon={<DeleteIcon />} 
            size="small" 
            color="error"
            onClick={handleDelete}
            sx={{ 
              fontSize: '0.75rem',
              fontWeight: 500,
              px: 1.5,
              py: 0.5,
              minWidth: '60px'
            }}
          >
            삭제
          </Button>
          <Button 
            startIcon={<ChatIcon />} 
            size="small" 
            color="info"
            onClick={handleChat}
            sx={{ 
              fontSize: '0.75rem',
              fontWeight: 500,
              px: 1.5,
              py: 0.5,
              minWidth: '60px'
            }}
          >
            채팅
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
};

// 일반거래 카드 컴포넌트
const GeneralCard = ({ post }) => {
  const typeInfo = getTypeInfo(post.type);
  const statusInfo = getStatusInfo(post.postStatus, post.type);

  const handleView = () => {
    window.location.href = `/board/detail/${post.postId}`;
  };

  const handleEdit = () => {
    console.log('수정:', post.postId);
  };

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      console.log('삭제:', post.postId);
    }
  };

  const handleChat = () => {
    console.log('채팅:', post.postId);
  };

  return (
    <Card 
      sx={{ 
        height: '480px',
        width: '100%',
        maxWidth: '380px',
        minWidth: '300px',
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: 2,
        '&:hover': { 
          boxShadow: 8,
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease'
        },
        borderRadius: 3,
        overflow: 'hidden'
      }}
    >
      {/* 이미지 */}
      <Box sx={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={post.image ? `http://192.168.10.138:4989${post.image}` : '/default-image.png'}
          alt={post.title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        {/* 타입 배지 */}
        <Chip
          label={typeInfo.label}
          color={typeInfo.color}
          size="small"
          sx={{ 
            position: 'absolute', 
            top: 12, 
            left: 12,
            fontWeight: 'bold',
            fontSize: '0.75rem',
            height: '24px'
          }}
        />
        {/* 상태 배지 */}
        <Chip
          label={statusInfo.label}
          color={statusInfo.color}
          size="small"
          sx={{ 
            position: 'absolute', 
            top: 12, 
            right: 12,
            fontWeight: 'bold',
            fontSize: '0.75rem',
            height: '24px'
          }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 제목 */}
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            fontSize: '1rem',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            height: '2.6rem',
            mb: 1,
            flexShrink: 0
          }}
        >
          {post.title}
        </Typography>

        {/* 카테고리 */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            fontSize: '0.8rem',
            mb: 1,
            fontWeight: 500,
            height: '1.2rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          {post.category}
        </Typography>

        {/* 가격 정보 - 스크롤 가능한 영역 */}
        <Box sx={{ 
          mb: 2, 
          flex: 1, 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '4px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '2px'
          }
        }}>
          {/* 가격 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '0.75rem', fontWeight: 500, minWidth: '50px' }}
            >
              가격:
            </Typography>
            <Typography 
              variant="body2" 
              color="primary" 
              fontWeight="bold"
              sx={{ 
                fontSize: '0.9rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100px'
              }}
            >
              {formatPrice(post.price)}
            </Typography>
          </Box>

          {/* 빈 공간 채우기 */}
          <Box sx={{ height: '5rem' }} />
        </Box>

        {/* 추가 정보 */}
        <Box sx={{ mt: 'auto', flexShrink: 0 }}>
          {/* 조회수 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '0.7rem', fontWeight: 500, minWidth: '35px' }}
            >
              조회:
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.7rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '60px'
              }}
            >
              {post.viewCount}
            </Typography>
          </Box>

          {/* 작성일 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '0.7rem', fontWeight: 500, minWidth: '35px' }}
            >
              작성일:
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.7rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '120px'
              }}
            >
              {formatDate(post.createdAt || post.postDate)}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <Divider />

      <CardActions sx={{ p: 1.5, justifyContent: 'space-between', bgcolor: 'grey.50' }}>
        <Button 
          startIcon={<ViewIcon />} 
          size="small" 
          onClick={handleView}
          sx={{ 
            fontSize: '0.75rem',
            fontWeight: 500,
            px: 1.5,
            py: 0.5,
            minWidth: '60px'
          }}
        >
          보기
        </Button>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {post.postStatus === 'active' && (
            <Button 
              startIcon={<EditIcon />} 
              size="small" 
              onClick={handleEdit}
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 500,
                px: 1.5,
                py: 0.5,
                minWidth: '60px'
              }}
            >
              수정
            </Button>
          )}
          <Button 
            startIcon={<DeleteIcon />} 
            size="small" 
            color="error"
            onClick={handleDelete}
            sx={{ 
              fontSize: '0.75rem',
              fontWeight: 500,
              px: 1.5,
              py: 0.5,
              minWidth: '60px'
            }}
          >
            삭제
          </Button>
          <Button 
            startIcon={<ChatIcon />} 
            size="small" 
            color="info"
            onClick={handleChat}
            sx={{ 
              fontSize: '0.75rem',
              fontWeight: 500,
              px: 1.5,
              py: 0.5,
              minWidth: '60px'
            }}
          >
            채팅
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
};

// 나눔 카드 컴포넌트
const GiveawayCard = ({ post }) => {
  const typeInfo = getTypeInfo(post.type);
  const statusInfo = getStatusInfo(post.postStatus, post.type);

  const handleView = () => {
    window.location.href = `/board/detail/${post.postId}`;
  };

  const handleEdit = () => {
    console.log('수정:', post.postId);
  };

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      console.log('삭제:', post.postId);
    }
  };

  const handleChat = () => {
    console.log('채팅:', post.postId);
  };

  return (
    <Card 
      sx={{ 
        height: '480px',
        width: '100%',
        maxWidth: '380px',
        minWidth: '300px',
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: 2,
        '&:hover': { 
          boxShadow: 8,
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease'
        },
        borderRadius: 3,
        overflow: 'hidden'
      }}
    >
      {/* 이미지 */}
      <Box sx={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={post.image ? `http://192.168.10.138:4989${post.image}` : '/default-image.png'}
          alt={post.title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        {/* 타입 배지 */}
        <Chip
          label={typeInfo.label}
          color={typeInfo.color}
          size="small"
          sx={{ 
            position: 'absolute', 
            top: 12, 
            left: 12,
            fontWeight: 'bold',
            fontSize: '0.75rem',
            height: '24px'
          }}
        />
        {/* 상태 배지 */}
        <Chip
          label={statusInfo.label}
          color={statusInfo.color}
          size="small"
          sx={{ 
            position: 'absolute', 
            top: 12, 
            right: 12,
            fontWeight: 'bold',
            fontSize: '0.75rem',
            height: '24px'
          }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 제목 */}
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            fontSize: '1rem',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            height: '2.6rem',
            mb: 1,
            flexShrink: 0
          }}
        >
          {post.title}
        </Typography>

        {/* 카테고리 */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            fontSize: '0.8rem',
            mb: 1,
            fontWeight: 500,
            height: '1.2rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          {post.category}
        </Typography>

        {/* 가격 정보 - 스크롤 가능한 영역 */}
        <Box sx={{ 
          mb: 2, 
          flex: 1, 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '4px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '2px'
          }
        }}>
          {/* 가격 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '0.75rem', fontWeight: 500, minWidth: '50px' }}
            >
              가격:
            </Typography>
            <Typography 
              variant="body2" 
              color="primary" 
              fontWeight="bold"
              sx={{ 
                fontSize: '0.9rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100px'
              }}
            >
              무료
            </Typography>
          </Box>

          {/* 빈 공간 채우기 */}
          <Box sx={{ height: '5rem' }} />
        </Box>

        {/* 추가 정보 */}
        <Box sx={{ mt: 'auto', flexShrink: 0 }}>
          {/* 조회수 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '0.7rem', fontWeight: 500, minWidth: '35px' }}
            >
              조회:
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.7rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '60px'
              }}
            >
              {post.viewCount}
            </Typography>
          </Box>

          {/* 작성일 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '0.7rem', fontWeight: 500, minWidth: '35px' }}
            >
              작성일:
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.7rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '120px'
              }}
            >
              {formatDate(post.createdAt || post.postDate)}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <Divider />

      <CardActions sx={{ p: 1.5, justifyContent: 'space-between', bgcolor: 'grey.50' }}>
        <Button 
          startIcon={<ViewIcon />} 
          size="small" 
          onClick={handleView}
          sx={{ 
            fontSize: '0.75rem',
            fontWeight: 500,
            px: 1.5,
            py: 0.5,
            minWidth: '60px'
          }}
        >
          보기
        </Button>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {post.postStatus === 'active' && (
            <Button 
              startIcon={<EditIcon />} 
              size="small" 
              onClick={handleEdit}
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 500,
                px: 1.5,
                py: 0.5,
                minWidth: '60px'
              }}
            >
              수정
            </Button>
          )}
          <Button 
            startIcon={<DeleteIcon />} 
            size="small" 
            color="error"
            onClick={handleDelete}
            sx={{ 
              fontSize: '0.75rem',
              fontWeight: 500,
              px: 1.5,
              py: 0.5,
              minWidth: '60px'
            }}
          >
            삭제
          </Button>
          <Button 
            startIcon={<ChatIcon />} 
            size="small" 
            color="info"
            onClick={handleChat}
            sx={{ 
              fontSize: '0.75rem',
              fontWeight: 500,
              px: 1.5,
              py: 0.5,
              minWidth: '60px'
            }}
          >
            채팅
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
};

// 유틸리티 함수들을 컴포넌트 외부로 이동
const getTypeInfo = (type) => {
  switch (type) {
    case 'auction':
      return { label: '경매', icon: <AuctionIcon />, color: 'error' };
    case 'general':
      return { label: '일반거래', icon: <StoreIcon />, color: 'primary' };
    case 'giveaway':
      return { label: '나눔', icon: <GiftIcon />, color: 'success' };
    default:
      return { label: '기타', icon: <StoreIcon />, color: 'default' };
  }
};

const getStatusInfo = (status, type) => {
  switch (status) {
    case 'active':
      return type === 'auction' 
        ? { label: '입찰중', icon: <ScheduleIcon />, color: 'warning' }
        : { label: '판매중', icon: <StoreIcon />, color: 'info' };
    case 'reserved':
      return { label: '예약중', icon: <ScheduleIcon />, color: 'warning' };
    case 'completed':
      return { label: '거래완료', icon: <CheckIcon />, color: 'success' };
    case 'cancelled':
      return { label: '유찰', icon: <CancelIcon />, color: 'error' };
    default:
      return { label: '알 수 없음', icon: <StoreIcon />, color: 'default' };
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default TransactionSection;