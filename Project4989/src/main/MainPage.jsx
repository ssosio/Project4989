
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

const MainPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState('latest');
  const [tradeType, setTradeType] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // 상세보기 페이지로 이동하는 함수
  const handleViewDetail = (postId) => {
    navigate(`board/GoodsDetail?postId=${postId}`);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:4989/post/list');
      console.log('API 응답 데이터:', response.data);
      console.log('첫 번째 게시글 구조:', response.data[0]);
      console.log('첫 번째 게시글 키들:', Object.keys(response.data[0]));
      console.log('첫 번째 게시글 tradeType 값:', response.data[0]?.tradeType);
      console.log('첫 번째 게시글 viewCount 값:', response.data[0]?.viewCount);
      console.log('첫 번째 게시글 createdAt 값:', response.data[0]?.createdAt);

      // 이미지 관련 필드 확인
      if (response.data && response.data.length > 0) {
        const firstPost = response.data[0];
        console.log('이미지 관련 필드들:');
        console.log('- mainPhotoUrl:', firstPost.mainPhotoUrl);
        console.log('- photo_url:', firstPost.photo_url);
        console.log('- mainPhoto:', firstPost.mainPhoto);
        console.log('- image:', firstPost.image);
        console.log('- img:', firstPost.img);
        console.log('- photo:', firstPost.photo);
        console.log('- thumbnail:', firstPost.thumbnail);
        console.log('- cover:', firstPost.cover);
      }

      setPosts(response.data);
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    console.log('필터링 실행 - posts:', posts.length, 'tradeType:', tradeType, 'sortType:', sortType);

    let filtered = posts;

    // 거래 타입 필터링
    if (tradeType !== 'ALL') {
      filtered = posts.filter(post => post.tradeType === tradeType);
      console.log(`${tradeType} 필터링 후 결과:`, filtered.length, '개');
    }

    // 정렬
    let sorted = [...filtered];
    if (sortType === 'latest') {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortType === 'views') {
      sorted.sort((a, b) => (parseInt(b.viewCount) || 0) - (parseInt(a.viewCount) || 0));
    }

    console.log('최종 정렬된 결과:', sorted.length, '개');
    return sorted;
  }, [posts, tradeType, sortType]);

  const handleSortChange = (e) => {
    setSortType(e.target.value);
    setCurrentPage(1);
  };

  const handleTradeTypeChange = (e) => {
    setTradeType(e.target.value);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(filteredPosts.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const currentItems = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);

  const formatPrice = (price) => {
    if (!price) return '가격 미정';
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)}개월 전`;
    return `${Math.ceil(diffDays / 365)}년 전`;
  };

  const getStatusBadge = (status) => {
    if (status === 'SOLD') {
      return <span className="status-badge sold">판매완료</span>;
    }
    return <span className="status-badge on-sale">판매중</span>;
  };

  const getPostTypeIcon = (postType) => {
    switch (postType) {
      case 'CARS':
        return <span className="post-type-icon car">🚗</span>;
      case 'REAL_ESTATES':
        return <span className="post-type-icon estate">🏠</span>;
      case 'ITEMS':
        return <span className="post-type-icon item">📦</span>;
      default:
        return <span className="post-type-icon default">📋</span>;
    }
  };

  const getTradeTypeLabel = (tradeType) => {
    switch (tradeType) {
      case 'SALE':
        return '판매';
      case 'AUCTION':
        return '경매';
      case 'SHARE':
        return '나눔';
      default:
        return '기타';
    }
  };

  // 이미지 URL을 가져오는 함수 - post_photos 테이블 사용
  const getImageUrl = (post) => {
    // post_photos 테이블의 이미지 URL 사용
    if (post.photo_url) {
      return `http://localhost:4989/uploads/${post.photo_url}`;
    }

    // 기존 필드들도 확인
    return post.mainPhotoUrl || post.mainPhoto || post.image || post.img || post.photo || post.thumbnail || post.cover || null;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>상품을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="main-page">
      {/* 히어로 섹션 */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">당신의 중고거래를 더 스마트하게</h1>
          <p className="hero-subtitle">믿을 수 있는 중고거래 플랫폼에서 안전하게 거래하세요</p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">{posts.length}</span>
              <span className="stat-label">등록된 상품</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">실시간 채팅</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">안전거래</span>
            </div>
          </div>
        </div>
      </section>

      {/* 필터 섹션 */}
      <section className="filter-section">
        <div className="container">
          <div className="filter-controls">
            <div className="filter-group">
              <label htmlFor="tradeType" className="filter-label">거래방식</label>
              <select
                id="tradeType"
                value={tradeType}
                onChange={handleTradeTypeChange}
                className="filter-select"
              >
                <option value="ALL">전체</option>
                <option value="SALE">판매</option>
                <option value="AUCTION">경매</option>
                <option value="SHARE">나눔</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="sortType" className="filter-label">정렬</label>
              <select
                id="sortType"
                value={sortType}
                onChange={handleSortChange}
                className="filter-select"
              >
                <option value="latest">최신순</option>
                <option value="views">조회순</option>
              </select>
            </div>
          </div>

          <div className="filter-results">
            <span className="results-count">총 {filteredPosts.length}개의 상품</span>
          </div>
        </div>
      </section>

      {/* 상품 목록 섹션 */}
      <section className="products-section">
        <div className="container">
          {currentItems.length === 0 ? (
            <div className="no-products">
              <div className="no-products-icon">🔍</div>
              <h3>검색 결과가 없습니다</h3>
              <p>다른 조건으로 검색해보세요</p>
            </div>
          ) : (
            <div className="products-grid">
              {currentItems.map((post) => (
                <div key={post.postId} className="product-card">
                  <div className="product-image-container">
                    {getImageUrl(post) ? (
                      <img
                        src={getImageUrl(post)}
                        alt={post.title}
                        className="product-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    {!getImageUrl(post) && (
                      <div className="no-image-placeholder">
                        <span>📷</span>
                        <p>이미지 없음</p>
                      </div>
                    )}
                    <div className="product-overlay">
                      {getPostTypeIcon(post.postType)}
                      {getStatusBadge(post.status)}
                    </div>
                  </div>

                  <div className="product-info">
                    <div className="product-header">
                      <span className="trade-type-badge">
                        {getTradeTypeLabel(post.tradeType)}
                      </span>
                      <span className="post-type-label">
                        {post.postType === 'CARS' ? '자동차' :
                          post.postType === 'REAL_ESTATES' ? '부동산' : '중고물품'}
                      </span>
                    </div>

                    <h3 className="product-title">{post.title}</h3>

                    <div className="product-meta">
                      <span className="product-price">{formatPrice(post.price)}</span>
                      <span className="product-date">{formatDate(post.createdAt)}</span>
                    </div>

                    <div className="product-footer">
                      <div className="product-stats">
                        <span className="view-count">👁️ {post.viewCount || 0}</span>
                        <span className="seller-name">👤 {post.nickname}</span>
                      </div>
                      <button
                        className="view-detail-btn"
                        onClick={() => handleViewDetail(post.postId)}
                      >
                        상세보기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <section className="pagination-section">
          <div className="container">
            <div className="pagination">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="pagination-btn prev"
              >
                ← 이전
              </button>

              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`page-number ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="pagination-btn next"
              >
                다음 →
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default MainPage;
