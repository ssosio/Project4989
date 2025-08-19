import axios from 'axios';
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReportModal from './ReportModal';
import DetailChat from '../chat/detailChat';
import { AuthContext } from '../context/AuthContext'; // AuthContext import 추가

const GoodsDetail = () => {
  // AuthContext에서 userInfo를 가져와 로그인 상태를 확인합니다.
  const { userInfo } = useContext(AuthContext);
  const token = userInfo?.token; // userInfo가 있으면 토큰을 사용합니다.

  const [open, setOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatRoom, setChatRoom] = useState(null); // 💡 chatRoom 상태 추가

  const location=useLocation();
  const { search } = location;
  const query = new URLSearchParams(search);
  const postId = query.get("postId");

  const [post, setPost] = useState(null);
  const [goods, setGoods] = useState(null);
  const [cars, setCars] = useState(null);
  const [estate, setEstate] = useState(null);
  const [photos, setPhotos] = useState(null);

   const [count,setCount]=useState(0);
  const [favorited,setFavorited]=useState(false);


  const navi = useNavigate();
 
  // 상단 state 모음 근처에 추가
  const [deleting, setDeleting] = useState(false); // ✅ 삭제 진행 상태

  // 💡 수정된 useEffect: userInfo 또는 postId가 변경될 때 API를 다시 호출하도록 변경
  useEffect(() => {
    if (!postId) return;

    console.log("✅ useEffect 실행됨. postId:", postId, "현재 userInfo:", userInfo);

    // 토큰이 있으면 헤더에 포함하고, 없으면 빈 객체를 사용합니다.
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    // 모든 API 호출을 Promise.all로 병렬 처리합니다.
    const fetchPostData = axios.get(`http://localhost:4989/post/detail?postId=${postId}`, { headers });
    const fetchGoodsData = axios.get(`http://localhost:4989/post/itemdetail?postId=${postId}`, { headers });
    const fetchCarsData = axios.get(`http://localhost:4989/post/cardetail?postId=${postId}`, { headers });
    const fetchEstateData = axios.get(`http://localhost:4989/post/estatedetail?postId=${postId}`, { headers });

    Promise.all([fetchPostData, fetchGoodsData, fetchCarsData, fetchEstateData])
      .then(([postRes, goodsRes, carsRes, estateRes]) => {
        setPost(postRes.data);
        setGoods(goodsRes.data);
        setCars(carsRes.data);
        setEstate(estateRes.data);

        const photoList = Array.isArray(postRes.data.photos)
          ? postRes.data.photos
          : JSON.parse(postRes.data.photos || "[]");
        setPhotos(photoList);
      })
      .catch(err => {
        console.error("데이터 로딩 중 에러:", err);
      });

    // 💡 localStorage 감지 이벤트 리스너는 이제 필요 없습니다.
    // AuthContext가 상태를 관리하므로, context의 변경에 따라 컴포넌트가 재렌더링됩니다.
  }, [postId, userInfo, token]); // 의존성 배열에 userInfo와 token을 추가

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
  useEffect(()=>{
    axios.get(`http://localhost:4989/post/count?postId=${postId}`)
    .then(({ data }) => setCount(Number(data.count) || 0))
    .catch(err=> console.log(err));
  },[postId]);

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

const handleSubmitReport = async () => {
    if (!reportContent.trim()) return;
    try {
      setSubmitting(true);
      await axios.post('http://localhost:4989/post/report', {
        postId,
        content: reportContent.trim(),
      });
      alert('보냈습니다!');
      setReportContent('');
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert('전송 실패');
    } finally {
      setSubmitting(false);
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


  




  if (!post) return <div>로딩 중...</div>;

  return (
    <div>
      <h2>{post.title}</h2>
      <p>작성자: {post.nickname}</p>
      
      <p>가격: {post.price ? new Intl.NumberFormat().format(post.price) + '원' : '가격 미정'}</p>
      <p>작성일: {post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}</p>
      <p>location: </p>
      <p>조회수: {post.viewCount}</p>
      <p>거래상태 :{post.status==='ON_SALE'?'판매중':post.status==='RESERVED'?'예약':'판매완료'}</p>
      <button onClick={onToggle} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 20 }}>{favorited ? "❤️" : "🤍"}</span>
      <span>{count}</span>
    </button>
      
      <h3>사진 목록</h3>
      {photos.length > 0 ? (
        photos.map(photo => (
          <img
            key={photo.photoId}
            src={`http://localhost:4989/save/${photo.photoUrl}`}
            alt=""
            style={{ width: "150px", marginRight: "8px" }}
          />
        ))
      ) : (
        <p>사진 없음</p>
      )}
      {post.postType === 'ITEMS' && (
        <>
        <p>판매유형: {post.tradeType==='SALE'?'판매':post.tradeType==='AUCTION'?'경매':'나눔'}</p>
      <p>상태: {goods.conditions ==='best'?'상':goods.conditions ==='good'?'중':'하'}</p>
      <p>분류: {goods.categoryId === 1
      ? '전자제품'
      : goods.categoryId === 2
      ? '의류'
      : '가구'}</p>
      </>
      )}
      {post.postType === 'CARS' && (
        <>
          <p>판매유형: {post.tradeType==='SALE'?'판매':post.tradeType==='AUCTION'?'경매':'나눔'}</p>
          <p>브랜드: {cars.brand}</p>
          <p>모델: {cars.model}</p>
          <p>연식: {cars.year}</p>
          <p>주행거리: {cars.mileage}</p>
          <p>연료: {cars.fuelType}</p>
          <p>변속기: {cars.transmission}</p>
        </>
      )}
      {post.postType === 'REAL_ESTATES' && (
        <>
          <p>매물종류: {estate.propertyType === 'apt' ? '아파트' : estate.propertyType === 'studio' ? '오피스텔' : estate.propertyType === 'oneroom' ? '원룸' : '투룸'}</p>
          <p>면적: {estate.area} ㎡</p>
          <p>방 개수: {estate.rooms} 개</p>
          <p>층: {estate.floor} 층</p>
          <p>거래유형: {estate.dealType === 'lease' ? '전세' : estate.dealType === 'rent' ? '월세' : estate.dealType === 'leaseAndrent' ? '전월세' : '매매'}</p>
        </>
      )}
      <div style={{ width: '300px' }}>
        {post.content}
      </div>

      

      {/* 신고 모달 추가 */}
      

      {/* 작성자 본인에게만 보이는 수정 버튼 */}
        {userInfo ? (
          <>
          <div>
            <button
              type="button"
              onClick={() => navi(`/board/update?postId=${postId}`)}  // 라우트는 실제 매칭 경로로
            >
              수정
            </button>

            <button
              type="button"
              onClick={handleDeletePost}
              disabled={deleting}
              style={{ color: 'white', background: '#d23f3f' }}
            >
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
           {/* 로그인 상태일 때만 보이는 '대화' 버튼 */}
          <div><button onClick={handleChatToggle}>대화</button></div>
          
          <div>
          <button onClick={() => setOpen(true)}>신고/문의</button>
        <ReportModal
        open={open}
        onClose={() => setOpen(false)}
        content={reportContent}
        onChange={(e) => setReportContent(e.target.value)}
        onSubmit={handleSubmitReport}
        submitting={submitting}
      />
      </div>
        </>
      ) : (
        <>
          {/* 비로그인 상태일 때의 버튼들 */}
          <button onClick={() => alert('로그인 후 이용 가능합니다.')}>대화</button>
        </>
      )}

      
         
      {/* DetailChat 컴포넌트 렌더링 */}
      {showChat && chatRoom && <DetailChat open={showChat} onClose={handleChatToggle} chatRoom={chatRoom} />}
    </div>
  );
};

export default GoodsDetail;