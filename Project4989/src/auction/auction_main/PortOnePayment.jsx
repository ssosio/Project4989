import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PORTONE_CONFIG, PAYMENT_STATUS, PAYMENT_ERROR_MESSAGES } from '../../config/portone';

const PortOnePayment = ({ postId, memberId, amount, onPaymentComplete, onPaymentCancel }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // 포트원 결제 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://cdn.iamport.kr/v1/iamport.js';
    script.async = true;
    script.onload = () => {
      // 포트원 초기화
      const { IMP } = window;
      IMP.init(PORTONE_CONFIG.IMP_CODE);

      // 결제 요청
      const merchantUid = `guarantee_${postId}_${memberId}`;
      
      IMP.request_pay({
        pg: PORTONE_CONFIG.PG, // KG이니시스
        pay_method: PORTONE_CONFIG.PAY_METHOD, // 결제수단
        merchant_uid: merchantUid, // 주문번호
        amount: amount, // 결제금액
        name: '경매 보증금', // 주문명
        buyer_email: 'test@test.com', // 구매자 이메일 (실제로는 사용자 정보에서 가져와야 함)
        buyer_name: '구매자', // 구매자 이름 (실제로는 사용자 정보에서 가져와야 함)
        buyer_tel: '010-1234-5678', // 구매자 전화번호 (실제로는 사용자 정보에서 가져와야 함)
        m_redirect_url: `${PORTONE_CONFIG.MOBILE_REDIRECT_URL}/${postId}`, // 모바일 결제 후 리다이렉트 URL
      }, (rsp) => {
        if (rsp.success) {
          // 결제 성공
          console.log('결제 성공:', rsp);
          
          // 백엔드로 결제 정보 전송
          sendPaymentToBackend(rsp, merchantUid);
        } else {
          // 결제 실패
          console.log('결제 실패:', rsp);
          
          let errorMessage = PAYMENT_ERROR_MESSAGES.FAILED;
          if (rsp.error_code === 'PAY_CANCEL') {
            errorMessage = PAYMENT_ERROR_MESSAGES.CANCELLED;
          } else if (rsp.error_msg) {
            errorMessage = `${PAYMENT_ERROR_MESSAGES.FAILED}: ${rsp.error_msg}`;
          }
          
          alert(errorMessage);
          onPaymentCancel && onPaymentCancel();
        }
      });
    };

    document.head.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [postId, memberId, amount, onPaymentComplete, onPaymentCancel]);

  // 백엔드로 결제 정보 전송
  const sendPaymentToBackend = async (paymentResponse, merchantUid) => {
    try {
      const response = await fetch('http://192.168.10.138:4989/api/auction/portone/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: postId,
          memberId: memberId,
          impUid: paymentResponse.imp_uid,
          merchantUid: merchantUid,
        }),
      });

      if (response.ok) {
        console.log('결제 정보 전송 성공');
        onPaymentComplete && onPaymentComplete();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('서버 응답 오류:', errorData);
        throw new Error(`서버 응답 오류: ${response.status}`);
      }
    } catch (error) {
      console.error('결제 정보 전송 실패:', error);
      alert('결제 정보 전송에 실패했습니다. 고객센터에 문의해주세요.');
      onPaymentCancel && onPaymentCancel();
    }
  };

  return (
    <div className="payment-container">
      <div className="payment-content">
        <h2>보증금 결제</h2>
        <p>경매 참여를 위해 보증금을 결제해주세요.</p>
        <div className="payment-details">
          <p><strong>결제 금액:</strong> {amount.toLocaleString()}원</p>
          <p><strong>결제 수단:</strong> KG이니시스 (카드)</p>
          <p><strong>결제 방법:</strong> 결제창이 자동으로 열립니다</p>
        </div>
        <div className="payment-loading">
          <p>결제창을 불러오는 중입니다...</p>
          <div className="loading-spinner"></div>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            결제창이 열리지 않으면 새로고침 후 다시 시도해주세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortOnePayment;
