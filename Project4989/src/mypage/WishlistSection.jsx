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
  Search as SearchIcon
} from '@mui/icons-material';

const WishlistSection = ({ userInfo }) => {
  const [wishlist, setWishlist] = useState([]);
  const [filteredWishlist, setFilteredWishlist] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // 가상의 위시리스트 데이터 (실제로는 API에서 가져와야 함)
  useEffect(() => {
    const mockWishlist = [
      {
        id: 1,
        productName: 'Apple MacBook Pro 16인치',
        price: 3500000,
        originalPrice: 3800000,
        category: '전자기기',
        image: 'https://placehold.co/300x200/007AFF/FFFFFF?text=MacBook+Pro',
        isAvailable: true,
        addedDate: '2024-01-15',
        seller: '애플스토어',
        description: 'M3 Pro 칩 탑재, 16GB 통합 메모리, 512GB SSD'
      },
      {
        id: 2,
        productName: 'Nike Air Jordan 1 Retro High',
        price: 250000,
        originalPrice: 250000,
        category: '신발',
        image: 'https://placehold.co/300x200/000000/FFFFFF?text=Air+Jordan+1',
        isAvailable: true,
        addedDate: '2024-01-18',
        seller: '나이키 공식몰',
        description: '클래식한 디자인, 프리미엄 가죽 소재'
      },
      {
        id: 3,
        productName: 'Sony WH-1000XM5 헤드폰',
        price: 450000,
        originalPrice: 500000,
        category: '전자기기',
        image: 'https://placehold.co/300x200/000000/FFFFFF?text=Sony+WH-1000XM5',
        isAvailable: false,
        addedDate: '2024-01-20',
        seller: '소니코리아',
        description: '업계 최고 수준의 노이즈 캔슬링, 30시간 배터리'
      },
      {
        id: 4,
        productName: 'Starbucks Reserve 커피 세트',
        price: 120000,
        originalPrice: 150000,
        category: '식품',
        image: 'https://placehold.co/300x200/006241/FFFFFF?text=Coffee+Set',
        isAvailable: true,
        addedDate: '2024-01-22',
        seller: '스타벅스',
        description: '프리미엄 원두 5종, 전용 그라인더 포함'
      },
      {
        id: 5,
        productName: 'Adidas Ultraboost 22',
        price: 280000,
        originalPrice: 320000,
        category: '신발',
        image: 'https://placehold.co/300x200/000000/FFFFFF?text=Ultraboost+22',
        isAvailable: true,
        addedDate: '2024-01-25',
        seller: '아디다스',
        description: '부스터 중창, 프라임니트 어퍼, 가벼운 착용감'
      },
      {
        id: 6,
        productName: 'Samsung Galaxy Watch 6',
        price: 350000,
        originalPrice: 400000,
        category: '전자기기',
        image: 'https://placehold.co/300x200/1428A0/FFFFFF?text=Galaxy+Watch+6',
        isAvailable: true,
        addedDate: '2024-01-28',
        seller: '삼성전자',
        description: '44mm, LTE 모델, 심박수 모니터링, GPS'
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
      
      // 가격 필터
      let matchesPrice = true;
      if (priceFilter === 'under100k') matchesPrice = item.price < 100000;
      else if (priceFilter === '100k-500k') matchesPrice = item.price >= 100000 && item.price < 500000;
      else if (priceFilter === '500k-1m') matchesPrice = item.price >= 500000 && item.price < 1000000;
      else if (priceFilter === 'over1m') matchesPrice = item.price >= 1000000;
      
      // 재고 상태 필터
      const matchesAvailability = !showOnlyAvailable || item.isAvailable;
      
      return matchesSearch && matchesCategory && matchesPrice && matchesAvailability;
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
  }, [wishlist, searchTerm, categoryFilter, priceFilter, sortBy, showOnlyAvailable]);

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
              <Typography variant="h6" color="success.main">
                {wishlist.filter(item => item.isAvailable).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                구매 가능
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="warning.main">
                {wishlist.filter(item => item.originalPrice > item.price).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                할인 상품
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="info.main">
                {formatPrice(wishlist.reduce((sum, item) => sum + item.price, 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                총 가격
              </Typography>
            </Card>
          </Grid>
        </Grid>
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
        
        {/* 할인 배지 */}
        {hasDiscount && (
          <Chip
            label={`${discountPercentage}% 할인`}
            color="error"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
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
            <Button
              variant="contained"
              startIcon={<ShoppingCartIcon />}
              fullWidth
              disabled={!item.isAvailable}
              onClick={() => onAddToCart(item)}
            >
              {item.isAvailable ? '장바구니' : '품절'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WishlistSection;
