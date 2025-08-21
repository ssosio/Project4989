import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Button,
  IconButton,
  Badge,
  Divider,
  Alert,
  LinearProgress,
  Avatar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Gavel as GavelIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';
import axios from 'axios';

// 탭 패널 컴포넌트
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bidding-tabpanel-${index}`}
      aria-labelledby={`bidding-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const BiddingSection = ({ userInfo }) => {
  const [tabValue, setTabValue] = useState(0);
  const [biddings, setBiddings] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 입찰 데이터 가져오기
  useEffect(() => {
    const fetchBiddings = async () => {
      try {
        setLoading(true);
        // 실제 API 호출 (추후 구현)
        // const response = await axios.get(`/api/auction/my-bids/${userInfo.memberId}`);
        // setBiddings(response.data);
        
        // 임시 가상 데이터
        const mockBiddings = [
          {
            id: 1,
            postId: 104,
            productName: '2023년식 현대 아반떼 CN7',
            currentPrice: 15500000,
            myBidAmount: 15000000,
            highestBidAmount: 15500000,
            startPrice: 12000000,
            endTime: '2024-08-20T15:00:00',
            isHighestBidder: false,
            status: 'active', // active, ended, won, lost
            image: 'https://placehold.co/300x200/007AFF/FFFFFF?text=아반떼+CN7',
            seller: '현대자동차',
            category: '중고차',
            biddersCount: 12,
            viewCount: 245,
            isFavorited: true,
            isNotificationEnabled: true
          },
          {
            id: 2,
            postId: 105,
            productName: 'Apple MacBook Pro 16인치 M3',
            currentPrice: 3200000,
            myBidAmount: 3200000,
            highestBidAmount: 3200000,
            startPrice: 2800000,
            endTime: '2024-08-19T20:30:00',
            isHighestBidder: true,
            status: 'active',
            image: 'https://placehold.co/300x200/000000/FFFFFF?text=MacBook+Pro',
            seller: '애플스토어',
            category: '전자기기',
            biddersCount: 8,
            viewCount: 156,
            isFavorited: false,
            isNotificationEnabled: true
          },
          {
            id: 3,
            postId: 106,
            productName: 'Nike Air Jordan 1 Retro High OG',
            currentPrice: 280000,
            myBidAmount: 250000,
            highestBidAmount: 280000,
            startPrice: 200000,
            endTime: '2024-08-18T18:00:00',
            isHighestBidder: false,
            status: 'ended',
            image: 'https://placehold.co/300x200/DC143C/FFFFFF?text=Air+Jordan+1',
            seller: '나이키 공식몰',
            category: '신발',
            biddersCount: 25,
            viewCount: 789,
            isFavorited: true,
            isNotificationEnabled: false
          },
          {
            id: 4,
            postId: 107,
            productName: 'Rolex Submariner 시계',
            currentPrice: 12500000,
            myBidAmount: 12500000,
            highestBidAmount: 12500000,
            startPrice: 10000000,
            endTime: '2024-08-17T14:00:00',
            isHighestBidder: true,
            status: 'won',
            image: 'https://placehold.co/300x200/FFD700/000000?text=Rolex',
            seller: '롤렉스 코리아',
            category: '시계',
            biddersCount: 18,
            viewCount: 432,
            isFavorited: true,
            isNotificationEnabled: true
          }
        ];
        setBiddings(mockBiddings);
      } catch (error) {
        console.error('입찰 목록 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userInfo?.memberId) {
      fetchBiddings();
    }
  }, [userInfo]);

  // 탭별 필터링
  const getFilteredBiddings = () => {
    switch (tabValue) {
      case 0: // 전체
        return biddings;
      case 1: // 진행중
        return biddings.filter(b => b.status === 'active');
      case 2: // 종료
        return biddings.filter(b => ['ended', 'won', 'lost'].includes(b.status));
      case 3: // 낙찰
        return biddings.filter(b => b.status === 'won');
      default:
        return biddings;
    }
  };

  const filteredBiddings = getFilteredBiddings();

  // 시간 계산 함수
  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return '종료됨';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  };

  // 가격 포맷팅
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  return (
    <Box>
      {/* 입찰중 제목 및 통계 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          입찰중인 경매
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="primary">
                {biddings.filter(b => b.status === 'active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                진행중
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="success.main">
                {biddings.filter(b => b.status === 'won').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                낙찰
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="warning.main">
                {biddings.filter(b => b.isHighestBidder && b.status === 'active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                최고가 입찰
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="info.main">
                {biddings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                전체
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* 탭 네비게이션 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="입찰 탭"
          sx={{
            '& .MuiTab-root': {
              fontSize: '1rem',
              fontWeight: 500,
              minHeight: 48,
            }
          }}
        >
          <Tab label={`전체 (${biddings.length})`} />
          <Tab label={`진행중 (${biddings.filter(b => b.status === 'active').length})`} />
          <Tab label={`종료 (${biddings.filter(b => ['ended', 'won', 'lost'].includes(b.status)).length})`} />
          <Tab label={`낙찰 (${biddings.filter(b => b.status === 'won').length})`} />
        </Tabs>
      </Box>

      {/* 탭 컨텐츠 */}
      <TabPanel value={tabValue} index={0}>
        <BiddingList biddings={filteredBiddings} loading={loading} />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <BiddingList biddings={filteredBiddings} loading={loading} />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <BiddingList biddings={filteredBiddings} loading={loading} />
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <BiddingList biddings={filteredBiddings} loading={loading} />
      </TabPanel>
    </Box>
  );
};

// 입찰 아이템 리스트 컴포넌트
const BiddingList = ({ biddings, loading }) => {
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          입찰 목록을 불러오는 중...
        </Typography>
      </Box>
    );
  }

  if (biddings.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <GavelIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          입찰한 경매가 없습니다
        </Typography>
        <Typography variant="body2" color="text.secondary">
          관심있는 경매에 참여해보세요!
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {biddings.map((bidding) => (
        <Grid item xs={12} md={6} key={bidding.id}>
          <BiddingCard bidding={bidding} />
        </Grid>
      ))}
    </Grid>
  );
};

// 개별 입찰 카드 컴포넌트
const BiddingCard = ({ bidding }) => {
  const [isFavorited, setIsFavorited] = useState(bidding.isFavorited);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(bidding.isNotificationEnabled);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return '종료됨';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  };

  const getStatusChip = (status, isHighestBidder) => {
    switch (status) {
      case 'active':
        if (isHighestBidder) {
          return <Chip label="최고가 입찰" color="warning" size="small" />;
        }
        return <Chip label="입찰중" color="primary" size="small" />;
      case 'ended':
        return <Chip label="경매 종료" color="default" size="small" />;
      case 'won':
        return <Chip label="낙찰" color="success" size="small" />;
      case 'lost':
        return <Chip label="낙찰 실패" color="error" size="small" />;
      default:
        return <Chip label="알 수 없음" color="default" size="small" />;
    }
  };

  const handleFavoriteToggle = () => {
    setIsFavorited(!isFavorited);
    // 실제 구현 시 API 호출
  };

  const handleNotificationToggle = () => {
    setIsNotificationEnabled(!isNotificationEnabled);
    // 실제 구현 시 API 호출
  };

  const handleViewAuction = () => {
    // 경매 상세 페이지로 이동
    window.location.href = `/auction/detail/${bidding.postId}`;
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 상품 이미지 */}
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={bidding.image}
          alt={bidding.productName}
          sx={{ objectFit: 'cover' }}
        />
        
        {/* 상태 배지 */}
        <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
          {getStatusChip(bidding.status, bidding.isHighestBidder)}
        </Box>
        
        {/* 액션 버튼들 */}
        <Box sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 1
        }}>
          <IconButton
            size="small"
            sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
            onClick={handleFavoriteToggle}
          >
            {isFavorited ? 
              <FavoriteIcon fontSize="small" color="error" /> : 
              <FavoriteBorderIcon fontSize="small" />
            }
          </IconButton>
          <IconButton
            size="small"
            sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
            onClick={handleNotificationToggle}
          >
            {isNotificationEnabled ? 
              <NotificationsIcon fontSize="small" color="primary" /> : 
              <NotificationsOffIcon fontSize="small" />
            }
          </IconButton>
        </Box>
        
        {/* 남은 시간 (진행중인 경우만) */}
        {bidding.status === 'active' && (
          <Box sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}>
            <AccessTimeIcon fontSize="small" />
            <Typography variant="caption" fontWeight="bold">
              {getTimeRemaining(bidding.endTime)}
            </Typography>
          </Box>
        )}
      </Box>

      {/* 상품 정보 */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" component="h3" gutterBottom sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {bidding.productName}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          판매자: {bidding.seller} | 카테고리: {bidding.category}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonIcon fontSize="small" color="action" />
            <Typography variant="caption">{bidding.biddersCount}명</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <VisibilityIcon fontSize="small" color="action" />
            <Typography variant="caption">{bidding.viewCount}회</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* 가격 정보 */}
        <Box sx={{ mt: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              시작가
            </Typography>
            <Typography variant="body2">
              {formatPrice(bidding.startPrice)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              내 입찰가
            </Typography>
            <Typography variant="body2" color="primary" fontWeight="bold">
              {formatPrice(bidding.myBidAmount)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              현재 최고가
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {bidding.isHighestBidder && (
                <TrendingUpIcon fontSize="small" color="warning" />
              )}
              <Typography 
                variant="h6" 
                color={bidding.isHighestBidder ? "warning.main" : "text.primary"}
                fontWeight="bold"
              >
                {formatPrice(bidding.highestBidAmount)}
              </Typography>
            </Box>
          </Box>

          {/* 액션 버튼 */}
          <Button
            variant="contained"
            fullWidth
            startIcon={<VisibilityIcon />}
            onClick={handleViewAuction}
          >
            경매 보기
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BiddingSection;
