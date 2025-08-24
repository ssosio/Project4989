import React, { useState, useEffect } from 'react';
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
  Box
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Report as ReportIcon
} from '@mui/icons-material';
import api from '../../lib/api';

const PostManagementTab = ({ getStatusText, getStatusColor, onPostDetail }) => {
  // const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // 게시물 목록 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/post/list');
        console.log('게시물 목록 응답:', response.data);
        
        // 응답 데이터를 테이블 형식에 맞게 변환
        const formattedPosts = response.data.map(post => ({
          id: post.postId,
          title: post.title,
          type: getPostTypeText(post.postType),
          author: post.nickname || '알 수 없음',
          status: post.status || 'ON_SALE',
          reports: 0, // 신고 수는 별도 API로 가져와야 함
          postId: post.postId,
          postType: post.postType
        }));
        
        setPosts(formattedPosts);
      } catch (err) {
        console.error('게시물 목록 가져오기 실패:', err);
        setError('게시물 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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

  // 페이지 변경 핸들러
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // 현재 페이지의 게시물만 필터링
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPosts = posts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(posts.length / itemsPerPage);

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
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          게시글 목록 ({posts.length}개) - 페이지 {currentPage} / {totalPages}
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>제목</TableCell>
                <TableCell>카테고리</TableCell>
                <TableCell>작성자</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>신고</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentPosts.map((post) => (
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
                  <TableCell>{post.type}</TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusText(post.status)} 
                      color={getStatusColor(post.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {post.reports > 0 ? (
                      <Badge badgeContent={post.reports} color="error">
                        <ReportIcon color="action" />
                      </Badge>
                    ) : (
                      <Chip label="0" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => onPostDetail(post)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
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
  );
};

export default PostManagementTab;
