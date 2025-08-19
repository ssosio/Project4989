import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './goods.css';

const Goods = () => {

  const navi=useNavigate('');

  const [postList,setPostList]=useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;


  const list=()=>{
    let url="http://localhost:4989/post/list";

    axios.get(url)
    .then(res=>{
      console.log(res.data);
      setPostList(res.data);
    })
    .catch(err => {
      console.error("에러 발생:", err);
    });
  };

  useEffect(()=>{
    console.log("list");
    list();
  },[])

  useEffect(() => {
    console.log(postList); // mainPhotoUrl 값 확인
  }, [postList]);

  const photoUrl="http://localhost:4989/postphoto/";

  const clickDetail=(postId)=>{
    navi(`/board/GoodsDetail?postId=${postId}`);
  }

  // 현재 페이지의 아이템들 계산
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = postList.filter(p => p.postType === 'ITEMS').slice(startIndex, endIndex);
  const totalPages = Math.ceil(postList.filter(p => p.postType === 'ITEMS').length / itemsPerPage);

  // 디버깅용 콘솔 로그
  console.log('총 아이템 수:', postList.filter(p => p.postType === 'ITEMS').length);
  console.log('페이지당 아이템 수:', itemsPerPage);
  console.log('총 페이지 수:', totalPages);
  console.log('현재 페이지:', currentPage);
  console.log('현재 아이템 수:', currentItems.length);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
  }

  

  return (
    <div className="goods-page">
      <div className="goods-container">
        {/* 헤더 섹션 */}
        <div className="goods-header">
          <h1 className="goods-title">중고물품 목록</h1>
          <p className="goods-subtitle">다양한 중고물품을 찾아보세요</p>
        </div>

        {/* 등록 버튼 */}
        <button 
          type='button' 
          className="goods-register-btn" 
          onClick={()=>{
            navi("/board/post");
          }}
        >
          물품 등록하기
        </button>

        {/* 상품 목록 */}
        {postList.filter(p => p.postType === 'ITEMS').length > 0 ? (
          <>
            <div className="goods-grid">
              {currentItems.map(p => (
                <div key={p.postId} className="goods-card" onClick={()=>clickDetail(p.postId)}>
                  <div className="goods-image">
                    {p.mainPhotoUrl ? (
                      <img 
                        src={photoUrl + p.mainPhotoUrl} 
                        alt={p.title} 
                      />
                    ) : (
                      <div className="goods-image-placeholder">
                        이미지 없음
                      </div>
                    )}
                  </div>
                  <div className="goods-info">
                    <h3 className="goods-title-text">{p.title}</h3>
                    <div className="goods-price">
                      {p.price ? new Intl.NumberFormat().format(p.price) + '원' : '가격 미정'}
                    </div>
                    <div className="goods-member">판매자: {p.nickname}</div>
                    <div>조회수: {p.viewCount}</div>
                    <div>{p.status==='ON_SALE'?'판매중':p.status==='RESERVED'?'예약':'판매완료'}</div>
                    <div className="goods-date">
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            <div className="goods-pagination">
              <div className="goods-page-info">
                총 {postList.filter(p => p.postType === 'ITEMS').length}개 중 {startIndex + 1}-{Math.min(endIndex, postList.filter(p => p.postType === 'ITEMS').length)}개 표시
              </div>
              
              {totalPages > 1 && (
                <>
                  <button 
                    className="goods-page-btn goods-prev-btn"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    이전
                  </button>
                  
                  <div className="goods-page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`goods-page-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    className="goods-page-btn goods-next-btn"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    다음
                  </button>
                </>
              )}
              
              {totalPages <= 1 && (
                <div className="goods-page-single">
                  페이지 1 / 1
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="goods-empty">
            <div className="goods-empty-icon">📦</div>
            <div className="goods-empty-text">등록된 물품이 없습니다</div>
            <button 
              className="goods-empty-btn" 
              onClick={()=>{
                navi("/board/post");
              }}
            >
              첫 번째 물품 등록하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Goods
