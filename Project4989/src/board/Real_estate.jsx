import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './real_estate.css';

const Real_estate = () => {
  const navi = useNavigate('');
  const location = useLocation();

  const [postList, setPostList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const page = Number(q.get('page')) || 1;
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, [location.search]);

  const list = () => {
    axios.get('http://localhost:4989/post/list')
      .then(res => setPostList(res.data))
      .catch(err => console.error('에러 발생:', err));
  };
  useEffect(() => { list(); }, []);

  const estates = useMemo(() => postList.filter(p => p.postType === 'REAL_ESTATES'), [postList]);
  const totalPages = useMemo(() => Math.ceil(estates.length / itemsPerPage), [estates, itemsPerPage]);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = useMemo(() => estates.slice(startIndex, startIndex + itemsPerPage), [estates, startIndex, itemsPerPage]);

  const handlePageChange = (page) => {
    const q = new URLSearchParams(location.search);
    q.set('page', page);
    navi(`${location.pathname}?${q.toString()}`, { replace: true });
  };
  const handleNextPage = () => { if (currentPage < totalPages) handlePageChange(currentPage + 1); };
  const handlePrevPage = () => { if (currentPage > 1) handlePageChange(currentPage - 1); };

  // 상세에서 돌아왔을 때 클릭한 카드로 스크롤
  useEffect(() => {
    const focusId = location.state?.focusId;
    if (!focusId) return;

    const timer = setTimeout(() => {
      const el = document.getElementById(`post-${focusId}`);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'auto' });
        el.classList.add('focused-card');
        setTimeout(() => el.classList.remove('focused-card'), 700);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [postList, currentPage, location.state]);

  const photoUrl = "http://localhost:4989/postphoto/";
  const fromUrl = `${location.pathname}${location.search || ''}`;

  return (
    <div className="real-estate-page">
      <div className="real-estate-container">
        <div className="real-estate-header">
          <h1 className="real-estate-title">부동산 목록</h1>
          <p className="real-estate-subtitle">다양한 부동산을 찾아보세요</p>
        </div>

        <button type='button' className="real-estate-register-btn" onClick={() => navi("/board/post")}>
          부동산 등록하기
        </button>

        {estates.length > 0 ? (
          <>
            <div className="real-estate-grid">
              {currentItems.map(p => (
                <div
                  id={`post-${p.postId}`}
                  key={p.postId}
                  className="real-estate-card"
                  onClick={() =>
                    navi(`/board/GoodsDetail?postId=${p.postId}`, {
                      state: { from: fromUrl, page: currentPage, focusId: p.postId }
                    })
                  }
                >
                  <div className="real-estate-image">
                    {p.mainPhotoUrl ? (
                      <img loading="lazy" src={photoUrl + p.mainPhotoUrl} alt={p.title} />
                    ) : (
                      <div className="real-estate-image-placeholder">이미지 없음</div>
                    )}
                  </div>
                  <div className="real-estate-info">
                    <h3 className="real-estate-title-text">{p.title}</h3>
                    <div className="real-estate-price">
                      {p.price ? new Intl.NumberFormat().format(p.price) + '원' : '가격 미정'}
                    </div>
                    <div className="real-estate-member">판매자: {p.nickname}</div>
                    <div>조회수: {p.viewCount}</div>
                    <div>{p.status === 'ON_SALE' ? '판매중' : p.status === 'RESERVED' ? '예약' : '판매완료'}</div>
                    <div className="real-estate-date">{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="real-estate-pagination">
              <div className="real-estate-page-info">
                총 {estates.length}개 중 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, estates.length)}개 표시
              </div>

              {totalPages > 1 ? (
                <>
                  <button className="real-estate-page-btn real-estate-prev-btn" onClick={handlePrevPage} disabled={currentPage === 1}>이전</button>
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
                  <button className="real-estate-page-btn real-estate-next-btn" onClick={handleNextPage} disabled={currentPage === totalPages}>다음</button>
                </>
              ) : (
                <div className="real-estate-page-single">페이지 1 / 1</div>
              )}
            </div>
          </>
        ) : (
          <div className="real-estate-empty">
            <div className="real-estate-empty-icon">🏠</div>
            <div className="real-estate-empty-text">등록된 부동산이 없습니다</div>
            <button className="real-estate-empty-btn" onClick={() => navi("/board/post")}>
              첫 번째 부동산 등록하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Real_estate;
