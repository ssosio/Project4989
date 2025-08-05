import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './auction.css';

const AuctionDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [auctionDetail, setAuctionDetail] = useState(null);
  const [highestBid, setHighestBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [bidAmount, setBidAmount] = useState(0);
  const [bidMessage, setBidMessage] = useState('');

  useEffect(() => {
    // postId를 사용해서 상세 정보를 가져오는 API 호출
    axios.get(`http://localhost:4989/auction/detail/${postId}`)
      .then(res => {
        setAuctionDetail(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ 에러 발생:", err);
        setLoading(false);
      });

    // 최고가 정보 가져오기
    axios.get(`http://localhost:4989/auction/highest-bid/${postId}`)
      .then(res => {
        setHighestBid(res.data);
      })
      .catch(err => {
        console.error("최고가 조회 실패:", err);
        setHighestBid(null);
      });
  }, [postId]);

  // 실시간 타이머 업데이트
  useEffect(() => {
    if (!auctionDetail?.auctionEndTime) {
      setTimeRemaining('마감시간 미정');
      return;
    }

    const updateTimer = () => {
      const endTime = new Date(auctionDetail.auctionEndTime);
      const now = new Date();
      const diff = endTime - now;
      
      if (diff <= 0) {
        setTimeRemaining('경매 종료');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (days > 0) {
        setTimeRemaining(`${days}일 ${hours}시간 ${minutes}분 ${seconds}초`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}시간 ${minutes}분 ${seconds}초`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}분 ${seconds}초`);
      } else {
        setTimeRemaining(`${seconds}초`);
      }
    };

    // 초기 실행
    updateTimer();
    
    // 1초마다 업데이트
    const timer = setInterval(updateTimer, 1000);
    
    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearInterval(timer);
  }, [auctionDetail?.auctionEndTime]);

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'null' || dateString === '') {
      return '-';
    }
    
    try {
      const date = new Date(dateString);
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

  // 금액 버튼 클릭 핸들러
  const handleAmountClick = (amount) => {
    const currentBidAmount = bidAmount > 0 ? bidAmount : getCurrentPrice();
    setBidAmount(currentBidAmount + amount);
  };

  // 직접 입력 핸들러
  const handleBidAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 허용
    setBidAmount(value ? parseInt(value) : 0);
  };

  // 입찰 버튼 클릭 핸들러
  const handleBidSubmit = async () => {
    if (!bidAmount || bidAmount <= 0) {
      setBidMessage('유효한 입찰 금액을 입력해주세요.');
      return;
    }

    // 현재 로그인한 사용자 ID (실제로는 AuthContext에서 가져와야 함)
    const currentUserId = 1; // 임시로 1로 설정

    const bidData = {
      postId: parseInt(postId),
      bidderId: currentUserId,
      bidAmount: bidAmount
    };

    try {
      const response = await axios.post('http://localhost:4989/auction/bid', bidData);
      setBidMessage(response.data);
      
      // 성공 시 입찰 금액 초기화
      if (response.data.includes('성공')) {
        setBidAmount(0);
        // 경매 정보 새로고침
        const refreshResponse = await axios.get(`http://localhost:4989/auction/detail/${postId}`);
        setAuctionDetail(refreshResponse.data);
        
        // 최고가 정보 새로고침
        const highestBidResponse = await axios.get(`http://localhost:4989/auction/highest-bid/${postId}`);
        setHighestBid(highestBidResponse.data);
      }
    } catch (error) {
      console.error('입찰 실패:', error);
      setBidMessage('입찰에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 상태에 따른 배지 클래스 반환
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ON_SALE':
        return 'status-badge status-onsale';
      case 'SOLD':
        return 'status-badge status-sold';
      case 'RESERVED':
        return 'status-badge status-reserved';
      default:
        return 'status-badge status-onsale';
    }
  };

  // 현재 표시할 가격 결정 (최고가가 있으면 최고가, 없으면 시작가)
  const getCurrentPrice = () => {
    if (highestBid && highestBid.bidAmount) {
      return highestBid.bidAmount;
    }
    return auctionDetail?.price || 0;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <h3>로딩 중...</h3>
      </div>
    );
  }

  if (!auctionDetail) {
    return (
      <div className="error-container">
        <h3>경매 정보를 찾을 수 없습니다.</h3>
        <button onClick={() => navigate('/auction')}>목록으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div className="auction-detail-container">
      {/* 메인 콘텐츠 */}
      <div className="detail-content">
        {/* 왼쪽 - 모든 상품 정보 */}
        <div className="product-info-section">
          {/* 제목과 메타 정보 */}
          <div className="product-header">
            <h1 className="product-title">{auctionDetail.title}</h1>
            
            {/* 메타 정보 섹션 */}
            <div className="product-meta-section">
              <div className="meta-row">
                <div className="meta-item author-date">
                  <div>
                    <span className="meta-label">작성자</span>
                    <span className="meta-value">ID: {auctionDetail.memberId}</span>
                  </div>
                  <div>
                    <span className="meta-label">작성일</span>
                    <span className="meta-value">{formatDate(auctionDetail.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="meta-row">
                <div className="meta-item">
                  <div>
                    <span className="meta-label">카테고리</span>
                    <span className="meta-value">경매</span>
                  </div>
                </div>
                <div className="meta-item">
                  <div>
                    <span className="meta-label">상태</span>
                    <span className={getStatusBadgeClass(auctionDetail.status)}>
                      {auctionDetail.status === 'ON_SALE' ? '판매중' : 
                       auctionDetail.status === 'SOLD' ? '판매완료' : 
                       auctionDetail.status === 'RESERVED' ? '예약중' : auctionDetail.status}
                    </span>
                  </div>
                </div>
                <div className="meta-item">
                  <div>
                    <span className="meta-label">조회수</span>
                    <span className="meta-value">
                      <span className="eye-icon">👁️</span>
                      {auctionDetail.viewCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 상품 설명과 이미지를 한 박스 안에 */}
          <div className="product-description-image-section">
                        {/* 상품 설명 */}
            <div className="product-content">
              <h3 className="content-title">상품 설명</h3>
              <div className="price-amount-small">시작가: {formatPrice(auctionDetail.price)}</div>
              <div className="content-text">
                {auctionDetail.content || '상품 설명이 없습니다.'}
              </div>
            </div>
            
            {/* 상품 이미지 */}
            <div className="product-image-container">
              <div className="image-placeholder">
                <span>📷 상품 이미지</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/auction')}
            className="back-button-simple"
          >
            ← 목록으로 돌아가기
          </button>
        </div>

        {/* 오른쪽 - 타이머와 현재 최고가만 */}
        <div className="product-image-section">
          {/* 타이머 섹션 */}
          <div className="timer-section-overlay">
            <div className="timer-title">⏰ 남은 시간 (경매 마감까지)</div>
            <div className="timer-display">{timeRemaining}</div>
          </div>
          
          {/* 현재 최고가 섹션 */}
          <div className="current-price-section">
            <div className="current-price-title">
              {highestBid ? '현재 최고가' : '시작가'}
            </div>
            <div className="current-price-amount">{formatPrice(getCurrentPrice())}</div>
            
            {highestBid && (
              <div className="highest-bid-info">
                <small>최고 입찰자: ID {highestBid.bidderId}</small>
                <small>입찰 시간: {formatDate(highestBid.bidTime)}</small>
              </div>
            )}
            
            {/* 금액 버튼들 */}
            <div className="bid-amount-buttons">
              <button className="amount-btn" onClick={() => handleAmountClick(100)}>+100</button>
              <button className="amount-btn" onClick={() => handleAmountClick(1000)}>+1,000</button>
              <button className="amount-btn" onClick={() => handleAmountClick(10000)}>+1만</button>
              <button className="amount-btn" onClick={() => handleAmountClick(100000)}>+10만</button>
              <button className="amount-btn" onClick={() => handleAmountClick(1000000)}>+100만</button>
            </div>
            
            {/* 입찰 입력 및 버튼 */}
            <div className="bid-input-section">
              <input
                type="text"
                className="bid-amount-input"
                value={bidAmount > 0 ? bidAmount.toLocaleString() : (getCurrentPrice() + 1000).toLocaleString()}
                onChange={handleBidAmountChange}
                placeholder="입찰 금액"
              />
              <button className="bid-button-small" onClick={handleBidSubmit}>
                🎯 입찰
              </button>
            </div>
            
            {/* 입찰 메시지 표시 */}
            {bidMessage && (
              <div className="bid-message">
                {bidMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;
