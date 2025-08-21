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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ShoppingCart as ShoppingCartIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Gavel as GavelIcon,
  Store as StoreIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';

const WishlistSection = ({ userInfo }) => {
  const [wishlist, setWishlist] = useState([]);
  const [filteredWishlist, setFilteredWishlist] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all'); // all, auction, general
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // 가상의 위시리스트 데이터 (실제로는 API에서 가져와야 함)
  useEffect(() => {
    const mockWishlist = [
      // 경매 상품들
      {
        id: 1,
        productName: '2023년식 현대 아반떼 CN7 (경매)',
        price: 15500000,
        originalPrice: 18000000,
        currentPrice: 15500000,
        category: '중고차',
        image: 'https://placehold.co/300x200/007AFF/FFFFFF?text=아반떼+경매',
        isAvailable: true,
        addedDate: '2024-01-15',
        seller: '개인판매자',
        description: '무사고 차량, 정기점검 완료, 실주행 3만km',
        type: 'auction', // 경매 글
        endTime: '2024-08-20T15:00:00',
        biddersCount: 12,
        isActive: true
      },
      {
        id: 2,
        productName: 'Apple MacBook Pro 16인치 M3 (경매)',
        price: 3200000,
        originalPrice: 3800000,
        currentPrice: 3200000,
        category: '전자기기',
        image: 'https://placehold.co/300x200/000000/FFFFFF?text=MacBook+경매',
        isAvailable: true,
        addedDate: '2024-01-18',
        seller: '애플스토어',
        description: 'M3 Pro 칩, 16GB 메모리, 512GB SSD, 새상품급',
        type: 'auction', // 경매 글
        endTime: '2024-08-19T20:30:00',
        biddersCount: 8,
        isActive: true
      },
      {
        id: 3,
        productName: 'Rolex Submariner 시계 (경매)',
        price: 12500000,
        originalPrice: 15000000,
        currentPrice: 12500000,
        category: '시계',
        image: 'https://placehold.co/300x200/FFD700/000000?text=Rolex+경매',
        isAvailable: true,
        addedDate: '2024-01-20',
        seller: '명품시계매장',
        description: '정품 인증서 포함, A/S 가능, 컬렉션용',
        type: 'auction', // 경매 글
        endTime: '2024-08-17T14:00:00',
        biddersCount: 18,
        isActive: false // 종료된 경매
      },
      // 일반 상품들
      {
        id: 4,
        productName: 'Nike Air Jordan 1 Retro High (일반)',
        price: 250000,
        originalPrice: 280000,
        category: '신발',
        image: 'https://placehold.co/300x200/DC143C/FFFFFF?text=Jordan+일반',
        isAvailable: true,
        addedDate: '2024-01-22',
        seller: '나이키 공식몰',
        description: '클래식한 디자인, 프리미엄 가죽 소재',
        type: 'general' // 일반 상품글
      },
      {
        id: 5,
        productName: 'Sony WH-1000XM5 헤드폰 (일반)',
        price: 450000,
        originalPrice: 500000,
        category: '전자기기',
        image: 'https://placehold.co/300x200/000000/FFFFFF?text=Sony+일반',
        isAvailable: false,
        addedDate: '2024-01-25',
        seller: '소니코리아',
        description: '업계 최고 수준의 노이즈 캔슬링, 30시간 배터리',
        type: 'general' // 일반 상품글
      },
      {
        id: 6,
        productName: 'Starbucks Reserve 커피 세트 (일반)',
        price: 120000,
        originalPrice: 150000,
        category: '식품',
        image: 'https://placehold.co/300x200/006241/FFFFFF?text=Coffee+일반',
        isAvailable: true,
        addedDate: '2024-01-28',
        seller: '스타벅스',
        description: '프리미엄 원두 5종, 전용 그라인더 포함',
        type: 'general' // 일반 상품글
      },
      {
        id: 7,
        productName: 'Samsung Galaxy Watch 6 (일반)',
        price: 350000,
        originalPrice: 400000,
        category: '전자기기',
        image: 'https://placehold.co/300x200/1428A0/FFFFFF?text=Watch+일반',
        isAvailable: true,
        addedDate: '2024-01-30',
        seller: '삼성전자',
        description: '44mm, LTE 모델, 심박수 모니터링, GPS',
        type: 'general' // 일반 상품글
      },
      {
        id: 8,
        productName: 'BMW 520i 2022년식 (경매)',
        price: 42000000,
        originalPrice: 55000000,
        currentPrice: 42000000,
        category: '중고차',
        image: 'https://placehold.co/300x200/0066CC/FFFFFF?text=BMW+경매',
        isAvailable: true,
        addedDate: '2024-02-01',
        seller: 'BMW 코리아',
        description: '무사고 차량, 풀옵션, 정품 네비게이션',
        type: 'auction', // 경매 글
        endTime: '2024-08-21T16:00:00',
        biddersCount: 25,
        isActive: true
      }
    ];
    setWishlist(mockWishlist);
    setFilteredWishlist(mockWishlist);
  }, []);

  // 필터링 및 정렬 적용
  useEffect(() => {
    let filtered = wishlist.filter(item => {
      // 검색어 필터
      const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 카테고리 필터
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      
      // 타입 필터 (경매/일반)
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      
      // 가격 필터
      let matchesPrice = true;
      if (priceFilter === 'under100k') matchesPrice = item.price < 100000;
      else if (priceFilter === '100k-500k') matchesPrice = item.price >= 100000 && item.price < 500000;
      else if (priceFilter === '500k-1m') matchesPrice = item.price >= 500000 && item.price < 1000000;
      else if (priceFilter === 'over1m') matchesPrice = item.price >= 1000000;
      
      // 재고 상태 필터
      const matchesAvailability = !showOnlyAvailable || item.isAvailable;
      
      return matchesSearch && matchesCategory && matchesType && matchesPrice && matchesAvailability;
    });

    // 정렬 적용
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.addedDate) - new Date(a.addedDate);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.productName.localeCompare(b.productName);
        case 'discount':
          return (b.originalPrice - b.price) - (a.originalPrice - a.price);
        default:
          return 0;
      }
    });

    setFilteredWishlist(filtered);
  }, [wishlist, searchTerm, categoryFilter, typeFilter, priceFilter, sortBy, showOnlyAvailable]);

  // 위시리스트에서 제거
  const handleRemoveFromWishlist = (itemId) => {
    setItemToDelete(itemId);
    setDeleteDialogOpen(true);
  };

  // 삭제 확인
  const confirmDelete = () => {
    setWishlist(prev => prev.filter(item => item.id !== itemToDelete));
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // 장바구니에 추가 (실제 구현 시 API 호출)
  const handleAddToCart = (item) => {
    console.log('장바구니에 추가:', item);
    // 실제 구현 시 장바구니 API 호출
  };

  // 상품 상세보기 (실제 구현 시 라우팅)
  const handleViewProduct = (item) => {
    console.log('상품 상세보기:', item);
    // 실제 구현 시 상품 상세 페이지로 이동
  };

  // 공유하기 (실제 구현 시 공유 기능)
  const handleShare = (item) => {
    console.log('공유하기:', item);
    // 실제 구현 시 공유 기능
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDiscountPercentage = (originalPrice, currentPrice) => {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  return (
    <Box>
      {/* 위시리스트 제목 및 통계 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          위시리스트
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="primary">
                {wishlist.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                전체 상품
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="warning.main">
                {wishlist.filter(item => item.type === 'auction').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                경매 상품
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="success.main">
                {wishlist.filter(item => item.type === 'general').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                일반 상품
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="info.main">
                {wishlist.filter(item => item.isAvailable).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                구매 가능
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* 타입 필터 버튼 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant={typeFilter === 'all' ? 'contained' : 'outlined'}
          onClick={() => setTypeFilter('all')}
          startIcon={<FilterIcon />}
        >
          전체 ({wishlist.length})
        </Button>
        <Button
          variant={typeFilter === 'auction' ? 'contained' : 'outlined'}
          color="warning"
          onClick={() => setTypeFilter('auction')}
          startIcon={<GavelIcon />}
        >
          경매만 보기 ({wishlist.filter(item => item.type === 'auction').length})
        </Button>
        <Button
          variant={typeFilter === 'general' ? 'contained' : 'outlined'}
          color="success"
          onClick={() => setTypeFilter('general')}
          startIcon={<StoreIcon />}
        >
          일반상품만 보기 ({wishlist.filter(item => item.type === 'general').length})
        </Button>
      </Box>

      {/* 검색 및 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="상품명 또는 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>카테고리</InputLabel>
                <Select
                  value={categoryFilter}
                  label="카테고리"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="전자기기">전자기기</MenuItem>
                  <MenuItem value="신발">신발</MenuItem>
                  <MenuItem value="의류">의류</MenuItem>
                  <MenuItem value="식품">식품</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>가격대</InputLabel>
                <Select
                  value={priceFilter}
                  label="가격대"
                  onChange={(e) => setPriceFilter(e.target.value)}
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="under100k">10만원 미만</MenuItem>
                  <MenuItem value="100k-500k">10만원-50만원</MenuItem>
                  <MenuItem value="500k-1m">50만원-100만원</MenuItem>
                  <MenuItem value="over1m">100만원 이상</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>정렬</InputLabel>
                <Select
                  value={sortBy}
                  label="정렬"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="date">최근 추가순</MenuItem>
                  <MenuItem value="price-low">가격 낮은순</MenuItem>
                  <MenuItem value="price-high">가격 높은순</MenuItem>
                  <MenuItem value="name">상품명순</MenuItem>
                  <MenuItem value="discount">할인율순</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showOnlyAvailable}
                    onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                  />
                }
                label="구매 가능만"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 위시리스트 상품 목록 */}
      {filteredWishlist.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <FavoriteBorderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            위시리스트가 비어있습니다
          </Typography>
          <Typography variant="body2" color="text.secondary">
            마음에 드는 상품을 위시리스트에 추가해보세요!
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredWishlist.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <WishlistCard
                item={item}
                onRemove={handleRemoveFromWishlist}
                onAddToCart={handleAddToCart}
                onView={handleViewProduct}
                onShare={handleShare}
                formatPrice={formatPrice}
                formatDate={formatDate}
                getDiscountPercentage={getDiscountPercentage}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>위시리스트에서 제거</DialogTitle>
        <DialogContent>
          <Typography>
            이 상품을 위시리스트에서 제거하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            제거
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// 위시리스트 상품 카드 컴포넌트
const WishlistCard = ({ 
  item, 
  onRemove, 
  onAddToCart, 
  onView, 
  onShare,
  formatPrice,
  formatDate,
  getDiscountPercentage
}) => {
  const hasDiscount = item.originalPrice > item.price;
  const discountPercentage = hasDiscount ? getDiscountPercentage(item.originalPrice, item.price) : 0;
  
  // 경매 상품 남은 시간 계산
  const getTimeRemaining = (endTime) => {
    if (!endTime) return '';
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

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 상품 이미지 */}
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={item.image}
          alt={item.productName}
          sx={{ objectFit: 'cover' }}
        />
        
        {/* 상품 타입 배지 */}
        <Chip
          label={item.type === 'auction' ? '경매' : '일반'}
          color={item.type === 'auction' ? 'warning' : 'success'}
          size="small"
          icon={item.type === 'auction' ? <GavelIcon /> : <StoreIcon />}
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            fontWeight: 'bold'
          }}
        />
        
        {/* 할인 배지 (할인이 있는 경우) */}
        {hasDiscount && (
          <Chip
            label={`${discountPercentage}% 할인`}
            color="error"
            size="small"
            sx={{
              position: 'absolute',
              top: item.type === 'auction' ? 48 : 8,
              left: 8,
              fontWeight: 'bold'
            }}
          />
        )}
        
        {/* 재고 상태 배지 */}
        <Chip
          label={item.isAvailable ? '구매 가능' : '품절'}
          color={item.isAvailable ? 'success' : 'error'}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontWeight: 'bold'
          }}
        />
        
        {/* 경매 남은 시간 (경매 상품이고 진행중인 경우) */}
        {item.type === 'auction' && item.endTime && item.isActive && (
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
              {getTimeRemaining(item.endTime)}
            </Typography>
          </Box>
        )}
        
        {/* 액션 버튼들 */}
        <Box sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          display: 'flex',
          gap: 1
        }}>
          <IconButton
            size="small"
            sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
            onClick={() => onView(item)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
            onClick={() => onShare(item)}
          >
            <ShareIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
            onClick={() => onRemove(item.id)}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
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
          {item.productName}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {item.description}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          판매자: {item.seller}
        </Typography>
        
        {/* 경매 상품 추가 정보 */}
        {item.type === 'auction' && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            참여자: {item.biddersCount}명 | 상태: {item.isActive ? '진행중' : '종료'}
          </Typography>
        )}
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          추가일: {formatDate(item.addedDate)}
        </Typography>

        <Box sx={{ mt: 'auto', pt: 2 }}>
          {/* 가격 정보 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            {hasDiscount && (
              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                {formatPrice(item.originalPrice)}
              </Typography>
            )}
            <Typography variant="h6" color="primary" fontWeight="bold">
              {formatPrice(item.price)}
            </Typography>
          </Box>

          {/* 액션 버튼 */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {item.type === 'auction' ? (
              <Button
                variant="contained"
                color="warning"
                startIcon={<GavelIcon />}
                fullWidth
                disabled={!item.isActive}
                onClick={() => onView(item)}
              >
                {item.isActive ? '경매 참여' : '경매 종료'}
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<ShoppingCartIcon />}
                fullWidth
                disabled={!item.isAvailable}
                onClick={() => onAddToCart(item)}
              >
                {item.isAvailable ? '장바구니' : '품절'}
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WishlistSection;
