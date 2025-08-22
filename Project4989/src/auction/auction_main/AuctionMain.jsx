import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './auction.css';

const AuctionMain = () => {
  const [auctionList, setAuctionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [winnerNicknames, setWinnerNicknames] = useState({}); // 낙찰자 닉네임 저장
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const [itemsPerPage] = useState(20); // 페이지당 아이템 수
  const [auctionPhotos, setAuctionPhotos] = useState({}); // 경매 사진들
  const [highestBids, setHighestBids] = useState({}); // 최고가 정보
  const [filters, setFilters] = useState({
    ongoing: true,  // 경매중 (기본값: true)
    ended: false    // 경매종료 (기본값: false)
  });
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchAuctionList();
  }, []);

  const fetchAuctionList = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE;
      console.log('API Base:', apiBase);
      const response = await axios.get(`${apiBase}/auction`);
      console.log('경매 데이터:', response.data);
      setAuctionList(response.data);
      
      // 낙찰자 닉네임, 사진, 최고가 가져오기
      const nicknames = {};
      const photos = {};
      const highestBids = {};
      
      for (const auction of response.data) {
        // 낙찰자 닉네임 가져오기
        if (auction.winner_id) {
          try {
            const nicknameResponse = await axios.get(`${import.meta.env.VITE_API_BASE}/auction/member/${auction.winner_id}`);
            nicknames[auction.post_id] = nicknameResponse.data.nickname;
          } catch (err) {
            console.error(`낙찰자 닉네임 조회 실패 (ID: ${auction.winner_id}):`, err);
            nicknames[auction.post_id] = `ID ${auction.winner_id}`;
          }
        }
        
        // 경매 사진 가져오기 (첫 번째 사진만)
        try {
          const photoResponse = await axios.get(`${import.meta.env.VITE_API_BASE}/auction/photos/${auction.post_id}`);
          if (photoResponse.data && photoResponse.data.length > 0) {
            photos[auction.post_id] = photoResponse.data[0].photo_url;
          }
        } catch (err) {
          console.error(`경매 사진 조회 실패 (postId: ${auction.post_id}):`, err);
        }
        
        // 최고가 가져오기
        try {
          const bidResponse = await axios.get(`${import.meta.env.VITE_API_BASE}/auction/highest-bid/${auction.post_id}`);
          if (bidResponse.data && bidResponse.data.bidAmount) {
            highestBids[auction.post_id] = bidResponse.data.bidAmount;
          }
        } catch (err) {
          console.error(`최고가 조회 실패 (postId: ${auction.post_id}):`, err);
        }
      }
      
      setWinnerNicknames(nicknames);
      setAuctionPhotos(photos);
      setHighestBids(highestBids);
      
      setLoading(false);
    } catch (error) {
      console.error('경매 목록 조회 실패:', error);
      setLoading(false);
    }
  };

  // 상세 페이지로 이동하는 함수
  const handleRowClick = (postId) => {
    navigate(`/auction/detail/${postId}`);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'null' || dateString === '') {
      return '-';
    }
    
    try {
      const date = new Date(dateString);
      // 1970년 1월 1일이거나 유효하지 않은 날짜인 경우
      if (date.getTime() === 0 || isNaN(date.getTime())) {
        return '-';
      }
      return date.toLocaleString('ko-KR');
    } catch {
      return '-';
    }
  };

  // 가격 포맷팅 함수
  const formatPrice = (price) => {
    if (!price || price === 0) {
      return '-';
    }
    return `${price.toLocaleString()} 원`;
  };

  // 텍스트 포맷팅 함수
  const formatText = (text) => {
    if (text === null || text === undefined || text === '') {
      return '-';
    }
    return text;
  };

  // 시간 남은 계산 함수
  const getTimeRemaining = (endTime) => {
    if (!endTime) return '시간 미정';
    
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return '경매 종료';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  };

  // 필터링된 경매 목록
  const filteredAuctions = auctionList.filter(post => {
    const isOngoing = new Date(post.auction_end_time) > new Date();
    const isEnded = new Date(post.auction_end_time) <= new Date();
    
    return (filters.ongoing && isOngoing) || (filters.ended && isEnded);
  });

  // 페이지네이션 계산 (필터링된 목록 기준)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAuctions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAuctions.length / itemsPerPage);

  // 페이지 변경 함수
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  // 필터 토글 함수
  const handleFilterToggle = (filterType) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
    setCurrentPage(1); // 필터 변경시 첫 페이지로 이동
  };

  if (loading) {
    return (
      <div className="auction-main-container">
        <h2>경매 리스트</h2>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>로딩 중...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-main-container">
      <div className="auction-header">
        <h2>경매 리스트</h2>
        <div className="auction-count">
          총 {filteredAuctions.length}개의 경매 ({currentPage}/{totalPages} 페이지)
        </div>
      </div>
      
      {/* 필터 버튼들 */}
      <div className="filter-container">
        <button 
          className={`filter-btn ${filters.ongoing ? 'active' : ''}`}
          onClick={() => handleFilterToggle('ongoing')}
        >
          <span className="filter-icon">🔥</span>
          경매중
          {filters.ongoing && <span className="check-mark">✓</span>}
        </button>
        <button 
          className={`filter-btn ${filters.ended ? 'active' : ''}`}
          onClick={() => handleFilterToggle('ended')}
        >
          <span className="filter-icon">🏁</span>
          경매종료
          {filters.ended && <span className="check-mark">✓</span>}
        </button>
      </div>
      
      <div className="auction-grid">
        {currentItems.map(post => (
          <div 
            key={post.post_id}
            className="auction-card"
            onClick={() => handleRowClick(post.post_id)}
          >
            {/* 상품 이미지 */}
            <div className="card-image">
              {auctionPhotos[post.post_id] ? (
                <img 
                  src={`${import.meta.env.VITE_API_BASE}/auction/image/${auctionPhotos[post.post_id]}`}
                  alt={post.title}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="no-image" style={{ display: auctionPhotos[post.post_id] ? 'none' : 'flex' }}>
                <span>📷</span>
                <span>이미지 없음</span>
              </div>
              
              {/* 상태 배지 */}
              <div className="status-badge">
                {post.winner_id ? (
                  <span className="status-completed">낙찰완료</span>
                ) : (
                  new Date(post.auction_end_time) < new Date() ? (
                    <span className="status-failed">유찰</span>
                  ) : (
                    <span className="status-ongoing">경매중</span>
                  )
                )}
              </div>
            </div>
            
            {/* 상품 정보 */}
            <div className="card-content">
              <h3 className="card-title">{post.title}</h3>
              
              <div className="card-price">
                <div className="price-row">
                  <span className="price-label">시작가:</span>
                  <span className="price-value">{formatPrice(post.price)}</span>
                </div>
                <div className="price-row">
                  <span className="price-label">현재 경매가:</span>
                  <span className="price-value current-bid">
                    {highestBids[post.post_id] ? formatPrice(highestBids[post.post_id]) : formatPrice(post.price)}
                  </span>
                </div>
              </div>
              
              <div className="card-bottom">
                <div className="time-info">
                  ⏰ {getTimeRemaining(post.auction_end_time)}
                </div>
                <div className="view-count">
                  👁️ {post.view_count || 0}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            이전
          </button>
          
          {[...Array(totalPages)].map((_, index) => {
            const pageNumber = index + 1;
            const showPage = pageNumber === 1 || 
                           pageNumber === totalPages || 
                           Math.abs(pageNumber - currentPage) <= 2;
            
            if (!showPage) {
              if (pageNumber === currentPage - 3 || pageNumber === currentPage + 3) {
                return <span key={pageNumber} className="pagination-dots">...</span>;
              }
              return null;
            }
            
            return (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`pagination-btn ${currentPage === pageNumber ? 'active' : ''}`}
              >
                {pageNumber}
              </button>
            );
          })}
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
};

export default AuctionMain;