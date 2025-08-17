import axios from 'axios';
import React, { useContext, useEffect, useRef, useState } from 'react'
import {useLocation } from 'react-router-dom';
import ReportModal from './ReportModal';
import { AuthContext } from '../context/AuthContext';


const GoodsDetail = () => {
  const [open, setOpen]=useState(false);
  const [reportContent, setReportContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { search } = useLocation(); // URL의 ?postId=123
  const query = new URLSearchParams(search);
  const postId = query.get("postId");

  const [post, setPost] = useState(null);
  const [goods,setGoods]=useState(null);
  const [cars,setCars]=useState(null);
  const [estate,setEstate]=useState(null);
  const [photos,setPhotos]=useState([]);

  const [count,setCount]=useState(0);
  const [favorited,setFavorited]=useState(false);

 
  // const photoUrl = "http://localhost:4989/save/";

  // JWT 토큰 가져오기
  const { userInfo } = useContext(AuthContext);
 

  useEffect(() => {
    console.log("✅ useEffect 실행됨. postId:", postId);
  if (!postId) return;

  

  const fetchPostData = axios.get(`http://localhost:4989/post/detail?postId=${postId}`);
  const fetchGoodsData = axios.get(`http://localhost:4989/post/detail?postId=${postId}`);
  const fetchCarsData = axios.get(`http://localhost:4989/post/cardetail?postId=${postId}`);
  const fetchEstateData = axios.get(`http://localhost:4989/post/detail?postId=${postId}`);

  Promise.all([fetchPostData, fetchGoodsData,fetchCarsData,fetchEstateData])
    .then(([postRes, goodsRes,carsRes,estateRes]) => {
      setPost(postRes.data);
      setGoods(goodsRes.data);
      setCars(carsRes.data);
      setEstate(estateRes.data);

      // postRes.data.photos가 문자열(JSON)인지 배열인지 확인
      const photoList = Array.isArray(postRes.data.photos)
        ? postRes.data.photos
        : JSON.parse(postRes.data.photos || "[]");
      setPhotos(photoList);
    })
    .catch(err => {
      console.error("데이터 로딩 중 에러:", err);
    });

}, [postId]);


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
      { post.postType === 'ITEMS'&&(
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
      { post.postType === 'CARS'&&(
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
      { post.postType === 'REAL_ESTATES'&&(
        <>
        <p>매물종류: {estate.propertyType ==='apt'?'아파트':estate.propertyType ==='studio'?'오피스텔':estate.propertyType ==='oneroom'?'원룸':'투룸'}</p>
        <p>면적: {estate.area} ㎡</p>
        <p>방 개수: {estate.rooms} 개</p>
        <p>층: {estate.floor} 층</p>
        <p>거래유형: {estate.dealType ==='lease'?'전세':estate.dealType ==='rent'?'월세':estate.dealType ==='leaseAndrent'?'전월세':'매매'}</p>
        </>
      )}
      <div style={{width:'300px'}}>
        {post.content}
      </div>

      

      {/* 신고 모달 추가 */}
      {
        !!userInfo?.memberId && (
          <>
          <div>
          <button type='button'>거래</button>
          </div>
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
        )}
      
      
    </div>
  );
}

export default GoodsDetail