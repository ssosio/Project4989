import axios from 'axios';
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReportModal from './ReportModal';
import DetailChat from '../chat/DetailChat';
import { AuthContext } from '../context/AuthContext'; // AuthContext import 추가
import BuyerSelectionModal from '../components/BuyerSelectionModal';
import ReviewModal from '../components/ReviewModal';
import './gooddetail.css';

const GoodsDetail = () => {
  // AuthContext에서 userInfo를 가져와 로그인 상태를 확인합니다.
  const { userInfo } = useContext(AuthContext);
  // const token = userInfo?.token; // userInfo가 있으면 토큰을 사용합니다.

  const token =
    userInfo?.token ??
    localStorage.getItem("jwtToken");

  const [open, setOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatRoom, setChatRoom] = useState(null); // 💡 chatRoom 상태 추가

  const location = useLocation();
  const { search } = location;
  const query = new URLSearchParams(search);
  const postId = query.get("postId");

  const [post, setPost] = useState(null);
  const [goods, setGoods] = useState(null);
  const [cars, setCars] = useState(null);
  const [estate, setEstate] = useState(null);
  const [photos, setPhotos] = useState(null);

  const [count, setCount] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const [reportType, setReportType] = useState(''); // '', 'POST', 'MEMBER'
  const [targetId, setTargetId] = useState(null);
  const authorId = post?.memberId;


  const navi = useNavigate();


  // 상단 state 모음 근처에 추가
  const [deleting, setDeleting] = useState(false); // ✅ 삭제 진행 상태
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // ✅ 판매 상태 업데이트 진행 상태
  const [showBuyerModal, setShowBuyerModal] = useState(false); // ✅ 거래자 선택 모달 상태
  
  // 후기 관련 상태
  const [showReviewModal, setShowReviewModal] = useState(false);
  // const [selectedBuyerId, setSelectedBuyerId] = useState(null); // 제거
  const [hasReview, setHasReview] = useState(false);
  const [reviewCompleted, setReviewCompleted] = useState(false); // 추가

  // 💡 수정된 useEffect: userInfo 또는 postId가 변경될 때 API를 다시 호출하도록 변경
  useEffect(() => {
    if (!postId) return;

    // 페이지 로드 시 스크롤을 맨 위로 이동
    window.scrollTo(0, 0);

    console.log("✅ useEffect 실행됨. postId:", postId, "현재 userInfo:", userInfo);

    // 토큰이 있으면 헤더에 포함하고, 없으면 빈 객체를 사용합니다.
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    // 모든 API 호출을 Promise.allSettled로 병렬 처리하여 일부 실패해도 다른 데이터는 로드
    const fetchPostData = axios.get(`http://localhost:4989/post/detail?postId=${postId}`, { headers });
    const fetchGoodsData = axios.get(`http://localhost:4989/post/itemdetail?postId=${postId}`, { headers });
    const fetchCarsData = axios.get(`http://localhost:4989/post/cardetail?postId=${postId}`, { headers });
    const fetchEstateData = axios.get(`http://localhost:4989/post/estatedetail?postId=${postId}`, { headers });

    Promise.allSettled([fetchPostData, fetchGoodsData, fetchCarsData, fetchEstateData])
      .then((results) => {
        const [postResult, goodsResult, carsResult, estateResult] = results;
        
        console.log("✅ API 응답 결과:", {
          post: postResult.status,
          goods: goodsResult.status,
          cars: carsResult.status,
          estate: estateResult.status
        });

        // Post 데이터 처리
        if (postResult.status === 'fulfilled') {
          const postData = postResult.value.data;
          console.log("✅ Post 데이터 로드 성공:", postData);
          
          // buyerId 필드 확인
          console.log("🔍 buyerId 확인:", {
            buyerId: postData.buyerId,
            buyerIdType: typeof postData.buyerId,
            hasBuyerId: 'buyerId' in postData
          });
          
          // post 데이터의 content 필드 확인
          console.log("📝 Post content 확인:", {
            content: postData.content,
            hasContent: !!postData.content,
            contentType: typeof postData.content,
            contentLength: postData.content ? postData.content.length : 0
          });

          setPost(postData);

          // 판매완료 상태인 경우 구매자 정보는 post.buyerId에서 직접 가져옴
          // localStorage 복원 로직 제거

          const photoList = Array.isArray(postData.photos)
            ? postData.photos
            : JSON.parse(postData.photos || "[]");
          setPhotos(photoList);
        } else {
          console.error("❌ Post 데이터 로드 실패:", postResult.reason);
        }

        // Goods 데이터 처리
        if (goodsResult.status === 'fulfilled') {
          setGoods(goodsResult.value.data);
        } else {
          console.error("❌ Goods 데이터 로드 실패:", goodsResult.reason);
        }

        // Cars 데이터 처리
        if (carsResult.status === 'fulfilled') {
          setCars(carsResult.value.data);
        } else {
          console.error("❌ Cars 데이터 로드 실패:", carsResult.reason);
        }

        // Estate 데이터 처리
        if (estateResult.status === 'fulfilled') {
          setEstate(estateResult.value.data);
        } else {
          console.error("❌ Estate 데이터 로드 실패:", estateResult.reason);
        }
      })
      .catch(err => {
        console.error("데이터 로딩 중 에러:", err);
        console.error("에러 상세 정보:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        
        // 에러 발생 시에도 기본 데이터라도 설정
        if (err.response?.data) {
          console.log("에러 응답에서 받은 데이터:", err.response.data);
        }
      });

    // 💡 localStorage 감지 이벤트 리스너는 이제 필요 없습니다.
    // AuthContext가 상태를 관리하므로, context의 변경에 따라 컴포넌트가 재렌더링됩니다.
  }, [postId, userInfo, token]); // 의존성 배열에 userInfo와 token을 추가

  // selectedBuyerId 상태 제거 - post.buyerId를 직접 사용
  // const [selectedBuyerId, setSelectedBuyerId] = useState(null);

  // view count(조회수)
  const incCalledRef = useRef(false);

  useEffect(() => {
    if (!postId) return;
    if (incCalledRef.current) return;   // ✅ 두 번째 실행 차단 (StrictMode/재렌더)
    incCalledRef.current = true;

    axios.post(`http://localhost:4989/post/viewcount?postId=${postId}`)
      .catch(console.error);
  }, [postId]);

  //좋아요갯수
  useEffect(() => {
    axios.get(`http://localhost:4989/post/count?postId=${postId}`)
      .then(({ data }) => setCount(Number(data.count) || 0))
      .catch(err => console.log(err));
  }, [postId]);

  // 내가 좋아요 눌렀는지 (로그인시에만 호출)
  // useEffect(() => {
  //   if (!postId || !userInfo?.memberId) return;
  //   axios
  //     .get(`http://localhost:4989/post/checkfav`, { params: { postId } })
  //     .then(({ data }) => setFavorited(Boolean(data.favorited)))
  //     .catch(() => setFavorited(false));
  // }, [postId, userInfo]);

  // 내가 좋아요 눌렀는지 (로그인시에만 호출)
  useEffect(() => {
    if (!postId || !userInfo?.memberId) return;

    console.group('[checkfav] 요청 시작');
    console.log('postId:', postId, 'memberId:', userInfo.memberId);

    axios.get('http://localhost:4989/post/checkfav', { params: { postId } })
      .then(({ data, status }) => {
        console.log('HTTP status:', status);
        console.log('response data:', data);
        const value = !!data?.favorited;
        console.log('parsed favorited:', value);
        setFavorited(value);
      })
      .catch((err) => {
        console.error('요청 실패:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        setFavorited(false);
      })
      .finally(() => console.groupEnd());
  }, [postId, userInfo]);



  // 후기 관련 함수들
  const handleReviewClick = () => {
    const isSeller = userInfo?.memberId === post?.memberId;
    const reviewerId = userInfo?.memberId;
    const reviewOppositeId = isSeller ? post?.buyerId : post?.memberId;
    
    console.log('후기 버튼 클릭됨:', {
      postId,
      reviewerId,
      reviewOppositeId,
      isSeller,
      postMemberId: post?.memberId,
      userMemberId: userInfo?.memberId,
      buyerId: post?.buyerId
    });
    
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    console.log('후기 작성 완료됨');
    setReviewCompleted(true); // 후기 작성 완료 상태로 설정
    setHasReview(true);
    setShowReviewModal(false);
  };

  const handleReviewModalClose = () => {
    setShowReviewModal(false);
  };

  const canWriteReview = () => {
    const isSeller = userInfo?.memberId === post?.memberId;
    const isBuyer = post?.buyerId === userInfo?.memberId;
    const statusCheck = post?.status === 'SOLD';
    const noReviewCheck = !hasReview;
    const buyerSelectedCheck = post?.buyerId !== null;
    
    console.log('=== canWriteReview 상세 체크 ===');
    console.log('기본 정보:', {
      userInfo: !!userInfo,
      memberId: userInfo?.memberId,
      postMemberId: post?.memberId,
      status: post?.status,
      hasReview,
      buyerId: post?.buyerId,
      buyerIdType: typeof post?.buyerId,
      hasBuyerIdField: 'buyerId' in (post || {})
    });
    
    console.log('조건별 체크:', {
      isSeller,
      isBuyer,
      statusCheck,
      noReviewCheck,
      buyerSelectedCheck
    });
    
    // 판매자 조건 체크 (임시로 selectedBuyerId 체크 제거)
    if (userInfo?.memberId === post?.memberId && post?.status === 'SOLD' && !hasReview) {
      console.log('✅ 판매자 후기 작성 가능');
      return true;
    }
    
    // 구매자 조건 체크
    if (post?.status === 'SOLD' && !hasReview && post?.buyerId === userInfo?.memberId) {
      console.log('✅ 구매자 후기 작성 가능');
      return true;
    }
    
    console.log('❌ 후기 작성 불가능');
    return false;
  };

  //좋아요 토글
  const onToggle = async () => {
    if (!userInfo?.memberId) {
      alert('로그인이 필요합니다.');
      return;
    }
    try {
      const { data } = await axios.post(
        `http://localhost:4989/post/toggle`,
        null,
        { params: { postId } }
      );
      setFavorited(Boolean(data.favorited));
      setCount(Number(data.count) || 0);
    } catch (e) {
      console.error(e);
      alert('잠시 후 다시 시도해주세요.');
    }
  };


  // 게시글 삭제
  const handleDeletePost = async () => {
    if (!postId) return;

    if (!userInfo?.memberId) {
      alert('로그인이 필요합니다.');
      navi('/login', { replace: true, state: { from: location.pathname } });
      return;
    }
    if (userInfo.memberId !== post?.memberId) {
      alert('삭제 권한이 없습니다. 작성자만 삭제할 수 있어요.');
      return;
    }
    if (!window.confirm('정말로 이 게시글을 삭제하시겠어요?')) return;

    setDeleting(true);
    try {
      await axios.delete(`http://localhost:4989/post/${postId}`); // 쿠키 인증이면 헤더 없이 OK
      alert('삭제되었습니다.');
      navi('/goods');
    } catch (e) {
      // 응답 자체가 없을 때 (네트워크/프리플라이트/CORS)
      if (!e.response) {
        console.log('navigator.onLine =', navigator.onLine, 'message =', e.message, 'code =', e.code);
        alert('네트워크/프록시/CORS 문제로 요청이 차단됐습니다. 콘솔 확인!');
        return;
      }
      const { status, data } = e.response;
      console.log('status =', status, 'data =', data);
      if (status === 401) {
        navi('/login', { replace: true, state: { from: location.pathname } });
      } else if (status === 403) {
        alert('작성자만 삭제할 수 있어요.');
      } else if (status === 404) {
        alert('이미 삭제되었거나 존재하지 않는 게시글입니다.');
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } finally {
      setDeleting(false);
    }
  };


  const handleChatToggle = async () => {
    // 채팅창이 이미 열려 있다면, 닫아주는 로직을 실행합니다.
    if (showChat) {
      setShowChat(false);
      // 열린 채팅창을 닫는 것이므로, 여기서 함수를 종료합니다.
      return;
    }

    try {
      const parsedPostId = parseInt(postId, 10);
      // 현재 로그인한 사용자의 ID를 구매자(buyerId)로 설정합니다.
      const buyerId = userInfo.memberId;
      // 게시글을 작성한 사용자의 ID를 판매자(sellerId)로 설정합니다.
      const sellerId = post.memberId;

      // 추가: 구매자와 판매자가 동일한 경우 채팅방 생성을 막습니다.
      if (buyerId === sellerId) {
        alert('자신이 올린 게시글에는 채팅을 시작할 수 없습니다.');
        return;
      }

      // 1. 기존 채팅방이 있는지 확인하는 POST 요청
      const enterResponse = await axios.post(
        'http://localhost:4989/room/enter',
        { productId: parsedPostId, buyerId: buyerId },
        { headers: { 'Authorization': `Bearer ${userInfo.token}` } }
      );

      let chatRoomId = enterResponse.data;

      // 2. 기존 채팅방이 없으면 새로운 채팅방 생성 및 첫 메시지 전송
      if (!chatRoomId) {
        const createResponse = await axios.post(
          'http://localhost:4989/room/create-with-message',
          {
            productId: parsedPostId,
            sellerId: sellerId,
            buyerId: buyerId,
            messageContent: "안녕하세요, 채팅 시작합니다."
          },
          { headers: { 'Authorization': `Bearer ${userInfo.token}` } }
        );
        chatRoomId = createResponse.data;
      }

      // 3. 채팅방 정보 가져오기
      const chatRoomResponse = await axios.get(
        `http://localhost:4989/chat/room?chatRoomId=${chatRoomId}&memberId=${buyerId}`,
        { headers: { 'Authorization': `Bearer ${userInfo.token}` } }
      );

      setChatRoom(chatRoomResponse.data);
      setShowChat(true); // 채팅방 정보가 성공적으로 불러와지면 채팅창을 엽니다.

    } catch (e) {
      console.error("채팅방 처리 중 오류 발생:", e.response?.data || e.message);
      alert('채팅방을 불러오는 데 실패했습니다.');
    }
  };


  // const handleSubmitReport = async () => {
  //     if (!reportReason.trim()) return;
  //     try {
  //       setSubmitting(true);
  //       await axios.post('http://localhost:4989/post/report', {
  //         postId,
  //         reason: reportReason.trim(),
  //       });
  //       alert('보냈습니다!');
  //       setReportReason('');
  //       setOpen(false);
  //     } catch (e) {
  //       console.error(e);
  //       alert('전송 실패');
  //     } finally {
  //       setSubmitting(false);
  //     }

  //   };

  const handleChangeType = (type) => {
    setReportType(type);
    setTargetId(type === 'POST' ? Number(postId) :
      type === 'MEMBER' ? Number(authorId) : null);
    console.log(authorId);
    console.log(postId);
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) return;
    if (!token || token === "null" || token === "undefined") {
      alert("로그인이 필요합니다.");
      return;
    }

    // 선택에 따라 targetId 결정
    // const targetId =
    //   reportType === 'POST'   ? Number(postId) :
    //   reportType === 'MEMBER' ? Number(authorId) :
    //   null;

    if (!targetId) { alert('대상 정보를 찾을 수 없습니다.'); return; }

    try {
      setSubmitting(true);

      const fd = new FormData();
      fd.append('targetType', reportType);          // ✅ 선택값 반영
      if (reportType === "POST") fd.append("targetPostId", targetId);
      if (reportType === "MEMBER") fd.append("targetMemberId", targetId);
      fd.append('reason', reportReason.trim());
      fd.append('status', 'PENDING');

      console.log(reportType);
      console.log(targetId);
      console.log(reportReason);

      await axios.post('http://localhost:4989/post/report', fd, {
        headers: { Authorization: `Bearer ${token}` }, // Content-Type 자동
      });

      alert('보냈습니다!');
      setReportReason('');
      setReportType('');
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data || '전송 실패');
    } finally {
      setSubmitting(false);
    }
  };

  // 탭별 기본 경로 (from이 없을 때용)
  const getFallbackListPath = () => {
    switch (post?.postType) {
      case 'CARS':
        return '/cars';
      case 'REAL_ESTATES':
        return '/real_estate';
      case 'ITEMS':
      default:
        return '/goods';
    }
  };

  // 목록 복귀 핸들러
  const handleGoBackToList = () => {
    const { from, focusId } = location.state || {};
    // 1) 리스트에서 들어온 경우: from(URL에 ?page 포함)으로 되돌리면서 클릭 카드로 포커스
    if (from) {
      navi(from, { state: { focusId: focusId ?? Number(postId) } });
      return;
    }
    // 2) 외부에서 바로 상세로 들어온 경우: 탭 기본 경로로 이동(페이지는 기본 1), 그래도 카드 포커스 시도
    navi(getFallbackListPath(), { state: { focusId: Number(postId) } });
  };

  // 판매 상태 변경 핸들러
  const handleStatusChange = async (newStatus) => {
    if (!userInfo || !post || Number(userInfo.memberId) !== Number(post.memberId)) {
      alert('권한이 없습니다.');
      return;
    }

    if (newStatus === post.status) {
      return; // 같은 상태면 변경하지 않음
    }

    // 판매완료 선택 시 거래자 선택 모달 열기
    if (newStatus === 'SOLD') {
      setShowBuyerModal(true);
      return;
    }

    // 일반 상태 변경 (판매중, 예약중)
    setIsUpdatingStatus(true);
    try {
      const response = await axios.put(
        `http://localhost:4989/post/updateStatus?postId=${postId}&status=${newStatus}`,
        null,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setPost(prev => ({ ...prev, status: newStatus }));
        alert('판매 상태가 변경되었습니다.');
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('판매 상태 변경 실패:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 거래자 선택 완료 핸들러
  const handleBuyerSelectionComplete = (buyerId) => {
    console.log('구매자 선택 완료:', {
      buyerId,
      buyerIdType: typeof buyerId,
      postId
    });
    
    // 상태를 SOLD로 업데이트하고 선택된 구매자 ID 저장
    setPost(prev => ({ ...prev, status: 'SOLD', buyerId: buyerId }));
    
    setShowBuyerModal(false);
    
    console.log('상태 업데이트 완료:', {
      buyerId: buyerId,
      postStatus: 'SOLD'
    });
  };

  // 사진 슬라이드 관련 함수들
  const nextPhoto = () => {
    if (photos && photos.length > 0) {
      setCurrentPhotoIndex((prevIndex) => 
        prevIndex === photos.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevPhoto = () => {
    if (photos && photos.length > 0) {
      setCurrentPhotoIndex((prevIndex) => 
        prevIndex === 0 ? photos.length - 1 : prevIndex - 1
      );
    }
  };

  // const goToPhoto = (index) => {
  //   setCurrentPhotoIndex(index);
  // };



  if (!post) return <div className="loading-container">로딩 중...</div>;

  return (
    <div className="gooddetail-page">
      <div className="gooddetail-container">
        {/* 메인 콘텐츠 영역 - 2단 레이아웃 */}
        <div className="gooddetail-main">
          {/* 왼쪽 이미지 영역 */}
          <div className="gooddetail-gallery">
            <h3 className="gooddetail-gallery-title">사진 목록</h3>
            <div className="gooddetail-slider">
              {photos && photos.length > 0 && photos[currentPhotoIndex]?.photoUrl && photos[currentPhotoIndex].photoUrl !== 'null' ? (
                <>
                  <div className="gooddetail-slider-container">
                    <img
                      src={`http://localhost:4989/postphoto/${photos[currentPhotoIndex].photoUrl}`}
                      alt=""
                      className="gooddetail-slider-photo"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    
                    {/* 이미지 로드 실패 시 표시할 이미지 없음 메시지 */}
                    <div className="gooddetail-no-photos" style={{ display: 'none' }}>
                      <p>등록된 사진이 없습니다</p>
                    </div>
                    
                    {/* 이전 버튼 */}
                    {photos.length > 1 && (
                      <button 
                        className="gooddetail-slider-btn gooddetail-slider-btn-prev"
                        onClick={prevPhoto}
                        aria-label="이전 사진"
                      >
                        ‹
                      </button>
                    )}
                    
                    {/* 다음 버튼 */}
                    {photos.length > 1 && (
                      <button 
                        className="gooddetail-slider-btn gooddetail-slider-btn-next"
                        onClick={nextPhoto}
                        aria-label="다음 사진"
                      >
                        ›
                      </button>
                    )}
                  </div>
                  
                  {/* 사진 인디케이터 */}
                  {/* {photos.length > 1 && (
                    <div className="gooddetail-slider-indicators">
                      {photos.map((_, index) => (
                        <button
                          key={index}
                          className={`gooddetail-slider-indicator ${index === currentPhotoIndex ? 'active' : ''}`}
                          onClick={() => goToPhoto(index)}
                          aria-label={`${index + 1}번째 사진으로 이동`}
                        />
                      ))}
                    </div>
                  )} */}
                  
                  {/* 사진 카운터 */}
                  <div className="gooddetail-slider-counter">
                    {currentPhotoIndex + 1} / {photos.length}
                  </div>
                </>
              ) : (
                <div className="gooddetail-no-photos">
                  <p>등록된 사진이 없습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 상품 정보 영역 */}
          <div className="gooddetail-info-section">
            {/* 상품 헤더 정보 */}
            <div className="gooddetail-header">
              <h1 className="gooddetail-title">{post.title}</h1>
              
              {/* 가격 섹션 */}
              <div className="gooddetail-price">
                <div className="gooddetail-price-value">
                  {post.price ? new Intl.NumberFormat().format(post.price) + '원' : '가격 미정'}
                </div>
              </div>
            </div>

            {/* 상호작용 메트릭스 - 번개장터 스타일 */}
            <div className="gooddetail-metrics">
              <div className="gooddetail-metrics-left">
                <div className="gooddetail-metric-item">
                  <span className="gooddetail-metric-icon">❤️</span>
                  <span>{count}</span>
                </div>
                <div className="gooddetail-metric-item">
                  <span className="gooddetail-metric-icon">👁️</span>
                  <span>{post.viewCount}</span>
                </div>
                <div className="gooddetail-metric-item">
                  <span className="gooddetail-metric-icon">🕐</span>
                  <span>{post.createdAt ? new Date(post.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }) : ''}</span>
                </div>
              </div>
              <div className="gooddetail-metrics-right">
                 {!userInfo || Number(userInfo.memberId) !== Number(post.memberId) && (
                <button className="gooddetail-report-btn" onClick={() => setOpen(true)}>
                신고/문의
              </button>
                )
              }
              </div>
            </div>

            {/* 상품 상태 및 배송 정보 */}
            <div className="gooddetail-product-info">
              <div className="gooddetail-info-row">
                <span className="gooddetail-info-label">상품상태</span>
                <span className="gooddetail-info-value">
                  <span className={`gooddetail-status ${post.status === 'ON_SALE' ? 'on-sale' : post.status === 'RESERVED' ? 'reserved' : 'sold'}`}>
                    {post.status === 'ON_SALE' ? '판매중' : post.status === 'RESERVED' ? '예약중' : '판매완료'}
                  </span>
                </span>
              </div>
              <div className="gooddetail-info-row">
                <span className="gooddetail-info-label">배송비</span>
                <span className="gooddetail-info-value">무료배송</span>
              </div>
            </div>

            {/* 액션 버튼들 - 번개장터 스타일 */}
            <div className="gooddetail-action-buttons">
              <button onClick={onToggle} className="gooddetail-like-btn">
                <span className="like-icon">{favorited ? "❤️" : "🤍"}</span>
                <span>찜 {count}</span>
              </button>
                {/* 대화 버튼: 로그인 상태일 때만 'handleChatToggle' 실행 */}
              {userInfo ? (
                <button className="gooddetail-chat-btn" onClick={handleChatToggle}>
                  대화
                </button>
              ) : (
                // 비로그인 상태일 때
                <button className="gooddetail-chat-btn" onClick={() => alert('로그인 후 이용 가능합니다.')}>
                  대화
                </button>
              )}

          {/* 작성자 본인에게만 보이는 수정/삭제 버튼 */}
          {userInfo && userInfo.memberId === post.memberId && (
            <>
            <button
                type="button"
                className="gooddetail-btn"
                onClick={() => navi(`/board/update?postId=${postId}`)}
              >
                수정
              </button>

              <button
                type="button"
                className="gooddetail-btn danger"
                onClick={handleDeletePost}
                disabled={deleting}
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </>
          )}

          <button 
            className="gooddetail-btn secondary"
            onClick={handleGoBackToList}
          >
            목록
          </button>

                      {/* 작성자 본인만 볼 수 있는 판매 상태 선택 */}
            {userInfo && userInfo.memberId === post.memberId && post.status !== 'SOLD' && (
                <div className="gooddetail-status-selector">
                    <label htmlFor="status-select" className="gooddetail-status-label">
                        판매 상태 변경:
                    </label>
                    <select
                        id="status-select"
                        className="gooddetail-status-select"
                        value={post.status || 'ON_SALE'}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={isUpdatingStatus}
                    >
                        <option value="ON_SALE">판매중</option>
                        <option value="RESERVED">예약중</option>
                        <option value="SOLD">판매완료</option>
                    </select>
                    {isUpdatingStatus && (
                        <span className="gooddetail-status-updating">업데이트 중...</span>
                    )}
                </div>
            )}
            
            {/* 판매완료 상태일 때 후기 버튼 또는 완료 메시지 표시 */}
            {userInfo && post.status === 'SOLD' && (
                <div className="gooddetail-status-completed">
                    {canWriteReview() ? (
                        <button 
                            className="gooddetail-review-btn"
                            onClick={handleReviewClick}
                        >
                            {userInfo.memberId === post.memberId ? '후기를 남겨주세요' : '판매자에게 후기를 남겨주세요'}
                        </button>
                    ) : reviewCompleted ? (
                        <div className="gooddetail-review-completed">
                            후기작성이 완료되었습니다
                        </div>
                    ) : null}
                </div>
            )}
            </div>

            {/* 메타 정보 */}
            <div className="gooddetail-meta">
              <div className="gooddetail-meta-item">
                <strong>작성자:</strong> {post.nickname}
              </div>
              <div className="gooddetail-meta-item">
                <strong>작성일:</strong> {post.createdAt ? new Date(post.createdAt).toLocaleString('ko-KR') : ''}
              </div>
              {/* 수정일 표시 - updatedAt이 있고 createdAt과 다를 때만 표시 */}
              {post.updatedAt && post.updatedAt !== post.createdAt && (
                <div className="gooddetail-meta-item gooddetail-updated-item">
                  <strong>수정일:</strong> {new Date(post.updatedAt).toLocaleString('ko-KR')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 상품 정보와 설명 영역 - 2단 레이아웃 */}
        <div className="gooddetail-detail-section">
          {/* 왼쪽 - 상품 설명 */}
          <div className="gooddetail-content-section">
            <h3 className="gooddetail-content-title">상품설명</h3>
            <div className="gooddetail-content-text">
              {post.content && post.content.trim() ? (
                post.content
              ) : (
                <div style={{ color: '#999', fontStyle: 'italic' }}>
                  상품 설명이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 - 상품 정보 */}
          <div className="gooddetail-info-section-detail">
            <h3 className="gooddetail-info-title">상품정보</h3>
            <div className="gooddetail-info-grid">
              <div className="gooddetail-info-item">
                <div className="gooddetail-info-label">판매유형</div>
                <div className="gooddetail-info-value">
                  {post.tradeType === 'SALE' ? '판매' : post.tradeType === 'AUCTION' ? '경매' : '나눔'}
                </div>
              </div>
              
              {post.postType === 'ITEMS' && goods && (
                <>
                  <div className="gooddetail-info-item">
                    <div className="gooddetail-info-label">상품상태</div>
                    <div className="gooddetail-info-value">
                      {goods.conditions === 'best' ? '상' : goods.conditions === 'good' ? '중' : '하'}
                    </div>
                  </div>
                  <div className="gooddetail-info-item">
                    <div className="gooddetail-info-label">분류</div>
                    <div className="gooddetail-info-value">
                      {goods.categoryId === 1 ? '전자제품' : goods.categoryId === 2 ? '의류' : '가구'}
                    </div>
                  </div>
                </>
              )}
              
              {post.postType === 'CARS' && cars && (
                <>
                  <div className="gooddetail-info-item">
                    <div className="gooddetail-info-label">브랜드</div>
                    <div className="gooddetail-info-value">{cars.brand}</div>
                  </div>
                  <div className="gooddetail-info-item">
                    <div className="gooddetail-info-label">모델</div>
                    <div className="gooddetail-info-value">{cars.model}</div>
                  </div>
                  <div className="gooddetail-info-item">
                    <div className="gooddetail-info-label">연식</div>
                    <div className="gooddetail-info-value">{cars.year}</div>
                  </div>
                  <div className="gooddetail-info-item">
                    <div className="gooddetail-info-label">주행거리</div>
                    <div className="gooddetail-info-value">{cars.mileage}</div>
                  </div>
                  <div className="gooddetail-info-item">
                    <div className="gooddetail-info-label">연료</div>
                    <div className="gooddetail-info-value">{cars.fuelType}</div>
                  </div>
                  <div className="gooddetail-info-item">
                    <div className="gooddetail-info-label">변속기</div>
                    <div className="gooddetail-info-value">{cars.transmission}</div>
                  </div>
                </>
              )}
              
              {post.postType === 'REAL_ESTATES' && estate && (
                <>
                  <div className="gooddetail-info-item">
                    <div className="gooddetail-info-label">매물종류</div>
                    <div className="gooddetail-info-value">
                      {estate.propertyType === 'apt' ? '아파트' : estate.propertyType === 'studio' ? '오피스텔' : estate.propertyType === 'oneroom' ? '원룸' : '투룸'}
                    </div>
                  </div>
                  <div className="gooddetail-info-item">
                    <div className="gooddetail-info-label">면적</div>
                    <div className="gooddetail-info-value">{estate.area} ㎡</div>
                  </div>
                  <div className="gooddetail-info-item">
                    <div className="gooddetail-info-label">방 개수</div>
                    <div className="gooddetail-info-value">{estate.rooms} 개</div>
                  </div>
                  <div className="gooddetail-info-item">
                    <div className="gooddetail-info-label">층</div>
                    <div className="gooddetail-info-value">{estate.floor} 층</div>
                  </div>
                  <div className="gooddetail-info-item">
                    <div className="gooddetail-info-label">거래유형</div>
                    <div className="gooddetail-info-value">
                      {estate.dealType === 'lease' ? '전세' : estate.dealType === 'rent' ? '월세' : estate.dealType === 'leaseAndrent' ? '전월세' : '매매'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>



      

        

        {/* 신고 모달 */}
        <ReportModal
          open={open}
          onClose={() => setOpen(false)}
          reason={reportReason}
          onChangeReason={(e) => setReportReason(e.target.value)}
          reportType={reportType}
          onChangeType={handleChangeType}
          onSubmit={handleSubmitReport}
          submitting={submitting}
        />



              {/* DetailChat 컴포넌트 렌더링 */}
        {showChat && chatRoom && <DetailChat open={showChat} onClose={handleChatToggle} chatRoom={chatRoom} />}
        
        {/* 거래자 선택 모달 */}
        <BuyerSelectionModal
          open={showBuyerModal}
          onClose={() => setShowBuyerModal(false)}
          postId={postId}
          token={token}
          onComplete={handleBuyerSelectionComplete}
        />
        
        {/* 후기 작성 모달 */}
        <ReviewModal
          isOpen={showReviewModal}
          onClose={handleReviewModalClose}
          postId={postId}
          reviewerId={userInfo?.memberId}
          reviewOppositeId={
            userInfo?.memberId === post?.memberId 
              ? post?.buyerId  // 판매자가 작성 시: 구매자 ID
              : post?.memberId   // 구매자가 작성 시: 판매자 ID
          }
          onReviewSubmitted={handleReviewSubmitted}
        />
        </div>
      </div>
    );
  };

export default GoodsDetail;