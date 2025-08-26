
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './MainPage.css'
import api from '../lib/api'

const MainPage = () => {
  const navigate = useNavigate()
  const [sortType, setSortType] = useState('time') // 'time' 또는 'bidders'
  const [currentPage, setCurrentPage] = useState(1)
  const [auctionItems, setAuctionItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const itemsPerPage = 8 // 한 페이지당 8개 아이템으로 변경

  // API에서 경매 데이터 가져오기
  const fetchAuctionItems = async (sort = 'time') => {
    try {
      setLoading(true)
      const response = await api.get(`/auction?sort=${sort}`)
      setAuctionItems(response.data)
      setError(null)
    } catch (err) {
      console.error('경매 데이터 로딩 실패:', err)
      setError('경매 데이터를 불러오는데 실패했습니다.')
      setAuctionItems([])
    } finally {
      setLoading(false)
    }
  }

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchAuctionItems(sortType)
  }, [sortType])



  const handleSortByTime = () => {
    setSortType('time')
    setCurrentPage(1) // 정렬 변경 시 첫 페이지로 이동
  }

  const handleSortByBidders = () => {
    setSortType('bidders')
    setCurrentPage(1) // 정렬 변경 시 첫 페이지로 이동
  }

  // 입찰하기 버튼 클릭 시 상세페이지로 이동
  const handleBidClick = (postId) => {
    navigate(`/auction/detail/${postId}`)
  }

  const handleNextPage = () => {
    const totalPages = Math.ceil(auctionItems.length / itemsPerPage)
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // 현재 페이지의 아이템들 계산
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = auctionItems.slice(startIndex, endIndex)

  const totalPages = Math.ceil(auctionItems.length / itemsPerPage)

  // 로딩 중이거나 에러가 있을 때 표시
  if (loading) {
    return (
      <div className="main-page">
        <div className="container">
          <div className="main-header">
            <h1 className="main-title">인기 경매 상품</h1>
            <p className="main-subtitle">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="main-page">
        <div className="container">
          <div className="main-header">
            <h1 className="main-title">인기 경매 상품</h1>
            <p className="main-subtitle" style={{color: 'red'}}>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-page">
      <div className="container">
        {/* 헤더 섹션 */}
        <div className="main-header">
          <h1 className="main-title">인기 경매 상품</h1>
          <p className="main-subtitle">지금 가장 인기있는 경매 상품들을 확인해보세요</p>
        </div>

        {/* 정렬 버튼 */}
        <div className="sort-buttons">
          <button
            className={`sort-btn ${sortType === 'time' ? 'active' : ''}`}
            onClick={handleSortByTime}
          >
            종료시간 빠른순
          </button>
          <button
            className={`sort-btn ${sortType === 'bidders' ? 'active' : ''}`}
            onClick={handleSortByBidders}
          >
            입찰자수 많은순
          </button>
        </div>

        {/* 경매 상품 컨테이너 */}
        <div className="auction-container">
          <div className="auction-grid">
            {currentItems.map((item) => (
              <div 
                key={item.postId} 
                className="auction-card"
                onClick={() => handleBidClick(item.postId)}
                style={{ cursor: 'pointer' }}
              >
                <div className="main-auction-image">
                  <img 
                    src={
                      item.image && item.image.trim() !== '' ? 
                        (item.image.startsWith('http') ? 
                          `${item.image}?t=${Date.now()}` : 
                          (item.image.startsWith('/') ? 
                            `http://localhost:4989${item.image}?t=${Date.now()}` : 
                            `http://localhost:4989/save/${item.image}?t=${Date.now()}`
                          )
                        ) :
                      item.mainPhotoUrl && item.mainPhotoUrl.trim() !== '' ? 
                        (item.mainPhotoUrl.startsWith('http') ? 
                          `${item.mainPhotoUrl}?t=${Date.now()}` : 
                          (item.mainPhotoUrl.startsWith('/') ? 
                            `http://localhost:4989${item.mainPhotoUrl}?t=${Date.now()}` : 
                            `http://localhost:4989/save/${item.mainPhotoUrl}?t=${Date.now()}`
                          )
                        ) :
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzQ5OGRiIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+"
                    } 
                    alt={item.title}
                    onError={(e) => {
                      // 무한 루프 방지: 이미 placeholder 이미지인 경우 더 이상 교체하지 않음
                      if (!e.target.src.includes('placeholder.com')) {
                        e.target.src = "https://via.placeholder.com/200x150/3498db/ffffff?text=No+Image";
                        e.target.onerror = null; // onError 이벤트 제거
                      }
                    }}
                    onLoad={(e) => {
                      // 이미지 로드 성공 시 로딩 상태 표시 제거
                      e.target.style.opacity = '1';
                    }}
                    style={{
                      opacity: 0,
                      transition: 'opacity 0.3s ease-in-out'
                    }}
                  />
                  <div className="main-auction-badge">
                    <span className="bidders-count">{item.bidderCount || 0}명</span>
                  </div>
                </div>
                <div className="auction-info">
                  <h3 className="auction-title">{item.title}</h3>
                  <div className="auction-price">
                    <span className="main-current-price">₩{item.price?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="auction-time">
                    <span className="end-time">
                      종료: {item.auctionEndTime ? 
                        new Date(item.auctionEndTime).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '미정'}
                    </span>
                  </div>
                  <button 
                    className="main-bid-button"
                    onClick={(e) => {
                      e.stopPropagation() // 이벤트 전파 방지
                      handleBidClick(item.postId)
                    }}
                  >
                    입찰하기
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 버튼 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="page-btn prev-btn"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                이전
              </button>
              <span className="page-info">
                {currentPage} / {totalPages} (총 {auctionItems.length}개)
              </span>
              <button 
                className="page-btn next-btn"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MainPage