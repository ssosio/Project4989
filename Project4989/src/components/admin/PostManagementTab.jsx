import React, { useState, useEffect, useContext } from 'react';
// import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Badge,
  CircularProgress,
  Alert,
  Pagination,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Report as ReportIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import api from '../../lib/api';
import { AuthContext } from '../../context/AuthContext';

const PostManagementTab = ({ getStatusText, getStatusColor, onPostDetail }) => {
  // const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 검색 관련 상태 추가
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState('TITLE'); // 검색 타입: TITLE, ID
  const [searchPostType, setSearchPostType] = useState('ALL');
  const [searchStatus, setSearchStatus] = useState('ALL');
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const { userInfo } = useContext(AuthContext);
  const token = userInfo?.token ?? localStorage.getItem('jwtToken');

  // 게시물 목록 가져오기 (검색 포함)
  const fetchPosts = async (page = 1, searchParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // 항상 전체 목록을 가져온 후 프론트엔드에서 필터링
      console.log('전체 목록 API 호출');
      const response = await api.get('/post/list');
      console.log('전체 목록 응답:', response.data);
      
      let formattedPosts = response.data.map(post => ({
        id: post.postId,
        title: post.title,
        type: getPostTypeText(post.postType),
        author: post.nickname || '알 수 없음',
        status: post.status || 'ON_SALE',
        reports: 0,
        postId: post.postId,
        postType: post.postType
      }));
      
      // 검색 조건이 있으면 필터링 적용
      if (Object.keys(searchParams).length > 0) {
        console.log('검색 파라미터:', searchParams);
        
        // 키워드 검색
        if (searchParams.keyword && searchParams.keyword.trim()) {
          const keyword = searchParams.keyword.trim().toLowerCase();
          if (searchParams.searchType === 'ID') {
            // ID 검색
            formattedPosts = formattedPosts.filter(post => 
              post.id.toString().includes(keyword)
            );
          } else {
            // 제목 검색
            formattedPosts = formattedPosts.filter(post => 
              post.title.toLowerCase().includes(keyword)
            );
          }
        }
        
        // 응답 데이터를 테이블 형식에 맞게 변환
        const formattedPosts = response.data.map(post => ({
          id: post.postId,
          title: post.title,
          type: getPostTypeText(post.postType),
          author: post.nickname || '알 수 없음',
          status: post.status || 'ON_SALE',
          reports: 0, // 신고 수는 별도 API로 가져와야 함
          postId: post.postId,
          postType: post.postType,
          tradeType: post.tradeType, // 원본 값 저장
          tradeTypeText: getTradeTypeText(post.tradeType) // 한글 텍스트 저장
        }));
        
        // 상태 필터
        if (searchParams.status && searchParams.status !== 'ALL') {
          formattedPosts = formattedPosts.filter(post => 
            post.status === searchParams.status
          );
        }
        
        console.log('필터링 후 결과:', formattedPosts.length, '개');
      }
      
      // 페이지네이션 적용
      const totalItems = formattedPosts.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentPagePosts = formattedPosts.slice(startIndex, endIndex);
      
      setPosts(currentPagePosts);
      setTotalPosts(totalItems);
      setTotalPages(totalPages);
      setCurrentPage(page);
      
    } catch (err) {
      console.error('게시물 목록 가져오기 실패:', err);
      setError('게시물 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로딩
  useEffect(() => {
    fetchPosts();
  }, []);

  // 검색 실행
  const handleSearch = () => {
    const searchParams = {};
    
    if (searchKeyword.trim()) {
      searchParams.keyword = searchKeyword.trim();
      searchParams.searchType = searchType; // 검색 타입 추가
    }
    
    if (searchPostType !== 'ALL') {
      searchParams.postType = searchPostType;
    }
    
    if (searchStatus !== 'ALL') {
      searchParams.status = searchStatus;
    }
    
    console.log('검색 파라미터:', searchParams);
    fetchPosts(1, searchParams);
  };

  // 검색 초기화
  const handleResetSearch = () => {
    setSearchKeyword('');
    setSearchType('TITLE');
    setSearchPostType('ALL');
    setSearchStatus('ALL');
    fetchPosts(1, {}); // 빈 객체로 호출하여 전체 목록 가져오기
  };

  // 페이지 변경
  const handlePageChange = (event, newPage) => {
    fetchPosts(newPage, {
      keyword: searchKeyword.trim() || undefined,
      searchType: searchKeyword.trim() ? searchType : undefined,
      postType: searchPostType !== 'ALL' ? searchPostType : undefined,
      status: searchStatus !== 'ALL' ? searchStatus : undefined
    });
  };

  // 게시물 타입 텍스트 변환
  const getPostTypeText = (postType) => {
    switch (postType) {
      case 'CARS': return '자동차';
      case 'REAL_ESTATES': return '부동산';
      case 'ITEMS': return '중고물품';
      case 'AUCTION': return '경매';
      default: return postType || '기타';
    }
  };

  // 판매 타입 텍스트 변환
  const getTradeTypeText = (tradeType) => {
    switch (tradeType) {
      case 'SALE': return '판매';
      case 'AUCTION': return '경매';
      case 'SHARE': return '나눔';
      default: return tradeType || '기타';
    }
  };

  // 제목 클릭 시 게시물 디테일 페이지로 이동
  const handleTitleClick = (post) => {
    // 게시물 타입에 따라 다른 디테일 페이지로 이동
    let detailPath = '';
    
    switch (post.postType) {
      case 'CARS':
        detailPath = `/board/GoodsDetail?postId=${post.postId}`;
        break;
      case 'REAL_ESTATES':
        detailPath = `/board/GoodsDetail?postId=${post.postId}`;
        break;
      case 'ITEMS':
        detailPath = `/board/GoodsDetail?postId=${post.postId}`;
        break;
      case 'AUCTION':
        detailPath = `/auction/detail/${post.postId}`;
        break;
      default:
        detailPath = `/board/GoodsDetail?postId=${post.postId}`;
    }
    
    // 새 탭에서 열기
    window.open(detailPath, '_blank');
  };

  // 삭제 확인 다이얼로그 열기
  const handleDeleteClick = (post) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  // 삭제 확인 다이얼로그 닫기
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setPostToDelete(null);

    
  };

  // 게시물 삭제 실행
  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    try {
      setDeleteLoading(true);
      
      // JWT 토큰 확인
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 삭제 API 호출
      await api.delete(`/post/${postToDelete.postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 성공 메시지
      alert('게시물이 성공적으로 삭제되었습니다.');
      
      // 목록에서 삭제된 게시물 제거
      setPosts(prevPosts => prevPosts.filter(post => post.postId !== postToDelete.postId));
      
      // 다이얼로그 닫기
      handleDeleteDialogClose();
      
    } catch (err) {
      console.error('게시물 삭제 실패:', err);
      alert('게시물 삭제에 실패했습니다: ' + '경매시간이 종료되지 않은 상품은 삭제할 수 없습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // 로딩 중일 때
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>게시글 목록</Typography>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <CircularProgress />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 에러가 있을 때
  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>게시글 목록</Typography>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            게시글 목록 ({totalPosts}개) - 페이지 {currentPage} / {totalPages}
          </Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>검색 타입</InputLabel>
                <Select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  label="검색 타입"
                >
                  <MenuItem value="TITLE">제목</MenuItem>
                  <MenuItem value="ID">ID</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="검색어"
                variant="outlined"
                fullWidth
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>게시글 타입</InputLabel>
                <Select
                  value={searchPostType}
                  onChange={(e) => setSearchPostType(e.target.value)}
                  label="게시글 타입"
                >
                  <MenuItem value="ALL">전체</MenuItem>
                  <MenuItem value="CARS">자동차</MenuItem>
                  <MenuItem value="REAL_ESTATES">부동산</MenuItem>
                  <MenuItem value="ITEMS">중고물품</MenuItem>
                  <MenuItem value="AUCTION">경매</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>상태</InputLabel>
                <Select
                  value={searchStatus}
                  onChange={(e) => setSearchStatus(e.target.value)}
                  label="상태"
                >
                  <MenuItem value="ALL">전체</MenuItem>
                  <MenuItem value="ON_SALE">판매중</MenuItem>
                  <MenuItem value="SOLD_OUT">판매완료</MenuItem>
                  <MenuItem value="DELETED">삭제됨</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                fullWidth
              >
                검색
              </Button>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="outlined"
                onClick={handleResetSearch}
                fullWidth
              >
                검색 초기화
              </Button>
            </Grid>
          </Grid>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>제목</TableCell>
                  <TableCell>판매타입</TableCell>
                  <TableCell>카테고리</TableCell>
                  <TableCell>작성자</TableCell>
                  <TableCell>상태</TableCell>
                  {/* <TableCell>신고</TableCell> */}
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>{post.id}</TableCell>
                      <TableCell>
                        <Typography
                          component="span"
                          sx={{
                            cursor: 'pointer',
                            color: '#000',
                            '&:hover': {
                              color: 'primary.dark'
                            }
                          }}
                          onClick={() => handleTitleClick(post)}
                        >
                          {post.title}
                        </Typography>
                      </TableCell>
                      <TableCell>{post.tradeTypeText}</TableCell>
                    <TableCell>{post.type}</TableCell>
                    <TableCell>{post.author}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusText(post.status)} 
                        color={getStatusColor(post.status)} 
                        size="small" 
                      />
                    </TableCell>
                    {/* <TableCell>
                      {post.reports > 0 ? (
                        <Badge badgeContent={post.reports} color="error">
                          <ReportIcon color="action" />
                        </Badge>
                      ) : (
                        <Chip label="0" size="small" variant="outlined" />
                      )}
                    </TableCell> */}
                    <TableCell>
                      {/* <IconButton size="small" onClick={() => onPostDetail(post)}>
                        <VisibilityIcon />
                      </IconButton> */}
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteClick(post)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          게시물 삭제 확인
        </DialogTitle>
        <DialogContent>
          <Typography>
            정말로 "{postToDelete?.title}" 게시물을 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} disabled={deleteLoading}>
            취소
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={20} /> : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PostManagementTab;
