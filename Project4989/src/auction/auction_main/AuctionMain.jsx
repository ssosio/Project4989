import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './auction.css';

const AuctionMain = () => {
  const [auctionList, setAuctionList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:4989/auction")
      .then(res => {
        setAuctionList(res.data);
      })
      .catch(err => {
        console.error("❌ 에러 발생:", err);
      });
  }, []);

  // 상세 페이지로 이동하는 함수
  const handleRowClick = (postId) => {
    navigate(`/auction/detail/${postId}`);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'null' || dateString === '') {
      return '-';
    }
    
    try {
      const date = new Date(dateString);
      // 1970년 1월 1일이거나 유효하지 않은 날짜인 경우
      if (date.getTime() === 0 || isNaN(date.getTime())) {
        return '-';
      }
      return date.toLocaleString('ko-KR');
    } catch {
      return '-';
    }
  };

  // 가격 포맷팅 함수
  const formatPrice = (price) => {
    if (!price || price === 0) {
      return '-';
    }
    return `${price.toLocaleString()} 원`;
  };

  // 텍스트 포맷팅 함수
  const formatText = (text) => {
    if (text === null || text === undefined || text === '') {
      return '-';
    }
    return text;
  };

  return (
    <div className="auction-main-container">
      <h2>경매 리스트</h2>
      <table className="auction-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>회원ID</th>
            <th>제목</th>
            <th>가격</th>
            <th>거래유형</th>
            <th>상태</th>
            <th>마감시간</th>
            <th>낙찰자ID</th>
            <th>조회수</th>
            <th>작성일</th>
            <th>수정일</th>
          </tr>
        </thead>
        <tbody>
          {auctionList.map(post => (
            <tr 
              key={post.postId}
              onClick={() => handleRowClick(post.postId)}
            >
              <td>{formatText(post.postId)}</td>
              <td>{formatText(post.memberId)}</td>
              <td>{formatText(post.title)}</td>
              <td>{formatPrice(post.price)}</td>
              <td>{formatText(post.tradeType)}</td>
              <td>{formatText(post.status)}</td>
              <td>{formatDate(post.auctionEndTime)}</td>
              <td>{formatText(post.winnerId)}</td>
              <td>{formatText(post.viewCount)}</td>
              <td>{formatDate(post.createdAt)}</td>
              <td>{formatDate(post.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuctionMain;
