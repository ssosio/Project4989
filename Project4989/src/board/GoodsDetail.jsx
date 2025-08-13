import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';

  const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};


const GoodsDetail = () => {
  // const [open, setOpen] = useEffect(false);
  const [open, setOpen]=useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

   const { search } = useLocation(); // URL의 ?postId=123
  const query = new URLSearchParams(search);
  const postId = query.get("postId");

  const [post, setPost] = useState(null);
  const [goods,setGoods]=useState(null);
  const [cars,setCars]=useState(null);
  const [estate,setEstate]=useState(null);
  const photoUrl = "http://localhost:4989/save/";

  const [content,setContent]=useState('');

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
      <p>location: </p>
      {post.mainPhotoUrl && (
        <img 
          src={photoUrl + post.mainPhotoUrl} 
          alt={post.title} 
          style={{width:'300px'}}
        />
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
      <div style={{width:'300px',border:'1px solid grey'}}>
        {post.content}
      </div>
      <button>chat</button>
      <div>
      <Button onClick={handleOpen}>Open modal</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Text in a modal
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            <textarea name="content" id="" style={{width:'330px',height:'150px'}} value={content} onChange={(e)=>{
                        setContent(e.target.value);
                    }}></textarea>
            <button type='submit' className='btn btn-alert'>Send</button>
          </Typography>
        </Box>
      </Modal>
    </div>
    </div>
  );
}

export default GoodsDetail