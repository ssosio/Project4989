import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './real_estate.css';

const Real_estate = () => {
  const [postList,setPostList]=useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  const navi=useNavigate('');
  
    const list=()=>{
      let url="http://localhost:4989/post/list";
  
      axios.get(url)
      .then(res=>{
  
        console.log("list test:"+res.data);
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

  const photoUrl="http://localhost:4989/save/";

  const clickDetail=(postId)=>{
    navi(`/board/GoodsDetail?postId=${postId}`);
  }

  // 현재 페이지의 아이템들 계산
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = postList.filter(p => p.postType === 'REAL_ESTATES').slice(startIndex, endIndex);
  const totalPages = Math.ceil(postList.filter(p => p.postType === 'REAL_ESTATES').length / itemsPerPage);

  // 디버깅용 콘솔 로그
  console.log('총 아이템 수:', postList.filter(p => p.postType === 'REAL_ESTATES').length);
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
    <div className="real-estate-page">
      <div className="real-estate-container">
        {/* 헤더 섹션 */}
        <div className="real-estate-header">
          <h1 className="real-estate-title">부동산 목록</h1>
          <p className="real-estate-subtitle">다양한 부동산을 찾아보세요</p>
        </div>

        {/* 등록 버튼 */}
        <button 
          type='button' 
          className="real-estate-register-btn" 
          onClick={()=>{
            navi("/board/post");
          }}
        >
          부동산 등록하기
        </button>

        {/* 상품 목록 */}
        {postList.filter(p => p.postType === 'REAL_ESTATES').length > 0 ? (
          <>
            <div className="real-estate-grid">
              {currentItems.map(p => (
                <div key={p.postId} className="real-estate-card" onClick={()=>clickDetail(p.postId)}>
                  <div className="real-estate-image">
                    {p.mainPhotoUrl ? (
                      <img 
                        src={photoUrl + p.mainPhotoUrl} 
                        alt={p.title} 
                      />
                    ) : (
                      <div className="real-estate-image-placeholder">
                        이미지 없음
                      </div>
                    )}
                  </div>
                  <div className="real-estate-info">
                    <h3 className="real-estate-title-text">{p.title}</h3>
                    <div className="real-estate-price">
                      {p.price ? new Intl.NumberFormat().format(p.price) + '원' : '가격 미정'}
                    </div>
                    <div className="real-estate-member">판매자: {p.nickname}</div>
                    <div className="real-estate-date">
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            <div className="real-estate-pagination">
              <div className="real-estate-page-info">
                총 {postList.filter(p => p.postType === 'REAL_ESTATES').length}개 중 {startIndex + 1}-{Math.min(endIndex, postList.filter(p => p.postType === 'REAL_ESTATES').length)}개 표시
              </div>
              
              {totalPages > 1 && (
                <>
                  <button 
                    className="real-estate-page-btn real-estate-prev-btn"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    이전
                  </button>
                  
                  <div className="real-estate-page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`real-estate-page-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    className="real-estate-page-btn real-estate-next-btn"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    다음
                  </button>
                </>
              )}
              
              {totalPages <= 1 && (
                <div className="real-estate-page-single">
                  페이지 1 / 1
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="real-estate-empty">
            <div className="real-estate-empty-icon">🏠</div>
            <div className="real-estate-empty-text">등록된 부동산이 없습니다</div>
            <button 
              className="real-estate-empty-btn" 
              onClick={()=>{
                navi("/board/post");
              }}
            >
              첫 번째 부동산 등록하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Real_estate
