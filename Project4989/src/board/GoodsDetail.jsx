import axios from 'axios';
import React, { useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
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

  const { search } = useLocation();
  const query = new URLSearchParams(search);
  const postId = query.get("postId");

  const [post, setPost] = useState(null);
  const [goods, setGoods] = useState(null);
  const [cars, setCars] = useState(null);
  const [estate, setEstate] = useState(null);
  const [photos, setPhotos] = useState(null);

  // 💡 수정된 useEffect: userInfo 또는 postId가 변경될 때 API를 다시 호출하도록 변경
  useEffect(() => {
    if (!postId) return;

    console.log("✅ useEffect 실행됨. postId:", postId, "현재 userInfo:", userInfo);

    // 토큰이 있으면 헤더에 포함하고, 없으면 빈 객체를 사용합니다.
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    // 모든 API 호출을 Promise.all로 병렬 처리합니다.
    const fetchPostData = axios.get(`http://localhost:4989/post/detail?postId=${postId}`, { headers });
    const fetchGoodsData = axios.get(`http://localhost:4989/goods/detail?postId=${postId}`, { headers });
    const fetchCarsData = axios.get(`http://localhost:4989/cars/detail?postId=${postId}`, { headers });
    const fetchEstateData = axios.get(`http://localhost:4989/estate/detail?postId=${postId}`, { headers });

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

  const handleSubmitReport = async () => {
    if (!reportContent.trim()) return;
    try {
      setSubmitting(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      await axios.post('http://localhost:4989/report', {
        postId,
        content: reportContent.trim(),
      }, { headers });
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
          <p>거래유형: {post.tradeType}</p>
          <p>상태: {goods.conditions}</p>
          <p>{goods.categoryId === 1 ? '전자제품' : goods.categoryId === 2 ? '의류' : '가구'}</p>
        </>
      )}
      {post.postType === 'CARS' && (
        <>
          <p>거래유형: {post.tradeType}</p>
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

      {/* 로그인 상태에 따라 버튼을 렌더링하는 명확한 조건부 로직 */}
      {userInfo ? (
        <>
          {/* 로그인 상태일 때의 버튼들 */}
          <div><button type='button'>거래</button></div>
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
          {/* 로그인 상태일 때만 보이는 '대화' 버튼 */}
          <div><button onClick={handleChatToggle}>대화</button></div>
        </>
      ) : (
        <>
          {/* 비로그인 상태일 때의 버튼들 */}
          <button onClick={() => alert('로그인 후 이용 가능합니다.')}>신고/문의</button>
          <button onClick={() => alert('로그인 후 이용 가능합니다.')}>대화</button>
        </>
      )}

      {/* DetailChat 컴포넌트 렌더링 */}
      {showChat && chatRoom && <DetailChat open={showChat} onClose={handleChatToggle} chatRoom={chatRoom} />}
    </div>
  );
};

export default GoodsDetail;