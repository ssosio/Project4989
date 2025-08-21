import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Pagination,
  CardMedia,
  CardActionArea
} from '@mui/material';
import { 
  ShoppingCart, 
  Gavel, 
  CardGiftcard, 
  AllInclusive,
  Visibility,
  AccessTime,
  CheckCircle,
  Cancel,
  Schedule,
  AttachMoney,
  Person,
  RemoveRedEye
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const TransactionSection = ({ userInfo }) => {
  const [typeFilter, setTypeFilter] = useState('all'); // all, auction, sale, share
  const [statusFilter, setStatusFilter] = useState('all'); // all, on_sale, reserved, sold, cancelled
  const [posts, setPosts] = useState([]);
  const [totalCounts, setTotalCounts] = useState({
    total: 0,
    auction: 0,
    sale: 0,
    share: 0
  });
  const [statusCounts, setStatusCounts] = useState({
    on_sale: 0,
    reserved: 0,
    sold: 0,
    cancelled: 0
  });

  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const [postImages, setPostImages] = useState({}); // 각 게시글의 이미지 URL 저장
  const [imageErrors, setImageErrors] = useState(new Set()); // 이미지 로드 실패한 게시글 ID 저장

  const navigate = useNavigate();

  // 전체 카운트 조회 (한 번만 호출)
  const fetchTotalCounts = async () => {
    try {
      const response = await api.get(
        `/auction/my-posts-counts/${userInfo.memberId}`
      );
      setTotalCounts(response.data);
    } catch (error) {
      console.error('게시글 개수 조회 실패:', error);
    }
  };

    // 게시글의 이미지 가져오기
  const fetchPostImages = async (posts) => {
    const images = {};
    for (const post of posts) {
      try {
        const photoResponse = await api.get(`/auction/photos/${post.postId}`);
        if (photoResponse.data && photoResponse.data.length > 0) {
          // 첫 번째 이미지를 메인 이미지로 사용
          const imageUrl = photoResponse.data[0].photo_url;
          // 이미지 URL 생성
          const encodedUrl = encodeURIComponent(imageUrl);
          const imageWithToken = `http://localhost:4989/auction/image/${encodedUrl}`;
          images[post.postId] = { url: imageWithToken, originalUrl: imageUrl };
        }
      } catch (error) {
        console.error(`게시글 ${post.postId} 이미지 조회 실패:`, error);
      }
    }
    setPostImages(images);
  };

  // 게시글 조회 및 상태별 카운트 계산
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/auction/my-posts/${userInfo.memberId}`,
        {
          params: {
            type: typeFilter === 'all' ? null : typeFilter,
            status: statusFilter === 'all' ? null : statusFilter,
            page: currentPage,
            size: pageSize
          }
        }
      );
      

      setPosts(response.data.posts);
      setTotalPages(response.data.totalPages);
      setTotalCount(response.data.totalCount);
      
      // 서버에서 받은 상태별 카운트 사용
      if (response.data.statusCounts) {
        setStatusCounts(response.data.statusCounts);
      }

      // 게시글 이미지 가져오기
      await fetchPostImages(response.data.posts);
    } catch (error) {
      console.error('게시글 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 현재 선택된 타입에 따른 상태별 카운트 계산
  const getCurrentStatusCounts = () => {
    if (typeFilter === 'all') {
      // 전체 선택 시 서버에서 받은 전체 카운트 사용
      return statusCounts;
    } else {
      // 특정 타입 선택 시 해당 타입의 게시글들만 계산
      const filteredPosts = posts.filter(post => post.tradeType === typeFilter);
      const counts = {
        on_sale: 0,
        reserved: 0,
        sold: 0,
        cancelled: 0
      };
      
      filteredPosts.forEach(post => {
        if (post.status === 'ON_SALE') counts.on_sale++;
        else if (post.status === 'RESERVED') counts.reserved++;
        else if (post.status === 'SOLD') {
          if (post.tradeType === 'AUCTION' && !post.winnerId) {
            counts.cancelled++; // 유찰
          } else {
            counts.sold++; // 거래완료
          }
        }
      });
      
      return counts;
    }
  };

  const currentStatusCounts = getCurrentStatusCounts();

  // 현재 선택된 타입의 전체 개수 (상태 필터와 무관하게 고정)
  const getCurrentTypeTotalCount = () => {
    if (typeFilter === 'all') {
      return totalCounts.total;
    } else {
      return totalCounts[typeFilter.toLowerCase()] || 0;
    }
  };

  const currentTypeTotalCount = getCurrentTypeTotalCount();

  // 타입별 필터 변경 시 상태 필터 초기화 및 카운트 업데이트
  const handleTypeFilterChange = (newTypeFilter) => {
    setTypeFilter(newTypeFilter);
    setStatusFilter('all'); // 상태 필터를 전체로 초기화
    setCurrentPage(1); // 첫 페이지로 이동
  };

  // 상태별 필터 변경 시
  const handleStatusFilterChange = (newStatusFilter) => {
    setStatusFilter(newStatusFilter);
    setCurrentPage(1); // 첫 페이지로 이동
  };


  useEffect(() => {
    if (userInfo?.memberId) {
      fetchTotalCounts();
    }
  }, [userInfo?.memberId]);

  useEffect(() => {
    if (userInfo?.memberId) {
      setCurrentPage(1); // 필터 변경 시 첫 페이지로
      fetchPosts();
    }
  }, [userInfo?.memberId, typeFilter, statusFilter]);

  useEffect(() => {
    if (userInfo?.memberId) {
      fetchPosts();
    }
  }, [currentPage]);

  // 상태별 아이콘과 색상
  const getStatusInfo = (status, tradeType, winnerId) => {
    // 유찰 조건 체크
    if (status === 'SOLD' && tradeType === 'AUCTION' && !winnerId) {
      return { icon: <Cancel />, color: 'error', label: '유찰' };
    }
    
    switch (status) {
      case 'ON_SALE':
        return { icon: <Visibility />, color: 'primary', label: '판매중' };
      case 'RESERVED':
        return { icon: <Schedule />, color: 'warning', label: '예약중' };
      case 'SOLD':
        return { icon: <CheckCircle />, color: 'success', label: '거래완료' };
      default:
        return { icon: <Visibility />, color: 'default', label: status };
    }
  };

  // 타입별 아이콘과 색상
  const getTypeInfo = (type) => {
    switch (type) {
      case 'AUCTION':
        return { icon: <Gavel />, color: 'primary', label: '경매' };
      case 'SALE':
        return { icon: <ShoppingCart />, color: 'secondary', label: '일반거래' };
      case 'SHARE':
        return { icon: <CardGiftcard />, color: 'success', label: '나눔' };
      default:
        return { icon: <AllInclusive />, color: 'default', label: type };
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 가격 포맷팅
  const formatPrice = (price) => {
    if (!price) return '없음';
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  // 페이지 변경 핸들러
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // 게시글 상세 페이지로 이동하는 함수
  const handlePostClick = (post) => {
    if (post.tradeType === 'AUCTION') {
      // 경매는 auction 상세 페이지로
      navigate(`/auction/detail/${post.postId}`);
    } else {
      // 일반 게시글과 나눔은 board 상세 페이지로
      navigate(`/board/GoodsDetail?postId=${post.postId}`);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* 타입별 필터 */}
      <Box sx={{ mb: 4, p: 3, bgcolor: 'white', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#2c3e50' }}>
          게시글 타입
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant={typeFilter === 'all' ? 'contained' : 'outlined'}
              onClick={() => handleTypeFilterChange('all')}
              startIcon={<AllInclusive />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                boxShadow: typeFilter === 'all' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              전체 ({totalCounts.total})
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant={typeFilter === 'AUCTION' ? 'contained' : 'outlined'}
              onClick={() => handleTypeFilterChange('AUCTION')}
              startIcon={<Gavel />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                boxShadow: typeFilter === 'AUCTION' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              경매 ({totalCounts.auction})
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant={typeFilter === 'SALE' ? 'contained' : 'outlined'}
              onClick={() => handleTypeFilterChange('SALE')}
              startIcon={<ShoppingCart />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                boxShadow: typeFilter === 'SALE' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              일반거래 ({totalCounts.sale})
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant={typeFilter === 'SHARE' ? 'contained' : 'outlined'}
              onClick={() => handleTypeFilterChange('SHARE')}
              startIcon={<CardGiftcard />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                boxShadow: typeFilter === 'SHARE' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              나눔 ({totalCounts.share})
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* 상태별 필터 */}
      <Box sx={{ mb: 4, p: 3, bgcolor: 'white', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#2c3e50' }}>
          게시글 상태
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant={statusFilter === 'all' ? 'contained' : 'outlined'}
              onClick={() => handleStatusFilterChange('all')}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                boxShadow: statusFilter === 'all' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              전체 ({currentTypeTotalCount})
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant={statusFilter === 'ON_SALE' ? 'contained' : 'outlined'}
              onClick={() => handleStatusFilterChange('ON_SALE')}
              startIcon={<Visibility />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                boxShadow: statusFilter === 'ON_SALE' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              판매중 ({currentStatusCounts.on_sale})
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant={statusFilter === 'RESERVED' ? 'contained' : 'outlined'}
              onClick={() => handleStatusFilterChange('RESERVED')}
              startIcon={<Schedule />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                boxShadow: statusFilter === 'RESERVED' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              예약중 ({currentStatusCounts.reserved})
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant={statusFilter === 'SOLD' ? 'contained' : 'outlined'}
              onClick={() => handleStatusFilterChange('SOLD')}
              startIcon={<CheckCircle />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                boxShadow: statusFilter === 'SOLD' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              거래완료 ({currentStatusCounts.sold})
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant={statusFilter === 'cancelled' ? 'contained' : 'outlined'}
              onClick={() => handleStatusFilterChange('cancelled')}
              startIcon={<Cancel />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                boxShadow: statusFilter === 'cancelled' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              유찰 ({currentStatusCounts.cancelled})
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* 게시글 목록 */}
      <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#2c3e50' }}>
          게시글 목록 ({totalCount}개)
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} sx={{ color: '#3498db', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                게시글을 불러오는 중...
              </Typography>
            </Box>
          </Box>
        ) : posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 6 }}>
            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
              📭 게시글이 없습니다
            </Typography>
            <Typography variant="body1" color="text.secondary">
              해당하는 게시글이 없습니다.
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ justifyContent: 'flex-start' }}>
              {posts.map((post) => {
                const statusInfo = getStatusInfo(post.status, post.tradeType, post.winnerId);
                const typeInfo = getTypeInfo(post.tradeType);
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={post.postId}>
                    <Card 
                      sx={{ 
                        height: '500px', // 고정 높이 설정
                        display: 'flex', 
                        flexDirection: 'column',
                        width: '100%',
                        borderRadius: 3,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        },
                        cursor: 'pointer',
                        overflow: 'hidden'
                      }}
                      onClick={() => handlePostClick(post)}
                    >
                       {/* 이미지 - 고정 높이 */}
                       <Box sx={{ height: '200px', overflow: 'hidden' }}>
                         {postImages[post.postId] && !imageErrors.has(post.postId) ? (
                           <CardMedia
                             component="img"
                             height="200"
                             image={postImages[post.postId].url}
                             alt={post.title}
                             sx={{ 
                               objectFit: 'cover',
                               transition: 'transform 0.3s ease-in-out',
                               '&:hover': {
                                 transform: 'scale(1.05)'
                               }
                             }}
                             onError={(e) => {
                               console.log('이미지 로드 실패:', postImages[post.postId].originalUrl);
                               console.log('실패한 이미지 URL:', e.target.src);
                               setImageErrors(prev => new Set(prev).add(post.postId));
                             }}
                             onLoad={() => {
                               console.log('이미지 로드 성공:', postImages[post.postId].originalUrl);
                             }}
                           />
                         ) : (
                           <Box
                             sx={{
                               height: 200,
                               background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               color: '#666',
                               fontSize: '1.1rem',
                               fontWeight: 500
                             }}
                           >
                             <Typography variant="body1">이미지 없음</Typography>
                           </Box>
                         )}
                       </Box>
                       
                       <CardContent sx={{ 
                         flexGrow: 1, 
                         display: 'flex', 
                         flexDirection: 'column',
                         p: 2,
                         '&:last-child': { pb: 2 },
                         height: '300px', // 고정 높이 (500px - 200px 이미지)
                         overflow: 'hidden'
                       }}>
                         {/* 칩들 - 고정 높이 */}
                         <Box sx={{ 
                           display: 'flex', 
                           gap: 1, 
                           mb: 1, 
                           flexWrap: 'wrap',
                           height: '32px', // 고정 높이
                           alignItems: 'center'
                         }}>
                           <Chip
                             icon={typeInfo.icon}
                             label={typeInfo.label}
                             color={typeInfo.color}
                             size="small"
                             sx={{ 
                               borderRadius: 2,
                               fontWeight: 600,
                               fontSize: '0.75rem',
                               height: '24px'
                             }}
                           />
                           <Chip
                             icon={statusInfo.icon}
                             label={statusInfo.label}
                             color={statusInfo.color}
                             size="small"
                             sx={{ 
                               borderRadius: 2,
                               fontWeight: 600,
                               fontSize: '0.75rem',
                               height: '24px'
                             }}
                           />
                         </Box>
                         
                         {/* 제목 - 고정 높이 */}
                         <Typography 
                           variant="h6" 
                           sx={{ 
                             mb: 1, 
                             fontSize: '1rem', 
                             fontWeight: 700,
                             overflow: 'hidden',
                             textOverflow: 'ellipsis',
                             whiteSpace: 'nowrap',
                             lineHeight: '1.3',
                             color: '#2c3e50',
                             height: '24px', // 고정 높이
                             display: 'flex',
                             alignItems: 'center'
                           }}
                         >
                           {post.title}
                         </Typography>
                         
                         {/* 설명 - 고정 높이 */}
                         <Typography 
                           variant="body2" 
                           color="text.secondary" 
                           sx={{ 
                             mb: 1.5, 
                             overflow: 'hidden',
                             textOverflow: 'ellipsis',
                             display: '-webkit-box',
                             WebkitLineClamp: 2,
                             WebkitBoxOrient: 'vertical',
                             lineHeight: '1.4',
                             fontSize: '0.8rem',
                             height: '32px', // 고정 높이 (2줄)
                             flexShrink: 0
                           }}
                         >
                           {post.content || '설명 없음'}
                         </Typography>
                         
                         {/* 가격 정보 - 고정 높이 */}
                         <Box sx={{ 
                           mb: 1, 
                           p: 1, 
                           bgcolor: '#f8f9fa', 
                           borderRadius: 2,
                           height: '40px',
                           display: 'flex',
                           alignItems: 'center'
                         }}>
                           <Typography 
                             variant="body1" 
                             sx={{ 
                               display: 'flex', 
                               alignItems: 'center', 
                               gap: 1,
                               fontWeight: 700,
                               color: '#e74c3c',
                               fontSize: '0.9rem'
                             }}
                           >
                             <AttachMoney fontSize="small" />
                             {formatPrice(post.price)}
                           </Typography>
                         </Box>
                         
                         {/* 추가 정보 - 고정 높이 */}
                         <Box sx={{ 
                           mb: 1,
                           height: '20px',
                           display: 'flex',
                           alignItems: 'center'
                         }}>
                           <Typography 
                             variant="body2" 
                             color="text.secondary" 
                             sx={{ 
                               display: 'flex', 
                               alignItems: 'center', 
                               gap: 0.5,
                               fontSize: '0.75rem'
                             }}
                           >
                             <RemoveRedEye fontSize="small" />
                             조회수: {post.viewCount || 0}
                           </Typography>
                         </Box>
                         
                         {/* 날짜 정보 - 고정 높이 */}
                         <Box sx={{ 
                           mb: 1,
                           height: '40px',
                           display: 'flex',
                           flexDirection: 'column',
                           justifyContent: 'center'
                         }}>
                           <Typography 
                             variant="body2" 
                             color="text.secondary"
                             sx={{ fontSize: '0.75rem', mb: 0.5 }}
                           >
                             작성일: {formatDate(post.createdAt)}
                           </Typography>
                           <Typography 
                             variant="body2" 
                             color="text.secondary"
                             sx={{ fontSize: '0.75rem' }}
                           >
                             마감일: {post.auctionEndTime ? formatDate(post.auctionEndTime) : '없음'}
                           </Typography>
                         </Box>
                         
                         {/* 구매자 정보 - 고정 높이 */}
                         <Typography 
                           variant="body2" 
                           color="text.secondary" 
                           sx={{ 
                             display: 'flex', 
                             alignItems: 'center', 
                             gap: 0.5,
                             fontSize: '0.75rem',
                             p: 0.5,
                             bgcolor: '#f1f3f4',
                             borderRadius: 1,
                             height: '24px',
                             flexShrink: 0
                           }}
                         >
                           <Person fontSize="small" />
                           구매자: {post.buyerName || '없음'}
                         </Typography>
                       </CardContent>
                     </Card>
                   </Grid>
                 );
              })}
            </Grid>
            
            {/* 페이징 */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, p: 3 }}>
                <Pagination 
                  count={totalPages} 
                  page={currentPage} 
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '1rem',
                      minWidth: 40,
                      height: 40,
                      '&.Mui-selected': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        transform: 'scale(1.1)'
                      },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                      },
                      transition: 'all 0.3s ease'
                    }
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default TransactionSection;
