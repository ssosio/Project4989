import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Tabs,
  Tab,
  Button,
  Rating,
  Divider,
  Avatar,
  IconButton,
  Badge
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Chat as ChatIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

// 탭 패널 컴포넌트
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`transaction-tabpanel-${index}`}
      aria-labelledby={`transaction-tab-${index}`}
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

const TransactionSection = ({ userInfo }) => {
  const [tabValue, setTabValue] = useState(0);
  const [transactions, setTransactions] = useState([]);

  // 거래 상태별 색상 및 아이콘
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'warning', icon: <ShoppingCartIcon />, label: '결제 대기' };
      case 'paid':
        return { color: 'info', icon: <LocalShippingIcon />, label: '배송 준비중' };
      case 'shipped':
        return { color: 'primary', icon: <LocalShippingIcon />, label: '배송중' };
      case 'delivered':
        return { color: 'success', icon: <CheckCircleIcon />, label: '배송 완료' };
      case 'completed':
        return { color: 'success', icon: <CheckCircleIcon />, label: '거래 완료' };
      case 'cancelled':
        return { color: 'error', icon: <CheckCircleIcon />, label: '취소됨' };
      default:
        return { color: 'default', icon: <ShoppingCartIcon />, label: '알 수 없음' };
    }
  };

  // 가상의 거래 데이터 (실제로는 API에서 가져와야 함)
  useEffect(() => {
    // 실제 구현 시에는 API 호출
    const mockTransactions = [
      {
        id: 1,
        productName: 'Apple iPhone 15 Pro',
        price: 1500000,
        status: 'completed',
        date: '2024-01-15',
        seller: '애플스토어',
        image: 'https://placehold.co/300x200/007AFF/FFFFFF?text=iPhone+15+Pro',
        rating: 5,
        review: '정말 좋은 제품이에요! 배송도 빠르고 품질도 훌륭합니다.',
        category: '전자기기'
      },
      {
        id: 2,
        productName: 'Nike Air Max 270',
        price: 180000,
        status: 'shipped',
        date: '2024-01-20',
        seller: '나이키 공식몰',
        image: 'https://placehold.co/300x200/000000/FFFFFF?text=Nike+Air+Max',
        rating: null,
        review: null,
        category: '신발'
      },
      {
        id: 3,
        productName: 'Samsung 65인치 QLED TV',
        price: 2800000,
        status: 'delivered',
        date: '2024-01-18',
        seller: '삼성전자',
        image: 'https://placehold.co/300x200/1428A0/FFFFFF?text=QLED+TV',
        rating: 4,
        review: '화질이 정말 좋아요. 다만 가격이 좀 비싸네요.',
        category: '가전제품'
      },
      {
        id: 4,
        productName: 'Starbucks 커피머신',
        price: 450000,
        status: 'paid',
        date: '2024-01-22',
        seller: '스타벅스',
        image: 'https://placehold.co/300x200/006241/FFFFFF?text=Coffee+Machine',
        rating: null,
        review: null,
        category: '가전제품'
      },
      {
        id: 5,
        productName: 'Adidas 운동복 세트',
        price: 120000,
        status: 'cancelled',
        date: '2024-01-19',
        seller: '아디다스',
        image: 'https://placehold.co/300x200/000000/FFFFFF?text=Adidas+Set',
        rating: null,
        review: null,
        category: '의류'
      }
    ];
    setTransactions(mockTransactions);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 탭별 거래 필터링
  const getFilteredTransactions = () => {
    switch (tabValue) {
      case 0: // 전체
        return transactions;
      case 1: // 진행중
        return transactions.filter(t => ['pending', 'paid', 'shipped'].includes(t.status));
      case 2: // 완료
        return transactions.filter(t => ['completed', 'delivered'].includes(t.status));
      case 3: // 취소
        return transactions.filter(t => t.status === 'cancelled');
      default:
        return transactions;
    }
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <Box>
      {/* 거래내역 제목 및 통계 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          거래내역
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="primary">
                {transactions.filter(t => ['pending', 'paid', 'shipped'].includes(t.status)).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                진행중
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="success.main">
                {transactions.filter(t => ['completed', 'delivered'].includes(t.status)).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                완료
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="error">
                {transactions.filter(t => t.status === 'cancelled').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                취소
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="info.main">
                {transactions.length}
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
          aria-label="거래내역 탭"
          sx={{
            '& .MuiTab-root': {
              fontSize: '1rem',
              fontWeight: 500,
              minHeight: 48,
            }
          }}
        >
          <Tab label={`전체 (${transactions.length})`} />
          <Tab label={`진행중 (${transactions.filter(t => ['pending', 'paid', 'shipped'].includes(t.status)).length})`} />
          <Tab label={`완료 (${transactions.filter(t => ['completed', 'delivered'].includes(t.status)).length})`} />
          <Tab label={`취소 (${transactions.filter(t => t.status === 'cancelled').length})`} />
        </Tabs>
      </Box>

      {/* 탭 컨텐츠 */}
      <TabPanel value={tabValue} index={0}>
        <TransactionList transactions={filteredTransactions} />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <TransactionList transactions={filteredTransactions} />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <TransactionList transactions={filteredTransactions} />
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <TransactionList transactions={filteredTransactions} />
      </TabPanel>
    </Box>
  );
};

// 거래 아이템 리스트 컴포넌트
const TransactionList = ({ transactions }) => {
  if (transactions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          거래내역이 없습니다
        </Typography>
        <Typography variant="body2" color="text.secondary">
          새로운 상품을 구매해보세요!
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {transactions.map((transaction) => (
        <Grid item xs={12} key={transaction.id}>
          <TransactionCard transaction={transaction} />
        </Grid>
      ))}
    </Grid>
  );
};

// 개별 거래 카드 컴포넌트
const TransactionCard = ({ transaction }) => {
  const statusInfo = getStatusInfo(transaction.status);
  
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

  return (
    <Card sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
      {/* 상품 이미지 */}
      <CardMedia
        component="img"
        sx={{ 
          width: { xs: '100%', md: 200 }, 
          height: { xs: 200, md: 200 },
          objectFit: 'cover'
        }}
        image={transaction.image}
        alt={transaction.productName}
      />
      
      {/* 상품 정보 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <CardContent sx={{ flex: '1 0 auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" component="h3" gutterBottom>
                {transaction.productName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                판매자: {transaction.seller}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                카테고리: {transaction.category}
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                {formatPrice(transaction.price)}
              </Typography>
              <Chip
                icon={statusInfo.icon}
                label={statusInfo.label}
                color={statusInfo.color}
                size="small"
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                {formatDate(transaction.date)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 리뷰 및 액션 버튼 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              {transaction.rating ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Rating value={transaction.rating} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary">
                    ({transaction.rating}/5)
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  아직 리뷰가 없습니다
                </Typography>
              )}
              
              {transaction.review && (
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  "{transaction.review}"
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {transaction.status === 'delivered' && !transaction.rating && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<StarIcon />}
                >
                  리뷰 작성
                </Button>
              )}
              
              {transaction.status === 'shipped' && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<VisibilityIcon />}
                >
                  배송 조회
                </Button>
              )}
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<ChatIcon />}
              >
                문의하기
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Box>
    </Card>
  );
};

// getStatusInfo 함수를 컴포넌트 외부로 이동
const getStatusInfo = (status) => {
  switch (status) {
    case 'pending':
      return { color: 'warning', icon: <ShoppingCartIcon />, label: '결제 대기' };
    case 'paid':
      return { color: 'info', icon: <LocalShippingIcon />, label: '배송 준비중' };
    case 'shipped':
      return { color: 'primary', icon: <LocalShippingIcon />, label: '배송중' };
    case 'delivered':
      return { color: 'success', icon: <CheckCircleIcon />, label: '배송 완료' };
    case 'completed':
      return { color: 'success', icon: <CheckCircleIcon />, label: '거래 완료' };
    case 'cancelled':
      return { color: 'error', icon: <CheckCircleIcon />, label: '취소됨' };
    default:
      return { color: 'default', icon: <ShoppingCartIcon />, label: '알 수 없음' };
  }
};

export default TransactionSection;
