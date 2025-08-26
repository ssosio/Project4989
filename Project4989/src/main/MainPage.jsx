
import React, { useState } from 'react'
import './MainPage.css'

const MainPage = () => {
  const [sortType, setSortType] = useState('time') // 'time' 또는 'bidders'
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // 경매 물품 데이터 (10개)
  const auctionItems = [
    {
      id: 1,
      title: "애플 맥북 프로 13인치",
      currentPrice: 1200000,
      endTime: "2024-01-15 18:00",
      bidders: 8,
      image: "https://via.placeholder.com/200x150/3498db/ffffff?text=MacBook"
    },
    {
      id: 2,
      title: "삼성 갤럭시 S23 울트라",
      currentPrice: 850000,
      endTime: "2024-01-14 20:30",
      bidders: 12,
      image: "https://via.placeholder.com/200x150/e74c3c/ffffff?text=Galaxy"
    },
    {
      id: 3,
      title: "니케 에어포스 1",
      currentPrice: 180000,
      endTime: "2024-01-16 15:00",
      bidders: 15,
      image: "https://via.placeholder.com/200x150/2ecc71/ffffff?text=Nike"
    },
    {
      id: 4,
      title: "소니 WH-1000XM4",
      currentPrice: 280000,
      endTime: "2024-01-13 22:00",
      bidders: 6,
      image: "https://via.placeholder.com/200x150/9b59b6/ffffff?text=Sony"
    },
    {
      id: 5,
      title: "아이패드 프로 11인치",
      currentPrice: 950000,
      endTime: "2024-01-17 19:30",
      bidders: 9,
      image: "https://via.placeholder.com/200x150/f39c12/ffffff?text=iPad"
    },
    {
      id: 6,
      title: "캐논 EOS R6",
      currentPrice: 2100000,
      endTime: "2024-01-15 16:45",
      bidders: 11,
      image: "https://via.placeholder.com/200x150/34495e/ffffff?text=Canon"
    },
    {
      id: 7,
      title: "플레이스테이션 5",
      currentPrice: 650000,
      endTime: "2024-01-18 21:00",
      bidders: 18,
      image: "https://via.placeholder.com/200x150/e67e22/ffffff?text=PS5"
    },
    {
      id: 8,
      title: "다이슨 V15",
      currentPrice: 420000,
      endTime: "2024-01-14 17:15",
      bidders: 7,
      image: "https://via.placeholder.com/200x150/1abc9c/ffffff?text=Dyson"
    },
    {
      id: 9,
      title: "로지텍 MX 마스터 3",
      currentPrice: 120000,
      endTime: "2024-01-16 14:20",
      bidders: 5,
      image: "https://via.placeholder.com/200x150/95a5a6/ffffff?text=Logitech"
    },
    {
      id: 10,
      title: "애플 워치 시리즈 8",
      currentPrice: 380000,
      endTime: "2024-01-17 20:45",
      bidders: 13,
      image: "https://via.placeholder.com/200x150/16a085/ffffff?text=Apple+Watch"
    }
  ]

  const handleSortByTime = () => {
    setSortType('time')
    setCurrentPage(1) // 정렬 변경 시 첫 페이지로 이동
  }

  const handleSortByBidders = () => {
    setSortType('bidders')
    setCurrentPage(1) // 정렬 변경 시 첫 페이지로 이동
  }

  const handleNextPage = () => {
    if (currentPage < Math.ceil(auctionItems.length / itemsPerPage)) {
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
              <div key={item.id} className="auction-card">
                <div className="main-auction-image">
                  <img src={item.image} alt={item.title} />
                  <div className="main-auction-badge">
                    <span className="bidders-count">{item.bidders}명</span>
                  </div>
                </div>
                <div className="auction-info">
                  <h3 className="auction-title">{item.title}</h3>
                  <div className="auction-price">
                    <span className="main-current-price">₩{item.currentPrice.toLocaleString()}</span>
                  </div>
                  <div className="auction-time">
                    <span className="end-time">종료: {item.endTime}</span>
                  </div>
                  <button className="main-bid-button">입찰하기</button>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 버튼 */}
          <div className="pagination">
            <button
              className="page-btn prev-btn"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              이전
            </button>
            <span className="page-info">
              {currentPage} / {totalPages}
            </span>
            <button
              className="page-btn next-btn"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainPage