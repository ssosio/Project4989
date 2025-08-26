import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import './CreditTierDisplay.css';

const CreditTierDisplay = ({ memberId, showDetails = false }) => {
  const [creditTier, setCreditTier] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (memberId) {
      fetchCreditTier();
    }
  }, [memberId]);

  const fetchCreditTier = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/credit-tier/${memberId}`);
      
      if (response.data.success) {
        setCreditTier(response.data.data);
      }
    } catch (error) {
      console.error('신용도 등급 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case '거래왕': return '#FFD700'; // 금색
      case '마스터': return '#C0C0C0'; // 은색
      case '장인': return '#CD7F32'; // 동색
      case '거래꾼': return '#4CAF50'; // 초록색
      case '초보상인': return '#2196F3'; // 파란색
      default: return '#9E9E9E'; // 회색
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case '거래왕': return '👑';
      case '마스터': return '⭐';
      case '장인': return '🔧';
      case '거래꾼': return '💼';
      case '초보상인': return '🛒';
      default: return '👤';
    }
  };

  if (loading) {
    return <div className="credit-tier-loading">등급 정보 로딩 중...</div>;
  }

  if (!creditTier) {
    return <div className="credit-tier-default">등급 정보 없음</div>;
  }

  return (
    <div className="credit-tier-container">
      <div 
        className="credit-tier-badge"
        style={{ backgroundColor: getTierColor(creditTier.tier) }}
      >
        <span className="credit-tier-icon">{getTierIcon(creditTier.tier)}</span>
        <span className="credit-tier-text">{creditTier.tier}</span>
      </div>
      
      {showDetails && (
        <div className="credit-tier-details">
          <div className="credit-tier-score">
            <span className="score-label">총점:</span>
            <span className="score-value">{creditTier.totalScore}점</span>
          </div>
          <div className="credit-tier-breakdown">
            <div className="breakdown-item">
              <span>거래량: {creditTier.transactionScore}점</span>
              <span className="breakdown-detail">({creditTier.completedTransactions}건)</span>
            </div>
            <div className="breakdown-item">
              <span>평점: {creditTier.ratingScore}점</span>
              <span className="breakdown-detail">({creditTier.averageRating.toFixed(1)}점)</span>
            </div>
            <div className="breakdown-item">
              <span>신고: {creditTier.penaltyScore}점</span>
              <span className="breakdown-detail">({creditTier.reportCount}건)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditTierDisplay;
