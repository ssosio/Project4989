import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import { AuthContext } from '../../context/AuthContext';
import './auction.css';

const AuctionDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);
  const [auctionDetail, setAuctionDetail] = useState(null);
  const [highestBid, setHighestBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [bidAmount, setBidAmount] = useState(0);
  const [bidMessage, setBidMessage] = useState('');
  const [bidMessageType, setBidMessageType] = useState('');
  const [authorNickname, setAuthorNickname] = useState('');
  const [winnerNickname, setWinnerNickname] = useState(''); // 낙찰자 닉네임 추가
  const [highestBidderNickname, setHighestBidderNickname] = useState(''); // 최고 입찰자 닉네임 추가
  const [stompClient, setStompClient] = useState(null); // 소켓 클라이언트

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

  // 작성자 닉네임 가져오기
  useEffect(() => {
    if (auctionDetail?.memberId) {
      axios.get(`http://localhost:4989/auction/member/${auctionDetail.memberId}`)
        .then(res => {
          setAuthorNickname(res.data.nickname);
        })
        .catch(err => {
          console.error("작성자 닉네임 조회 실패:", err);
          setAuthorNickname(`ID: ${auctionDetail.memberId}`);
        });
    }
  }, [auctionDetail?.memberId]);

  // 낙찰자 닉네임 가져오기
  useEffect(() => {
    if (auctionDetail?.winnerId) {
      axios.get(`http://localhost:4989/auction/member/${auctionDetail.winnerId}`)
        .then(res => {
          setWinnerNickname(res.data.nickname);
        })
        .catch(err => {
          console.error("낙찰자 닉네임 조회 실패:", err);
          setWinnerNickname(`ID: ${auctionDetail.winnerId}`);
        });
    } else {
      setWinnerNickname('');
    }
  }, [auctionDetail?.winnerId]);

  // 최고 입찰자 닉네임 가져오기
  useEffect(() => {
    if (highestBid?.bidderId) {
      axios.get(`http://localhost:4989/auction/member/${highestBid.bidderId}`)
        .then(res => {
          setHighestBidderNickname(res.data.nickname);
        })
        .catch(err => {
          console.error("최고 입찰자 닉네임 조회 실패:", err);
          setHighestBidderNickname(`ID: ${highestBid.bidderId}`);
        });
    } else {
      setHighestBidderNickname('');
    }
  }, [highestBid?.bidderId]);

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

  // 폴링 제거 - 소켓으로 실시간 업데이트 대체
  // useEffect(() => {
  //   const refreshInterval = setInterval(() => {
  //     // 소켓으로 대체됨
  //   }, 30000);
  //   return () => clearInterval(refreshInterval);
  // }, [postId]);

  // 토스트 메시지 자동 제거 (2초 후)
  useEffect(() => {
    if (bidMessage) {
      const timer = setTimeout(() => {
        setBidMessage('');
        setBidMessageType('');
      }, 2000); // 2초 후 메시지 제거

      return () => clearTimeout(timer);
    }
  }, [bidMessage]);

  // 소켓 연결
  useEffect(() => {
    const client = new Client({
      brokerURL: 'ws://localhost:4989/ws',
      onConnect: () => {
        // 경매 채널 구독
        client.subscribe(`/topic/auction/${postId}`, (message) => {
          const data = JSON.parse(message.body);
          handleSocketMessage(data);
        });
        
        setStompClient(client);
      },
      onDisconnect: () => {
        setStompClient(null);
      },
      onStompError: (error) => {
        console.error('경매 소켓 에러:', error);
      }
    });

    client.activate();

    return () => {
      if (client.connected) {
        client.deactivate();
      }
    };
  }, [postId]);

  // 소켓 메시지 처리
  const handleSocketMessage = (data) => {
    switch(data.type) {
      case 'BID_UPDATE':
        // 실시간 입찰 정보 업데이트
        setHighestBid(data.bid);
        if (data.bidder) {
          setHighestBidderNickname(data.bidder.nickname || `ID: ${data.bidder.id}`);
        }
        setBidMessage(`${data.bidder?.nickname || '누군가'}님이 입찰했습니다!`);
        setBidMessageType('info');
        
        // 경매 정보도 업데이트 (필요시)
        if (data.auctionDetail) {
          setAuctionDetail(data.auctionDetail);
        }
        break;
        
      case 'AUCTION_END':
        // 실시간 경매 종료
        setTimeRemaining('경매 종료');
        setAuctionDetail(prev => ({...prev, status: 'SOLD', winnerId: data.winnerId}));
        if (data.winner) {
          setWinnerNickname(data.winner.nickname || `ID: ${data.winner.id}`);
        }
        setBidMessage('경매가 종료되었습니다!');
        setBidMessageType('success');
        break;
        
      default:
        break;
    }
  };

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
    // 로그인 상태 확인
    if (!userInfo || !userInfo.memberId) {
      setBidMessage('로그인 후 이용해주세요.');
      setBidMessageType('error');
      return;
    }

    if (!bidAmount || bidAmount <= 0) {
      setBidMessage('유효한 입찰 금액을 입력해주세요.');
      setBidMessageType('error');
      
      return;
    }

    // 현재 로그인한 사용자 ID
    const currentUserId = userInfo.memberId;

    // 연속 입찰 방지: 현재 최고 입찰자와 같은 사람이면 입찰 불가
    if (highestBid && highestBid.bidderId === currentUserId) {
      setBidMessage('연속 입찰은 불가능합니다.\n다른 분이 입찰한 후 시도해주세요.');
      setBidMessageType('error');
      return;
    }

    const bidData = {
      postId: parseInt(postId),
      bidderId: currentUserId,
      bidAmount: bidAmount
    };

    try {
      const response = await axios.post('http://localhost:4989/auction/bid', bidData);
      setBidMessage(response.data);
      
      // 메시지 타입 설정
      if (response.data.includes('성공')) {
        setBidMessageType('success');
        setBidAmount(0);
        // 경매 정보 새로고침
        const refreshResponse = await axios.get(`http://localhost:4989/auction/detail/${postId}`);
        setAuctionDetail(refreshResponse.data);
        
        // 최고가 정보 새로고침
        const highestBidResponse = await axios.get(`http://localhost:4989/auction/highest-bid/${postId}`);
        setHighestBid(highestBidResponse.data);
      } else if (response.data.includes('낮습니다')) {
        setBidMessageType('error');
      } else {
        setBidMessageType('error');
      }
    } catch (error) {
      console.error('입찰 실패:', error);
      setBidMessage('입찰에 실패했습니다. 다시 시도해주세요.');
      setBidMessageType('error');
    }
  };

  // 경매 종료 핸들러 (작성자용)
  const handleEndAuction = async () => {
    // 버튼 비활성화 (중복 클릭 방지)
    setBidMessage('경매 종료 처리 중...');
    setBidMessageType('info');
    
    try {
      const response = await axios.post(`http://localhost:4989/auction/end/${postId}`);
      setBidMessage(response.data);
      setBidMessageType('success');
      
      // 경매 정보 새로고침
      const refreshResponse = await axios.get(`http://localhost:4989/auction/detail/${postId}`);
      setAuctionDetail(refreshResponse.data);
      
      // 최고가 정보 새로고침
      const highestBidResponse = await axios.get(`http://localhost:4989/auction/highest-bid/${postId}`);
      setHighestBid(highestBidResponse.data);
      
      // 경매 종료 상태로 변경 (버튼 숨기기 위함)
      setTimeRemaining('경매 종료');
      
      // 낙찰자 정보 설정 (있는 경우)
      if (highestBidResponse.data) {
        try {
          const winnerResponse = await axios.get(`http://localhost:4989/auction/member/${highestBidResponse.data.bidderId}`);
          setWinnerNickname(winnerResponse.data.nickname || `ID: ${highestBidResponse.data.bidderId}`);
        } catch (memberError) {
          console.error('낙찰자 정보 조회 실패:', memberError);
          setWinnerNickname(`ID: ${highestBidResponse.data.bidderId}`);
        }
      }
      
      // 강제 새로고침 (필요시)
      window.location.reload();
      
    } catch (error) {
      console.error('경매 종료 실패:', error);
      console.error('에러 상세:', error.response?.data);
      console.error('에러 상태:', error.response?.status);
      
      if (error.response?.data) {
        setBidMessage(error.response.data);
      } else {
        setBidMessage('경매 종료에 실패했습니다.');
      }
      setBidMessageType('error');
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
                    <span className="meta-value">{authorNickname || `ID: ${auctionDetail.memberId}`}</span>
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
            <div className="timer-title">
              <img src="/clock.png" alt="시계" className="clock-icon" />
              남은 시간 (경매 마감까지)
            </div>
            <div className="timer-display">{timeRemaining}</div>
          </div>
          
          {/* 현재 최고가 섹션 */}
          <div className="current-price-section">
            {/* 경매 이미지 */}
            <div className="auction-image-wrapper">
              <img 
                src="/auction.png" 
                alt="경매 이미지" 
                className="auction-image"
              />
            </div>
            
                                      {/* 현재 최고가/낙찰가 텍스트 - 독립적 관리 */}
             <div className={`current-price-label ${!highestBid ? 'starting-price' : timeRemaining === '경매 종료' ? 'final-price' : ''}`}>
               {!highestBid ? '시작가' : timeRemaining === '경매 종료' ? '낙찰가' : '현재 최고가'}
             </div>

             {/* 가격 텍스트 - 독립적 관리 */}
             <div className={`current-price-value ${!highestBid ? 'starting-price-value' : timeRemaining === '경매 종료' ? 'final-price-value' : ''}`}>
               {formatPrice(getCurrentPrice())}
             </div>
            
                         {/* 현재 최고 입찰자 또는 낙찰자 정보 표시 - 고정 영역 */}
             <div className="price-info-container">
               {highestBid && timeRemaining !== '경매 종료' ? (
                 <div className="highest-bid-info">
                   <small>👑 현재 최고 입찰자: {highestBidderNickname || `ID ${highestBid.bidderId}`}</small>
                   <small>입찰 시간: {formatDate(highestBid.bidTime)}</small>
                 </div>
               ) : timeRemaining === '경매 종료' && auctionDetail?.winnerId ? (
                 <div className="winner-info">
                   <small>🎉 낙찰자: {winnerNickname || `ID ${auctionDetail.winnerId}`}</small>
                   <small>경매가 성공적으로 종료되었습니다!</small>
                 </div>
               ) : (
                 <div className="empty-info-placeholder">
                   경매 정보가 없습니다
                 </div>
               )}
             </div>
            
             {/* 금액 버튼들 */}
             <div className="bid-amount-buttons">
               {timeRemaining !== '경매 종료' ? (
                 <>
                   <button className="amount-btn" onClick={() => handleAmountClick(100)}>+100</button>
                   <button className="amount-btn" onClick={() => handleAmountClick(1000)}>+1,000</button>
                   <button className="amount-btn" onClick={() => handleAmountClick(10000)}>+1만</button>
                   <button className="amount-btn" onClick={() => handleAmountClick(100000)}>+10만</button>
                   <button className="amount-btn" onClick={() => handleAmountClick(1000000)}>+100만</button>
                 </>
               ) : (
                 <div style={{ color: '#8b7355', fontSize: '14px', fontStyle: 'italic' }}>
                   경매가 종료되었습니다
                 </div>
               )}
             </div>
             
             {/* 입찰 입력 및 버튼 */}
             <div className="bid-input-section">
               {timeRemaining !== '경매 종료' ? (
                 <>
                   <input
                     type="text"
                     className="bid-amount-input"
                                      value={bidAmount > 0 ? bidAmount.toLocaleString() : getCurrentPrice().toLocaleString()}
                     onChange={handleBidAmountChange}
                     placeholder="입찰 금액"
                   />
                   <button className="bid-button-small" onClick={handleBidSubmit}>
                     <img src="/pan.png" alt="팬" style={{ width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle' }} />
                     입찰
                   </button>
                 </>
               ) : (
                 <div style={{ color: '#8b7355', fontSize: '14px', fontStyle: 'italic', textAlign: 'center', width: '100%' }}>
                   입찰이 마감되었습니다
                 </div>
               )}
             </div>
            
            {/* 토스트 메시지 영역 */}
            <div className="toast-message-area">
              {bidMessage && (
                <div className={`bid-message ${bidMessageType}`}>
                  {bidMessage}
                </div>
              )}
            </div>
            
            {/* 경매 종료 버튼 영역 (높이 고정) */}
            <div style={{ marginTop: '20px', textAlign: 'center', minHeight: '56px' }}>
              {(() => {
                const condition1 = timeRemaining !== '경매 종료';
                const condition2 = auctionDetail?.status === 'ON_SALE';
                const condition3 = parseInt(userInfo?.memberId) === parseInt(auctionDetail?.memberId);
                const showButton = condition1 && condition2 && condition3;
                

                
                return showButton;
              })() && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEndAuction();
                  }}
                  style={{
                    background: '#f8d7da',
                    color: '#842029',
                    border: '1px solid #f1aeb5',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    zIndex: 9999,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f5c2c7';
                    e.target.style.borderColor = '#e899a1';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f8d7da';
                    e.target.style.borderColor = '#f1aeb5';
                  }}
                >
                  🔚 경매 종료
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;
