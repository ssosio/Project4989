import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './auction.css';

const AuctionMain = () => {
  const [auctionList, setAuctionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [winnerNicknames, setWinnerNicknames] = useState({}); // 낙찰자 닉네임 저장
  const navigate = useNavigate();

  useEffect(() => {
    fetchAuctionList();
  }, []);

  const fetchAuctionList = async () => {
    try {
      const response = await axios.get('http://192.168.10.136:4989/auction');
      setAuctionList(response.data);
      
      // 낙찰자 닉네임 가져오기
      const nicknames = {};
      for (const auction of response.data) {
        if (auction.winnerId) {
          try {
            const nicknameResponse = await axios.get(`http://192.168.10.136:4989/auction/member/${auction.winnerId}`);
            nicknames[auction.postId] = nicknameResponse.data.nickname;
          } catch (err) {
            console.error(`낙찰자 닉네임 조회 실패 (ID: ${auction.winnerId}):`, err);
            nicknames[auction.postId] = `ID ${auction.winnerId}`;
          }
        }
      }
      setWinnerNicknames(nicknames);
      
      setLoading(false);
    } catch (error) {
      console.error('경매 목록 조회 실패:', error);
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="auction-main-container">
        <h2>경매 리스트</h2>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h3>로딩 중...</h3>
        </div>
      </div>
    );
  }

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
              <td>
                {post.winnerId ? (
                  <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                    🎉 {winnerNicknames[post.postId] || `ID ${post.winnerId}`}
                  </span>
                ) : (
                  <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>
                    미정
                  </span>
                )}
              </td>
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
