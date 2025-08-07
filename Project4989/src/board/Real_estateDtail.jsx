import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom';

const Real_estateDtail = () => {
  const { search } = useLocation(); // URL의 ?postId=123
  const query = new URLSearchParams(search);
  const postId = query.get("postId");

  const [post, setPost] = useState(null);
  const [estate,setEstate]=useState(null);
  const photoUrl = "http://localhost:4989/save/";

  useEffect(() => {
    console.log("✅ useEffect 실행됨. postId:", postId);
  if (!postId) return;

  const fetchPostData = axios.get(`http://localhost:4989/post/detail?postId=${postId}`);
  const fetchEstateData = axios.get(`http://localhost:4989/estate/detail?postId=${postId}`);

  Promise.all([fetchPostData, fetchEstateData])
    .then(([postRes, estateRes]) => {
      setPost(postRes.data);
      setEstate(estateRes.data);
    })
    .catch(err => {
      console.error("데이터 로딩 중 에러:", err);
    });

}, [postId]);

  if (!post) return <div>로딩 중...</div>;

  return (
    <div>
      <h2>{post.title}</h2>
      <p>작성자: {post.memberId}</p>
      <p>가격: {post.price ? new Intl.NumberFormat().format(post.price) + '원' : '가격 미정'}</p>
      <p>작성일: {post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}</p>
      {post.mainPhotoUrl && (
        <img 
          src={photoUrl + post.mainPhotoUrl} 
          alt={post.title} 
          style={{width:'300px'}}
        />
      )}
      <p>매물종류: {estate.propertyType}</p>
      <p>면적: {estate.area}</p>
      <p>방개수: {estate.rooms}</p>
      <p>층: {estate.floor}</p>
      <p>거래유형: {estate.dealType}</p>
      <div style={{width:'300px',border:'1px solid grey'}}>
        {post.content}
      </div>
    </div>
  );
}

export default Real_estateDtail