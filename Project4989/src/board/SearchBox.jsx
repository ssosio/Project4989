import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

export default function SearchBox() {
  const navigate = useNavigate();
  const location = useLocation();

  // URL 파라미터에서 검색어 가져오기
  const urlParams = new URLSearchParams(location.search);
  const initialKeyword = urlParams.get('keyword') || "";

  const [q, setQ] = useState(initialKeyword);       // 입력값
  const [qd, setQd] = useState(initialKeyword);     // 디바운스된 값
  const [postType, setPostType] = useState("ALL");  // ALL/CARS/REAL_ESTATES/ITEMS
  const [status, setStatus] = useState("ALL");      // ALL/ON_SALE/RESERVED/SOLD
  const [tradeType, setTradeType] = useState("ALL");// ALL/SALE/AUCTION/SHARE
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(1);
  const size = 12;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // (유지) 컨텍스트 의존성 — 동작엔 영향 없음. api.js가 토큰/리프레시 처리.
  const { userInfo } = useContext(AuthContext);

  // URL 파라미터 변경 시 검색어 동기화
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const keyword = urlParams.get('keyword') || "";
    setQ(keyword);
    setQd(keyword);
  }, [location.search]);

  // 디바운스: 입력 후 300ms 지나면 qd 업데이트
  useEffect(() => {
    const t = setTimeout(() => setQd(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // 검색 호출
  useEffect(() => {
    if (!qd) { // 비어있으면 초기화
      setRows([]);
      setTotal(0);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const apiUrl = showAdvanced ? "/post/search" : "/post/search-simple";

        // 서버가 keyword 또는 searchTerm 둘 중 하나를 받을 수 있으니 둘 다 전송(한쪽은 무시됨)
        const params = showAdvanced
          ? { keyword: qd, searchTerm: qd, postType, status, tradeType, page, size }
          : { keyword: qd, searchTerm: qd, page, size };

        const { data } = await api.get(apiUrl, { params });

        // api 응답은 snake->camel 자동 변환됨. 그래도 혹시 대비해 최소한의 fallback 적용.
        const content = data?.content ?? data ?? [];
        const normalized = content.map((post) => ({
          ...post,
          postId: post.postId ?? post.post_id,
          postType: post.postType ?? post.post_type,
          viewCount: post.viewCount ?? post.view_count,
        }));

        setRows(normalized);
        setTotal(data?.totalElements ?? data?.total_elements ?? 0);
      } catch (e) {
        console.error("검색 오류:", e);
        setErr(e?.response?.data?.error || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [qd, postType, status, tradeType, showAdvanced, page]);

  // 페이지네이션 계산
  const lastPage = Math.max(1, Math.ceil(total / size));

  // Enter 시 즉시 검색(디바운스 무시)
  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      setQd(q.trim());
      setPage(1);
    }
  };

  // 게시글 클릭 시 상세 페이지로 이동
 // 클릭 핸들러만 교체
const handlePostClick = (post, event) => {
  const el = event.currentTarget;
  if (el) {
    el.style.backgroundColor = "#e3f2fd";
    el.style.transform = "scale(0.98)";
  }

  // ✅ 가능한 키 모두에서 안전하게 ID 추출
  const pid =
    post.postId ??
    post.post_id ??
    post.id ??
    post.postID ??
    post.post_no ??
    post.postNo;

  if (pid === undefined || pid === null) {
    console.error("[SearchBox] postId 없음:", post);
    alert("이 게시글에는 ID가 없어 상세로 이동할 수 없습니다.");
    return;
  }

  setTimeout(() => {
    navigate(`/board/GoodsDetail?postId=${pid}`);
  }, 150);
};


  return (
    <div style={{ maxWidth: 720, margin: "20px auto" }}>
      {/* 검색 바 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          onKeyDown={onKeyDown}
          placeholder="검색어를 입력하세요 (예: 소나타, 전세, 아이폰)"
          style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />
        <select
          value={postType}
          onChange={(e) => { setPostType(e.target.value); setPage(1); }}
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        >
          <option value="ALL">전체</option>
          <option value="CARS">자동차</option>
          <option value="REAL_ESTATES">부동산</option>
          <option value="ITEMS">중고물품</option>
        </select>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            padding: "10px 15px",
            border: "1px solid #ddd",
            borderRadius: 8,
            background: showAdvanced ? "#007bff" : "#f8f9fa",
            color: showAdvanced ? "white" : "#333",
            cursor: "pointer"
          }}
        >
          고급검색
        </button>
      </div>

      {/* 고급 검색 옵션 */}
      {showAdvanced && (
        <div style={{
          marginTop: 12,
          padding: 15,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#f8f9fa"
        }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: "14px" }}>상태</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                style={{ padding: 8, border: "1px solid #ddd", borderRadius: 4 }}
              >
                <option value="ALL">전체</option>
                <option value="ON_SALE">판매중</option>
                <option value="RESERVED">예약중</option>
                <option value="SOLD">판매완료</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: "14px" }}>거래타입</label>
              <select
                value={tradeType}
                onChange={(e) => { setTradeType(e.target.value); setPage(1); }}
                style={{ padding: 8, border: "1px solid #ddd", borderRadius: 4 }}
              >
                <option value="ALL">전체</option>
                <option value="SALE">판매</option>
                <option value="AUCTION">경매</option>
                <option value="SHARE">나눔</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 상태 표시 */}
      <div style={{ marginTop: 12 }}>
        {loading && <span>검색 중…</span>}
        {err && <span style={{ color: "crimson" }}>에러: {err}</span>}
        {!loading && !err && qd && (
          <span>
            총 {total}건 {total === 0 && "검색 결과가 없습니다."}
          </span>
        )}
      </div>

      {/* 결과 리스트 */}
      {!loading && !err && qd && (
        <>
          {rows.length > 0 ? (
            <ul style={{ marginTop: 12, listStyle: "none", padding: 0 }}>
              {rows.map((post, idx) => {
                const key = post.postId ?? post.post_id ?? post.id ?? idx;
                const priceDisp = post.price?.toLocaleString?.() ?? post.price;
                return (
                  <li
                    key={key}
                    style={{
                      padding: 12,
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      borderRadius: "4px",
                      marginBottom: "4px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0f8ff";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    onClick={(e) => handlePostClick(post, e)}
                  >
                    <div style={{
                      fontWeight: 600,
                      color: "#007bff",
                      textDecoration: "underline",
                      cursor: "pointer"
                    }}>
                      [{post.postType}] {post.title}
                    </div>
                    <div>가격: {priceDisp}원</div>
                    <div style={{ color: "#666", fontSize: "14px" }}>
                      {post.content && post.content.length > 100
                        ? post.content.substring(0, 100) + "..."
                        : post.content}
                    </div>

                    {/* 타입별 상세 정보 */}
                    {post.postType === "CARS" && post.car && (
                      <div style={{ marginTop: 6, fontSize: "13px", color: "#555" }}>
                        🚗 {post.car.brand} {post.car.model} / {post.car.year}년식 · {post.car.mileage?.toLocaleString()}km · {post.car.fuelType}/{post.car.transmission}
                      </div>
                    )}
                    {post.postType === "REAL_ESTATES" && post.estate && (
                      <div style={{ marginTop: 6, fontSize: "13px", color: "#555" }}>
                        🏠 {post.estate.propertyType === 'apt' ? '아파트' :
                            post.estate.propertyType === 'studio' ? '오피스텔' :
                            post.estate.propertyType === 'oneroom' ? '원룸' :
                            post.estate.propertyType === 'tworoom' ? '투룸' : post.estate.propertyType} ·
                        {post.estate.area}㎡ · {post.estate.rooms}룸 ·
                        {post.estate.dealType === 'lease' ? '전세' :
                         post.estate.dealType === 'rent' ? '월세' :
                         post.estate.dealType === 'leaseAndrent' ? '전월세' :
                         post.estate.dealType === 'sale' ? '매매' : post.estate.dealType}
                      </div>
                    )}
                    {post.postType === "ITEMS" && post.item && (
                      <div style={{ marginTop: 6, fontSize: "13px", color: "#555" }}>
                        📦 {post.item.categoryId === 1 ? '전자제품' :
                            post.item.categoryId === 2 ? '의류' :
                            post.item.categoryId === 3 ? '가구' :
                            post.item.categoryName || `카테고리 ${post.item.categoryId}`} ·
                        상태: {post.item.conditions === 'best' ? '상' :
                               post.item.conditions === 'good' ? '중' :
                               post.item.conditions === 'bad' ? '하' : post.item.conditions}
                      </div>
                    )}

                    {/* 추가 정보 */}
                    <div style={{ marginTop: 4, fontSize: "12px", color: "#888" }}>
                      거래타입: {post.tradeType === 'SALE' ? '판매' :
                                 post.tradeType === 'AUCTION' ? '경매' :
                                 post.tradeType === 'SHARE' ? '나눔' : post.tradeType} |
                      상태: {post.status === 'ON_SALE' ? '판매중' :
                             post.status === 'RESERVED' ? '예약중' :
                             post.status === 'SOLD' ? '판매완료' : post.status} |
                      조회수: {post.viewCount}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div style={{
              marginTop: 20,
              textAlign: "center",
              padding: "40px 20px",
              color: "#666",
              fontSize: "16px"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>🔍</div>
              <div>검색 결과가 없습니다.</div>
              <div style={{ fontSize: "14px", marginTop: "8px", color: "#888" }}>
                다른 검색어를 입력해보세요.
              </div>
            </div>
          )}
        </>
      )}

      {/* 페이지네이션 */}
      {qd && total > 0 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 12 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</button>
          <span>{page} / {lastPage}</span>
          <button disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>다음</button>
        </div>
      )}
    </div>
  );
}
