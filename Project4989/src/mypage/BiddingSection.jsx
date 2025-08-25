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
  Tab,
  Pagination,
  CircularProgress
} from '@mui/material';
import './BiddingSection.css';
import {
  Gavel as GavelIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  CheckCircle,
  Cancel,
  Schedule
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const BiddingSection = ({ userInfo }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [biddings, setBiddings] = useState([]);
  const [totalCounts, setTotalCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [postImages, setPostImages] = useState({});


  const itemsPerPage = 9; // 한 페이지당 9개 (3x3)

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setCurrentPage(1);
  };

  // 입찰 기록 개수 조회
  const fetchBiddingCounts = async () => {
    try {
      const response = await api.get(`/auction/my-bids-counts/${userInfo.memberId}`);
      setTotalCounts(response.data);
    } catch (error) {
      console.error('입찰 기록 개수 조회 실패:', error);
    }
  };

  // 게시글의 이미지 가져오기
  const fetchPostImages = async (biddings) => {
    const images = {};
    for (const bidding of biddings) {
      try {
        const photoResponse = await api.get(`/auction/photos/${bidding.post_id}`);
        if (photoResponse.data && photoResponse.data.length > 0) {
          // 첫 번째 이미지를 메인 이미지로 사용
          const imageUrl = photoResponse.data[0].photo_url;
          // 이미지 URL 생성
          const encodedUrl = encodeURIComponent(imageUrl);
          const imageWithToken = `http://localhost:4989/auction/image/${encodedUrl}`;
          images[bidding.post_id] = { url: imageWithToken, originalUrl: imageUrl };
        }
      } catch (error) {
        console.error(`게시글 ${bidding.post_id} 이미지 조회 실패:`, error);
      }
    }
    setPostImages(images);
  };

  // 입찰 기록 목록 조회
  const fetchBiddings = async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      
      // 탭에 따른 상태 필터
      let status = 'all';
      switch (activeTab) {
        case 1: // 진행중
          status = 'active';
          break;
        case 2: // 낙찰완료
          status = 'completed';
          break;
        case 3: // 낙찰실패
          status = 'failed';
          break;
        default:
          status = 'all';
      }
      
      const response = await api.get(`/auction/my-bids/${userInfo.memberId}`, {
        params: { status, offset, limit: itemsPerPage }
      });
      setBiddings(response.data.bids);
      setTotalPages(response.data.totalPages);
      
      // 게시글 이미지 가져오기
      await fetchPostImages(response.data.bids);
    } catch (error) {
      console.error('입찰 기록 조회 실패:', error);
      setError('입찰 기록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (userInfo?.memberId) {
      fetchBiddingCounts();
    }
  }, [userInfo?.memberId]);

  useEffect(() => {
    if (userInfo?.memberId) {
      fetchBiddings();
    }
  }, [userInfo?.memberId, currentPage, activeTab]);



  // 상태별 아이콘과 색상
  const getStatusInfo = (status) => {
    switch (status) {
      case '진행중':
        return { icon: <Schedule />, color: 'primary', label: '진행중' };
      case '낙찰완료':
        return { icon: <CheckCircle />, color: 'success', label: '낙찰완료' };
      case '낙찰실패':
        return { icon: <Cancel />, color: 'error', label: '낙찰실패' };
      default:
        return { icon: <Schedule />, color: 'default', label: status };
    }
  };

  // 입찰자 순위별 색상
  const getBidderRankColor = (rank) => {
    switch (rank) {
      case '최고 입찰자':
        return 'warning';
      case '차순위 입찰자':
        return 'info';
      default:
        return 'default';
    }
  };

  // 카드 클릭 핸들러
  const handleCardClick = (postId) => {
    navigate(`/auction/detail/${postId}`);
  };

  // 금액 포맷팅
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };



  return (
    <Box className="bidding-section-container">
      {/* 통계 카드 */}
      <Grid container spacing={2} className="bidding-tabs-container">
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, borderRadius: 2 }}>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
              {totalCounts.total || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              전체
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, borderRadius: 2 }}>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
              {totalCounts.active || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              진행중
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, borderRadius: 2 }}>
            <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
              {totalCounts.completed || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              낙찰완료
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, borderRadius: 2 }}>
            <Typography variant="h6" color="error.main" sx={{ fontWeight: 700 }}>
              {totalCounts.failed || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              낙찰실패
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 탭 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="입찰 상태 탭">
          <Tab label={`전체 (${totalCounts.total || 0})`} />
          <Tab label={`진행중 (${totalCounts.active || 0})`} />
          <Tab label={`낙찰완료 (${totalCounts.completed || 0})`} />
          <Tab label={`낙찰실패 (${totalCounts.failed || 0})`} />
        </Tabs>
      </Box>

      {/* 로딩 상태 */}
      {loading && (
        <Box className="bidding-loading-container">
          <CircularProgress className="bidding-loading-spinner" />
        </Box>
      )}

      {/* 에러 상태 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 입찰 기록 목록 */}
      <TabPanel value={activeTab} index={activeTab} className="bidding-tab-panel">
        {biddings.length === 0 ? (
          <Box className="bidding-empty-container">
            <Typography variant="h6" color="text.secondary" className="bidding-empty-title">
              {activeTab === 0 ? '입찰한 경매가 없습니다.' : 
               activeTab === 1 ? '진행중인 입찰이 없습니다.' :
               activeTab === 2 ? '낙찰완료된 경매가 없습니다.' : '낙찰실패한 경매가 없습니다.'}
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={3} className="bidding-posts-grid">
               {biddings.map((bidding) => {
                 const statusInfo = getStatusInfo(bidding.auction_status);
                 return (
                   <Grid item key={bidding.bid_id}>
                     <Card 
                       className="bidding-post-card"
                       onClick={() => handleCardClick(bidding.post_id)}
                     >
                        {/* 이미지 영역 */}
                        <Box className="bidding-post-image-container">
                          {postImages[bidding.post_id] ? (
                            <CardMedia
                              component="img"
                              image={postImages[bidding.post_id].url}
                              alt={bidding.title}
                              className="bidding-post-image"
                            />
                          ) : (
                            <Box className="bidding-post-no-image">
                              <GavelIcon sx={{ fontSize: 48, mb: 1, color: '#ccc' }} />
                              <Typography variant="body2" color="text.secondary">
                                사진 없음
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        <CardContent className="bidding-post-content">
                          {/* 제목 */}
                          <Typography
                            variant="h6"
                            className="bidding-post-title"
                          >
                            {bidding.title}
                          </Typography>

                          {/* 하단 정보 영역 */}
                          <Box sx={{ mt: 'auto' }}>
                            {/* 내 입찰 금액 */}
                            <Box className="bidding-post-bid-info">
                              <Typography variant="body2" color="text.secondary" className="bidding-post-bid-text">
                                내 입찰 금액: {formatPrice(bidding.bid_amount)}원
                              </Typography>
                            </Box>

                            {/* 상태 및 입찰자 순위 */}
                            <Box className="bidding-post-chips">
                              <Chip
                                icon={statusInfo.icon}
                                label={statusInfo.label}
                                color={statusInfo.color}
                                size="small"
                                className="bidding-post-chip"
                              />
                              <Chip
                                label={`순위: ${bidding.bidder_rank}`}
                                color={getBidderRankColor(bidding.bidder_rank)}
                                size="small"
                                className="bidding-post-chip"
                              />
                            </Box>

                            {/* 입찰일 */}
                            <Typography variant="caption" color="text.secondary" className="bidding-post-date-text">
                              입찰일: {new Date(bidding.bid_time).toLocaleDateString('ko-KR')}
                            </Typography>
                          </Box>
                        </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <Box className="bidding-pagination-container">
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  className="bidding-pagination-item"
                />
              </Box>
            )}
          </>
        )}
      </TabPanel>
    </Box>
  );
};

export default BiddingSection;
