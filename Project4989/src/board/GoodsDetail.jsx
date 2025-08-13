import axios from 'axios';
import React, { useEffect, useState } from 'react'
import {useLocation } from 'react-router-dom';
import ReportModal from './ReportModal';


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
  const [photos,setPhotos]=useState(null);
  // const photoUrl = "http://localhost:4989/save/";

  const [token, setToken] = useState(() => {
  const t = localStorage.getItem('token');
  return t && t !== 'null' && t !== 'undefined' ? t : null;
});

  useEffect(() => {
    console.log("✅ useEffect 실행됨. postId:", postId);
  if (!postId) return;

  const fetchPostData = axios.get(`http://localhost:4989/post/detail?postId=${postId}`);
  const fetchGoodsData = axios.get(`http://localhost:4989/goods/detail?postId=${postId}`);
  const fetchCarsData = axios.get(`http://localhost:4989/cars/detail?postId=${postId}`);
  const fetchEstateData = axios.get(`http://localhost:4989/estate/detail?postId=${postId}`);

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

useEffect(() => {
  // 다른 탭/창에서 로그인/로그아웃해도 반영
  const onStorage = (e) => {
    if (e.key === 'token') {
      const v = e.newValue;
      setToken(v && v !== 'null' && v !== 'undefined' ? v : null);
    }
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}, []);


const handleSubmitReport = async () => {
    if (!reportContent.trim()) return;
    try {
      setSubmitting(true);
      await axios.post('http://localhost:4989/report', {
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
        <p>거래유형: {post.tradeType}</p>
      <p>상태: {goods.conditions}</p>
      <p>{goods.categoryId === 1
      ? '전자제품'
      : goods.categoryId === 2
      ? '의류'
      : '가구'}</p>
      </>
      )}
      { post.postType === 'CARS'&&(
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
        token ? (
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
        ): (
    // 비로그인 안내 (선택)
    <button onClick={() => alert('로그인 후 이용 가능합니다.')}>신고/문의</button>
  )}
      
      
    </div>
  );
}

export default GoodsDetail