// src/components/auction/PortOnePayment.jsx
import React, { useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { PORTONE_CONFIG, PAYMENT_ERROR_MESSAGES } from '../../config/portone';
import api from '../../lib/api';

// 포트원 스크립트 로드 (1회)
function loadPortOneScript() {
  return new Promise((resolve, reject) => {
    if (window.IMP) return resolve();
    const existing = document.querySelector('script[src="https://cdn.iamport.kr/v1/iamport.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.iamport.kr/v1/iamport.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function PortOnePayment({
  postId,
  memberId,
  amount,
  merchantUid,
  onPaymentComplete,
  onPaymentCancel,
}) {
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);
  const launchedRef = useRef(false);

  useEffect(() => {
    if (launchedRef.current) return;
    launchedRef.current = true;

    const guardKey = `__portone_open_${postId}_${memberId}`;
    if (window[guardKey]) return;
    window[guardKey] = true;

    (async () => {
      try {
        await loadPortOneScript();
        if (!window.IMP) throw new Error('PortOne SDK not loaded');

        const { IMP } = window;
        IMP.init(PORTONE_CONFIG.IMP_CODE);

        // 로그인 토큰 존재 확인(실제 전송은 api 인스턴스가 함)
        const raw = localStorage.getItem('jwtToken') || localStorage.getItem('accessToken');
        if (!raw) {
          alert('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
          navigate(`/login?redirect=/auction/detail/${postId}`);
          window[guardKey] = false;
          return;
        }

        const buyer_email = userInfo?.loginId || userInfo?.email || '';
        const buyer_name  = userInfo?.nickname || '구매자';
        const buyer_tel   = userInfo?.phone || userInfo?.tel || '';

        if (!merchantUid) {
          alert('결제 식별자(merchantUid)가 없습니다. 다시 시도해주세요.');
          window[guardKey] = false;
          onPaymentCancel?.();
          return;
        }

        IMP.request_pay(
          {
            pg: PORTONE_CONFIG.PG,
            pay_method: PORTONE_CONFIG.PAY_METHOD,
            merchant_uid: merchantUid,
            amount: Number(amount),
            name: '경매 보증금',
            buyer_email,
            buyer_name,
            buyer_tel,
            m_redirect_url: `${PORTONE_CONFIG.MOBILE_REDIRECT_URL}/${postId}`,
          },
          async (rsp) => {
            window[guardKey] = false;

            if (rsp.success) {
              try {
                await api.post('/api/auctions/portone/confirm', {
                  postId: Number(postId),
                  memberId: Number(memberId),
                  impUid: rsp.imp_uid,
                  merchantUid,
                  paidAmount: rsp.paid_amount,
                });
                onPaymentComplete?.();
              } catch (err) {
                console.error('결제 검증/전달 실패:', err);
                alert(`${PAYMENT_ERROR_MESSAGES.FAILED} (검증 실패)`);
                onPaymentCancel?.(rsp);
              }
            } else {
              const msg =
                rsp.error_code === 'PAY_CANCEL'
                  ? PAYMENT_ERROR_MESSAGES.CANCELLED
                  : `${PAYMENT_ERROR_MESSAGES.FAILED}${rsp.error_msg ? `: ${rsp.error_msg}` : ''}`;
              alert(msg);
              onPaymentCancel?.();
            }
          }
        );
      } catch (e) {
        window[guardKey] = false;
        console.error('PortOne 초기화 실패:', e);
        alert('결제창을 열 수 없습니다. 잠시 후 다시 시도해주세요.');
        onPaymentCancel?.();
      }
    })();

    return () => {
      window[guardKey] = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="payment-container">
      <div className="payment-content">
        <h2>보증금 결제</h2>
        <p>경매 참여를 위해 보증금을 결제해주세요.</p>
        <div className="payment-details">
          <p><strong>결제 금액:</strong> {Number(amount).toLocaleString()}원</p>
          <p><strong>결제 수단:</strong> KG이니시스 (카드)</p>
          <p><strong>결제 방법:</strong> 결제창이 자동으로 열립니다.</p>
        </div>
        <div className="payment-loading">
          <p>결제창을 불러오는 중입니다...</p>
          <div className="loading-spinner" />
          <p style={{ fontSize: 14, color: '#666', marginTop: 10 }}>
            결제창이 열리지 않으면 새로고침 후 다시 시도해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
