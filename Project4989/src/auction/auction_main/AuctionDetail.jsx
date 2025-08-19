import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import { AuthContext } from '../../context/AuthContext';
import './auction.css';
import { api } from '../../lib/api';
import PortOnePayment from './PortOnePayment';

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
  const [userCount, setUserCount] = useState(0); // 방 인원수
  // 세션 ID를 localStorage에서 가져오거나 새로 생성
  const [sessionId] = useState(() => {
    let storedSessionId = localStorage.getItem('auctionSessionId');
    if (!storedSessionId) {
      storedSessionId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem('auctionSessionId', storedSessionId);
    }
    return storedSessionId;
  });
  const [isFavorite, setIsFavorite] = useState(false); // 찜 상태
  const [favoriteLoading, setFavoriteLoading] = useState(false); // 찜 로딩 상태
  const [favoriteCount, setFavoriteCount] = useState(0); // 찜 개수
  
  // 사진 슬라이더 관련 state
  const [photos, setPhotos] = useState([]); // 사진 목록
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0); // 현재 사진 인덱스
  const [photoLoading, setPhotoLoading] = useState(false); // 사진 로딩 상태
  
  // 이미지 모달 관련 state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalPhotoIndex, setModalPhotoIndex] = useState(0);
  
  // 삭제 관련 state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // 입찰 기록 관련 state
  const [bidHistory, setBidHistory] = useState([]);
  // 결제 관련 상태
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const SERVER_IP = '192.168.10.138';
  const SERVER_PORT = '4989';
  
  // 시간 차이 계산 함수
  const getTimeAgo = (bidTime) => {
    const now = new Date();
    const bidDate = new Date(bidTime);
    const diffInMinutes = Math.floor((now - bidDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}일 전`;
  };
  
  useEffect(() => {
    // postId를 사용해서 상세 정보를 가져오는 API 호출
    axios.get(`http://192.168.10.138:4989/auction/detail/${postId}`)
      .then(res => {
        setAuctionDetail(res.data);
        setLoading(false);
      })
             .catch(err => {
         console.error("경매 상세 정보 조회 실패:", err);
         setLoading(false);
       });

    // 최고가 정보 가져오기
    axios.get(`http://192.168.10.138:4989/auction/highest-bid/${postId}`)
      .then(res => {
        setHighestBid(res.data);
      })
      .catch(err => {
        console.error("최고가 조회 실패:", err);
        setHighestBid(null);
      });

    // 방 입장 API 호출
    axios.post(`http://192.168.10.138:4989/auction/room/join/${postId}`, {
      sessionId: sessionId
    })
      .then(res => {
        if (res.data.success) {
          setUserCount(res.data.userCount);
        }
      })
      .catch(err => {
        console.error("방 입장 실패:", err);
      });
  
      // 경매 사진 가져오기
    getAuctionPhotos();
    
    // 입찰 기록 가져오기
    getBidHistory();
    
    // 페이지 언로드 시 방 퇴장 처리 (브라우저 탭 닫기, 다른 페이지 이동 등)
    const handleBeforeUnload = () => {
      navigator.sendBeacon(`http://192.168.10.138:4989/auction/room/leave/${postId}/${sessionId}`);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 컴포넌트 언마운트는 새로고침이 아닌 실제 페이지 이동일 때만 방 퇴장
      axios.post(`http://192.168.10.138:4989/auction/room/leave/${postId}`, {
        sessionId: sessionId
      })
        .catch(err => {
          console.error("방 퇴장 실패:", err);
        });
    };
  }, [postId, sessionId, userInfo]);

  // 작성자 닉네임 가져오기
  useEffect(() => {
    if (auctionDetail?.memberId) {
      axios.get(`http://192.168.10.138:4989/auction/member/${auctionDetail.memberId}`)
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
      axios.get(`http://192.168.10.138:4989/auction/member/${auctionDetail.winnerId}`)
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
      axios.get(`http://192.168.10.138:4989/auction/member/${highestBid.bidderId}`)
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

  // 입찰 기록 시간 실시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setBidHistory(prev => [...prev]); // 리렌더링을 위한 state 업데이트
    }, 60000); // 1분마다 업데이트
    
    return () => clearInterval(interval);
  }, []);

  // 방 인원수 주기적 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      axios.get(`http://192.168.10.138:4989/auction/room/count/${postId}`)
        .then(res => {
          if (res.data.success) {
            setUserCount(res.data.userCount);
          }
        })
        .catch(err => {
          console.error("방 인원수 조회 실패:", err);
        });
    }, 10000); // 10초마다 업데이트
    
    return () => clearInterval(interval);
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
      brokerURL: `ws://${SERVER_IP}:${SERVER_PORT}/ws`,
      onConnect: () => {
        
        // 경매 채널 구독
        client.subscribe(`/topic/auction/${postId}`, (message) => {
          const data = JSON.parse(message.body);
          handleSocketMessage(data);
        });
        
        // 소켓 연결 후 방 입장 메시지 전송
        setTimeout(() => {
          if (client.connected) {
            client.publish({
              destination: `/app/auction/room/join/${postId}`,
              body: JSON.stringify({
                sessionId: sessionId,
                userId: String(userInfo?.memberId || 'anonymous'),
                userNickname: userInfo?.nickname || `ID: ${userInfo?.memberId || 'anonymous'}`
              })
            });
          }
        }, 1000); // 1초 후 전송
      },
      onDisconnect: () => {
        // WebSocket 연결 해제
        
      },
      onStompError: (error) => {
        console.error('경매 소켓 에러:', error);
        
      }
    });

    client.activate();

    return () => {
      if (client.connected) {
        // 방 퇴장 메시지 전송
        client.publish({
          destination: `/app/auction/room/leave/${postId}`,
          body: JSON.stringify({
            sessionId: sessionId
          })
        });
        setTimeout(() => {
          client.deactivate();
        }, 500); // 0.5초 후 연결 해제
      }
    };
  }, [postId, sessionId, userInfo]);

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
        
        // 입찰 기록에 새 입찰 추가 (최신 순으로 맨 위에)
        const newBidRecord = {
          id: Date.now(), // 임시 ID
          bidderName: data.bidder?.nickname || `ID: ${data.bidder?.id}`,
          bidAmount: data.bid?.bidAmount || 0,
          bidTime: new Date().toISOString()
        };
        
        setBidHistory(prev => {
          const updated = [newBidRecord, ...prev];
          return updated.slice(0, 5); // 최대 5개만 유지
        });
        
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
        
      case 'USER_COUNT_UPDATE':
        // 실시간 방 인원수 업데이트
        setUserCount(data.userCount);
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
    const newAmount = currentBidAmount + amount;
    
    // 최고가보다 낮은 금액이 되지 않도록 보장
    const currentHighestBid = getCurrentPrice();
    if (newAmount > currentHighestBid) {
      setBidAmount(newAmount);
      setBidMessage(''); // 경고 메시지 제거
    } else {
      setBidMessage(`⚠️ 최소 ${(currentHighestBid + 1).toLocaleString()}원 이상 입력해주세요.`);
      setBidMessageType('warning');
    }
  };

  // 직접 입력 핸들러
  const handleBidAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 허용
    const numValue = value ? parseInt(value) : 0;
    setBidAmount(numValue);
    
    // 최고가보다 낮은 금액 입력 시 실시간 경고 메시지
    const currentHighestBid = getCurrentPrice();
    if (numValue > 0 && numValue <= currentHighestBid) {
      setBidMessage(`⚠️ 현재 최고가(${currentHighestBid.toLocaleString()}원)보다 높은 금액을 입력해주세요.`);
      setBidMessageType('warning');
    } else if (numValue > 0) {
      setBidMessage(''); // 경고 메시지 제거
    }
  };

  // 입찰 버튼 클릭 핸들러
  const handleBidSubmit = async () => {
    // 로그인 상태 확인
    if (!userInfo || !userInfo.memberId) {
      setBidMessage('로그인 후 이용해주세요.');
      setBidMessageType('error');
      return;
    }

    // 현재 로그인한 사용자 ID
    const currentUserId = userInfo.memberId;

    // 게시물 작성자가 자신의 경매에 입찰하는지 확인
    if (auctionDetail && auctionDetail.memberId === currentUserId) {
      setBidMessage('본인 경매에는 참여할 수 없습니다.');
      setBidMessageType('error');
      return;
    }

    if (!bidAmount || bidAmount <= 0) {
      setBidMessage('유효한 입찰 금액을 입력해주세요.');
      setBidMessageType('error');
      return;
    }

    // 최고가보다 낮은 금액으로 입찰하는지 확인
    const currentHighestBid = getCurrentPrice();
    if (bidAmount <= currentHighestBid) {
      setBidMessage(`입찰가가 현재 최고가(${currentHighestBid.toLocaleString()}원)보다 낮거나 같습니다.\n더 높은 금액을 입력해주세요.`);
      setBidMessageType('error');
      return;
    }

    // 연속 입찰 방지: 현재 최고 입찰자와 같은 사람이면 입찰 불가
    if (highestBid && highestBid.bidderId === currentUserId) {
      setBidMessage('연속 입찰은 불가능합니다.\n다른 분이 입찰한 후 시도해주세요.');
      setBidMessageType('error');
      return;
    }

    // 보증금 결제가 필요한지 확인
    try {
      const token = localStorage.getItem('jwtToken');
      console.log('JWT Token:', token);
      console.log('User ID:', currentUserId);
      console.log('Bid Amount:', bidAmount);
      
      const response = await axios.post(`http://192.168.10.138:4989/auction/${postId}/bids`, {
        postId: parseInt(postId),
        bidderId: currentUserId,
        bidAmount: bidAmount
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 402 && response.data.status === 'NEED_GUARANTEE') {
        // 보증금 결제 필요
        const guaranteeAmount = response.data.guaranteeAmount || Math.max(1, Math.round(auctionDetail.price * 0.1));
        setPaymentAmount(guaranteeAmount);
        setShowPaymentModal(true);
        return;
      }

      // 보증금이 이미 납부된 경우 또는 입찰 성공
      setBidMessage(response.data.message || '입찰이 완료되었습니다.');
      setBidMessageType('success');
      setBidAmount(0);
      
      // 경매 정보 새로고침
      const refreshResponse = await axios.get(`http://192.168.10.138:4989/auction/detail/${postId}`);
      setAuctionDetail(refreshResponse.data);
      
      // 최고가 정보 새로고침
      const highestBidResponse = await axios.get(`http://192.168.10.138:4989/auction/highest-bid/${postId}`);
      setHighestBid(highestBidResponse.data);
      
    } catch (error) {
      console.error('입찰 실패:', error);
      if (error.response?.status === 401) {
        setBidMessage('로그인이 필요하거나 인증이 만료되었습니다. 다시 로그인해주세요.');
        setBidMessageType('error');
      } else if (error.response?.status === 402 && error.response?.data?.status === 'NEED_GUARANTEE') {
        // 보증금 결제 필요
        const guaranteeAmount = error.response.data.guaranteeAmount || Math.max(1, Math.round(auctionDetail.price * 0.1));
        setPaymentAmount(guaranteeAmount);
        setShowPaymentModal(true);
      } else {
        setBidMessage('입찰에 실패했습니다. 다시 시도해주세요.');
        setBidMessageType('error');
      }
    }
  };

  // 경매 종료 핸들러 (작성자용)
  const handleEndAuction = async () => {
    // 버튼 비활성화 (중복 클릭 방지)
    setBidMessage('경매 종료 처리 중...');
    setBidMessageType('info');
    
    try {
      const response = await axios.post(`http://192.168.10.138:4989/auction/end/${postId}`);
      setBidMessage(response.data);
      setBidMessageType('success');
      
      // 경매 정보 새로고침
              const refreshResponse = await axios.get(`http://192.168.10.138:4989/auction/detail/${postId}`);
      setAuctionDetail(refreshResponse.data);
      
      // 최고가 정보 새로고침
              const highestBidResponse = await axios.get(`http://192.168.10.138:4989/auction/highest-bid/${postId}`);
      setHighestBid(highestBidResponse.data);
      
      // 경매 종료 상태로 변경 (버튼 숨기기 위함)
      setTimeRemaining('경매 종료');
      
      // 낙찰자 정보 설정 (있는 경우)
      if (highestBidResponse.data) {
        try {
          const winnerResponse = await axios.get(`http://192.168.10.138:4989/auction/member/${highestBidResponse.data.bidderId}`);
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
        return 'detail-status-badge detail-status-onsale';
      case 'SOLD':
        return 'detail-status-badge detail-status-sold';
      case 'RESERVED':
        return 'detail-status-badge detail-status-reserved';
      default:
        return 'detail-status-badge detail-status-onsale';
    }
  };

  // 현재 표시할 가격 결정 (최고가가 있으면 최고가, 없으면 시작가)
  const getCurrentPrice = () => {
    if (highestBid && highestBid.bidAmount) {
      return highestBid.bidAmount;
    }
    return auctionDetail?.price || 0;
  };

  // 찜 상태 확인
  const checkFavoriteStatus = async () => {
    if (!userInfo?.memberId) return;
    
    try {
      const response = await axios.get(`http://192.168.10.138:4989/auction/favorite/check/${postId}/${userInfo.memberId}`);
      if (response.data.success) {
        setIsFavorite(response.data.isFavorite);
      }
    } catch (error) {
      console.error('찜 상태 확인 실패:', error);
    }
  };

  // 찜 토글
  const toggleFavorite = async () => {
    if (!userInfo?.memberId) {
      return;
    }
    
    if (favoriteLoading) return;
    
    setFavoriteLoading(true);
    try {
      const response = await axios.post('http://192.168.10.138:4989/auction/favorite/toggle', {
        memberId: userInfo.memberId,
        postId: parseInt(postId)
      });
      
      if (response.data.success) {
        setIsFavorite(response.data.isFavorite);
        // 찜 개수 업데이트
        getFavoriteCount();
      }
    } catch (error) {
      console.error('찜 토글 실패:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // 찜 개수 조회
  const getFavoriteCount = async () => {
    if (!postId) return;

    try {
      const response = await axios.get(`http://192.168.10.138:4989/auction/favorite/count/${postId}`);
      if (response.data.success) {
        setFavoriteCount(response.data.favoriteCount || 0);
      } else {
        setFavoriteCount(0);
      }
    } catch (error) {
      console.error('찜 개수 조회 실패:', error);
      setFavoriteCount(0);
    }
  };
  
  // 경매 사진 가져오기
  const getAuctionPhotos = async () => {
    if (!postId) return;
    
    setPhotoLoading(true);
    try {
      const response = await axios.get(`http://192.168.10.138:4989/auction/photos/${postId}`);
      setPhotos(response.data || []);
      setCurrentPhotoIndex(0); // 첫 번째 사진부터 시작
    } catch (error) {
      console.error('경매 사진 조회 실패:', error);
      setPhotos([]);
    } finally {
      setPhotoLoading(false);
    }
  };
  
  // 입찰 기록 가져오기 함수
  const getBidHistory = async () => {
    if (!postId) return;
    
    try {
      const response = await axios.get(`http://192.168.10.138:4989/auction/bid-history/${postId}`);
      setBidHistory(response.data || []);
    } catch (error) {
      console.error('입찰 기록 조회 실패:', error);
      setBidHistory([]);
    }
  };
  
  // 사진 네비게이션 함수들
  const prevPhoto = () => {
    setCurrentPhotoIndex(prev => 
      prev === 0 ? photos.length - 1 : prev - 1
    );
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex(prev => 
      prev === photos.length - 1 ? 0 : prev + 1
    );
  };

  const goToPhoto = (index) => {
    setCurrentPhotoIndex(index);
  };

  // 이미지 모달 관련 함수들
  const openImageModal = (index) => {
    setModalPhotoIndex(index);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
  };

  const prevModalPhoto = () => {
    setModalPhotoIndex(prev => 
      prev === 0 ? photos.length - 1 : prev - 1
    );
  };

  const nextModalPhoto = () => {
    setModalPhotoIndex(prev => 
      prev === photos.length - 1 ? 0 : prev + 1
    );
  };

  // 경매 삭제 핸들러 - 비밀번호 확인 모달 표시
  const handleDeleteAuction = () => {
    setShowPasswordModal(true);
  };

  // 비밀번호 확인 후 삭제 처리
  const handleDeleteWithPassword = async () => {
    if (!password.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.delete(`http://192.168.10.138:4989/auction/delete/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: { password }
      });
      
      if (response.status === 200) {
        alert('경매가 삭제되었습니다.');
        navigate('/auction'); // 경매 목록으로 이동
      }
    } catch (error) {
      console.error('경매 삭제 실패:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('경매 삭제에 실패했습니다.');
      }
    } finally {
      setDeleteLoading(false);
      setShowPasswordModal(false);
      setPassword('');
    }
  };

  // 결제 완료 후 처리
  const handlePaymentComplete = async () => {
    setShowPaymentModal(false);
    setIsProcessingPayment(false);
    
    // 결제 완료 후 다시 입찰 시도
    try {
      const response = await axios.post(`http://192.168.10.138:4989/auction/${postId}/bids`, {
        postId: parseInt(postId),
        bidderId: userInfo.memberId,
        bidAmount: bidAmount
      });

      setBidMessage('보증금 결제가 완료되었고, 입찰이 성공했습니다!');
      setBidMessageType('success');
      setBidAmount(0);
      
      // 경매 정보 새로고침
      const refreshResponse = await axios.get(`http://192.168.10.138:4989/auction/detail/${postId}`);
      setAuctionDetail(refreshResponse.data);
      
      // 최고가 정보 새로고침
      const highestBidResponse = await axios.get(`http://192.168.10.138:4989/auction/highest-bid/${postId}`);
      setHighestBid(highestBidResponse.data);
      
    } catch (error) {
      console.error('입찰 실패:', error);
      setBidMessage('보증금은 결제되었지만 입찰에 실패했습니다. 다시 시도해주세요.');
      setBidMessageType('error');
    }
  };

  // 결제 취소 처리
  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setIsProcessingPayment(false);
    setBidMessage('보증금 결제가 취소되었습니다.');
    setBidMessageType('info');
  };

  // 공유 기능 추가
  const shareToSocial = () => {
    const shareData = {
      title: auctionDetail?.title || '경매 상품',
      text: `현재 ${userCount}명이 입찰 중! 최고가: ${highestBid?.bidAmount || auctionDetail?.price || 0}원`,
      url: `http://localhost:5173/auction/detail/${postId}`
    };

    if (navigator.share) {
      // 모바일에서 네이티브 공유 메뉴
      navigator.share(shareData)
        .then(() => {
          // 공유 성공
        })
        .catch(() => {
          // 공유 취소 또는 실패
        });
    } else {
      // 데스크톱에서는 클립보드 복사
      const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
      navigator.clipboard.writeText(shareText)
        .then(() => {
          alert('링크가 클립보드에 복사되었습니다!');
        })
        .catch(() => {
          // 클립보드 API가 지원되지 않는 경우
          const textArea = document.createElement('textarea');
          textArea.value = shareText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('링크가 클립보드에 복사되었습니다!');
        });
    }
  };

  // 컴포넌트 마운트 시 찜 상태 확인
  useEffect(() => {
    if (userInfo?.memberId && postId) {
      checkFavoriteStatus();
      getFavoriteCount(); // 컴포넌트 마운트 시 찜 개수 조회
    }
  }, [userInfo?.memberId, postId]);

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
            <div className="title-heart-container">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 className="product-title">{auctionDetail.title}</h1>
                
                {/* 삭제 버튼 (작성자만 표시) - 제목 오른쪽에 배치 */}
                {userInfo?.memberId === auctionDetail?.memberId && (
                  <button 
                    onClick={handleDeleteAuction}
                    className="delete-btn"
                    title="경매 삭제"
                                         style={{
                       background: '#ffb3b3',
                       color: '#8b0000',
                       border: 'none',
                       padding: '6px 12px',
                       borderRadius: '4px',
                       cursor: 'pointer',
                       fontSize: '12px',
                       fontWeight: '500',
                       transition: 'all 0.2s ease',
                       marginLeft: '15px'
                     }}
                     onMouseEnter={(e) => {
                       e.target.style.background = '#ff9999';
                       e.target.style.transform = 'scale(1.05)';
                     }}
                     onMouseLeave={(e) => {
                       e.target.style.background = '#ffb3b3';
                       e.target.style.transform = 'scale(1)';
                     }}
                   >
                     삭제
                   </button>
                )}
              </div>
              
              <div className="heart-favorite-container">

                  
                  {/* 찜과 공유 버튼을 한 줄에 배치 */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {/* 찜 하트 버튼 */}
                    <button 
                      onClick={toggleFavorite}
                      disabled={favoriteLoading}
                      className={`favorite-heart-btn ${isFavorite ? 'favorited' : ''}`}
                      title={isFavorite ? '찜 해제' : '찜 추가'}
                    >
                      {isFavorite ? '❤️' : '🤍'}
                    </button>
                    <span className="favorite-count-text">찜: {favoriteCount}개</span>
                   
                    {/* 공유 버튼 */}
                    <button 
                      onClick={shareToSocial}
                      className="share-btn"
                      title="경매 공유하기"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        marginLeft: '10px',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <img 
                        src="/공유.png" 
                        alt="공유" 
                        style={{ 
                          width: '24px', 
                          height: '24px',
                          filter: 'brightness(0.8)',
                          transition: 'filter 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.filter = 'brightness(1)'}
                        onMouseLeave={(e) => e.target.style.filter = 'brightness(0.8)'}
                      />
                    </button>
                  </div>
                  

                </div>
            </div>
            
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
                      {auctionDetail.status === 'ON_SALE' ? '경매중' : 
                       auctionDetail.status === 'SOLD' ? '낙찰완료' : 
                       auctionDetail.status === 'RESERVED' ? '예약중' : 
                       auctionDetail.status || '상태미정'}
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
            
            {/* 상품 이미지 슬라이더 */}
            <div className="product-image-container">
              {photoLoading ? (
                <div className="image-loading">
                  <span>🔄 사진 로딩 중...</span>
                </div>
              ) : photos.length > 0 ? (
                <div className="photo-slider">
                  {/* 메인 이미지 */}
                  <div className="main-photo-container">
                    <img 
                      src={`http://localhost:4989/auction/image/${photos[currentPhotoIndex]?.photo_url}`}
                      alt={`상품 이미지 ${currentPhotoIndex + 1}`}
                      className="main-photo clickable"
                      onClick={() => openImageModal(currentPhotoIndex)}
                      title="클릭하여 크게 보기"
                    />
                    
                    {/* 사진이 2장 이상일 때만 화살표 버튼 표시 */}
                    {photos.length > 1 && (
                      <>
                        <button 
                          className="photo-nav-btn prev-btn" 
                          onClick={prevPhoto}
                          title="이전 사진"
                        >
                        </button>
                        <button 
                          className="photo-nav-btn next-btn" 
                          onClick={nextPhoto}
                          title="다음 사진"
                        >
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* 썸네일 네비게이션 (사진이 2장 이상일 때만) */}
                  {photos.length > 1 && (
                    <div className="photo-thumbnails">
                      {photos.map((photo, index) => (
                        <button
                          key={photo.photo_id}
                          className={`thumbnail-btn ${index === currentPhotoIndex ? 'active' : ''}`}
                          onClick={() => goToPhoto(index)}
                          title={`사진 ${index + 1}`}
                        >
                          <img 
                            src={`http://localhost:4989/auction/image/${photo.photo_url}`}
                            alt=""
                            className="thumbnail-img clickable"
                            onClick={(e) => {
                              e.stopPropagation();
                              openImageModal(index);
                            }}
                            title="클릭하여 크게 보기"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="image-placeholder">
                  <span>📷 상품 이미지가 없습니다</span>
                </div>
              )}
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
``              남은 시간 (경매 마감까지)
            </div>
            <div className="timer-display">{timeRemaining}</div>
          </div>
          
          {/* 방 인원수 표시 */}
          <div className="room-user-count-section">
            <div className="user-count-title">
              <span className="user-icon">👥</span>
              현재 방 인원
            </div>
            <div className="user-count-display">
              <span className="user-count-number">{userCount}</span>
              <span className="user-count-unit">명</span>
            </div>
          </div>
          
          {/* 현재 최고가 섹션 */}
          <div className="current-price-section">
            <div className="price-bid-container">
              {/* 왼쪽: 가격 정보 */}
              <div className="price-info-left">
                {/* 현재 최고가/낙찰가 텍스트 */}
                <div className={`current-price-label ${!highestBid ? 'starting-price' : timeRemaining === '경매 종료' ? 'final-price' : ''}`}>
                  {!highestBid ? '시작가' : timeRemaining === '경매 종료' ? '낙찰가' : '현재 최고가'}
                </div>

                {/* 가격 텍스트 */}
                <div className={`current-price-value ${!highestBid ? 'starting-price-value' : timeRemaining === '경매 종료' ? 'final-price-value' : ''}`}>
                  {formatPrice(getCurrentPrice())}
                </div>
              </div>

              {/* 오른쪽: 최근 입찰 기록 */}
              <div className="bid-history-right">
                <div className="bid-history-title">
                  {timeRemaining === '경매 종료' ? '최종 입찰 기록' : '최근 입찰 기록'}
                </div>
                
                {/* 최고 입찰자 정보 - 폭죽 아이콘과 함께 */}
                {highestBid && timeRemaining !== '경매 종료' ? (
                  <div style={{ marginBottom: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#d4a574', marginBottom: '3px' }}>
                      🎉 최고 입찰자: {highestBidderNickname || `ID ${highestBid.bidderId}`} 🎉
                    </div>
                    <div style={{ fontSize: '14px', color: '#8b7355' }}>
                      입찰 시간: {formatDate(highestBid.bidTime)}
                    </div>
                  </div>
                ) : timeRemaining === '경매 종료' && auctionDetail?.winnerId ? (
                  <div style={{ marginBottom: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#d4a574', marginBottom: '3px' }}>
                      🎉 낙찰자: {winnerNickname || `ID ${auctionDetail.winnerId}`} 🎉
                    </div>
                    <div style={{ fontSize: '14px', color: '#8b7355' }}>
                      경매가 성공적으로 종료되었습니다!
                    </div>
                  </div>
                ) : timeRemaining === '경매 종료' && !auctionDetail?.winnerId ? (
                  <div style={{ marginBottom: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e74c3c', marginBottom: '3px' }}>
                      유찰
                    </div>
                    <div style={{ fontSize: '14px', color: '#8b7355' }}>
                      입찰자가 없어 경매가 유찰되었습니다.
                    </div>
                  </div>
                ) : null}

                <div className="bid-history-list">
                  {bidHistory.length > 0 ? (
                    bidHistory.map((bid) => (
                      <div key={bid.id} className="bid-history-item">
                        <span className="bidder-name">{bid.bidderName}</span>
                        <span className="bid-amount">{formatPrice(bid.bidAmount)}</span>
                        <span className="bid-time">{getTimeAgo(bid.bidTime)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-bid-history">
                      <span style={{ color: '#6c757d', fontStyle: 'italic' }}>
                        아직 입찰 기록이 없습니다
                      </span>
                    </div>
                  )}
                </div>
              </div>
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
      
      {/* 이미지 모달 */}
      {imageModalOpen && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeImageModal}>
              ✕
            </button>
            
            <div className="modal-image-container">
              <img 
                src={`http://localhost:4989/auction/image/${photos[modalPhotoIndex]?.photo_url}`}
                alt={`상품 이미지 ${modalPhotoIndex + 1}`}
                className="modal-image"
              />
              
              {/* 모달 내 네비게이션 버튼 */}
              {photos.length > 1 && (
                <>
                  <button 
                    className="modal-nav-btn modal-prev-btn" 
                    onClick={prevModalPhoto}
                    title="이전 사진"
                  >
                  </button>
                  <button 
                    className="modal-nav-btn modal-next-btn" 
                    onClick={nextModalPhoto}
                    title="다음 사진"
                  >
                  </button>
                </>
              )}
            </div>
            
            {/* 모달 하단 썸네일 */}
            {photos.length > 1 && (
              <div className="modal-thumbnails">
                {photos.map((photo, index) => (
                  <button
                    key={photo.photo_id}
                    className={`modal-thumbnail-btn ${index === modalPhotoIndex ? 'active' : ''}`}
                    onClick={() => setModalPhotoIndex(index)}
                    title={`사진 ${index + 1}`}
                  >
                    <img 
                      src={`http://localhost:4989/auction/image/${photo.photo_url}`}
                      alt=""
                      className="modal-thumbnail-img"
                    />
                  </button>
                ))}
              </div>
            )}
            
            {/* 이미지 정보 */}
            <div className="modal-image-info">
              {modalPhotoIndex + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}
      
      {/* 비밀번호 확인 모달 */}
      {showPasswordModal && (
        <div className="password-modal-overlay">
          <div className="password-modal">
            <h3>비밀번호 확인</h3>
            <p>경매를 삭제하려면 비밀번호를 입력하세요.</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="password-input"
            />
            <div className="modal-buttons">
              <button onClick={() => setShowPasswordModal(false)}>취소</button>
              <button onClick={handleDeleteWithPassword} disabled={deleteLoading}>
                {deleteLoading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 보증금 결제 모달 */}
      {showPaymentModal && (
        <div className="payment-modal">
          <div className="payment-modal-content">
            <h2>보증금 결제</h2>
            <p>경매 참여를 위해 시작가의 10% 보증금을 결제해주세요.</p>
            <div className="payment-details">
              <p><strong>경매 제목:</strong> {auctionDetail?.title}</p>
              <p><strong>시작가:</strong> {auctionDetail?.price?.toLocaleString()}원</p>
              <p><strong>보증금:</strong> {paymentAmount.toLocaleString()}원</p>
              <p><strong>결제 수단:</strong> KG이니시스 (카드)</p>
              <p><strong>입찰 금액:</strong> {bidAmount.toLocaleString()}원</p>
            </div>
            <div className="payment-modal-buttons">
              <button 
                className="confirm-btn"
                onClick={() => {
                  setIsProcessingPayment(true);
                  setShowPaymentModal(false);
                }}
              >
                결제 진행
              </button>
              <button 
                className="cancel-btn"
                onClick={handlePaymentCancel}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 포트원 결제 컴포넌트 */}
      {isProcessingPayment && (
        <PortOnePayment
          postId={parseInt(postId)}
          memberId={userInfo?.memberId}
          amount={paymentAmount}
          onPaymentComplete={handlePaymentComplete}
          onPaymentCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
};

export default AuctionDetail;