import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function SearchBox() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL 파라미터에서 검색어 가져오기
  const urlParams = new URLSearchParams(location.search);
  const initialKeyword = urlParams.get('keyword') || "";
  
  const [q, setQ] = useState(initialKeyword);              // 입력값
  const [qd, setQd] = useState(initialKeyword);            // 디바운스된 값
  const [postType, setPostType] = useState("ALL"); // ALL/CARS/REAL_ESTATES/ITEMS
  const [status, setStatus] = useState("ALL"); // ALL/ON_SALE/RESERVED/SOLD
  const [tradeType, setTradeType] = useState("ALL"); // ALL/SALE/AUCTION/SHARE
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(1);
  const size = 12;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // AuthContext에서 userInfo를 가져와 로그인 상태를 확인합니다.
    const { userInfo } = useContext(AuthContext);
    // const token = userInfo?.token; // userInfo가 있으면 토큰을 사용합니다.
  
    const token =
      userInfo?.token ??
      localStorage.getItem("jwtToken");

      // ✅ 토큰을 자동으로 실어주는 axios 인스턴스
  const api = useMemo(() => {
    const inst = axios.create({ baseURL: "http://localhost:4989" });
    inst.interceptors.request.use((cfg) => {
      if (token) cfg.headers.Authorization = `Bearer ${token}`;
      return cfg;
    });
    return inst;
  }, [token]);


  // URL 파라미터가 변경될 때 검색어 업데이트
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
    // 비어있으면 초기화 (정책에 따라 전체 노출 원하면 이 부분 변경)
    if (!qd) {
      setRows([]);
      setTotal(0);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        
        // 고급 검색 옵션이 활성화된 경우 전체 검색 API 사용
        const apiUrl = showAdvanced 
          ? "http://localhost:4989/post/search"
          : "http://localhost:4989/post/search-simple";
        
        const params = showAdvanced 
          ? { 
              keyword: qd, 
              postType, 
              status, 
              tradeType, 
              page, 
              size 
            }
          : { 
              keyword: qd, 
              page, 
              size 
            };
        
        const { data } = await api.get(apiUrl, { params});
        setRows(data.content || []);
        setTotal(data.totalElements || 0);
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

  // Enter 치면 즉시 검색(디바운스 기다리지 않고)
  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      setQd(q.trim());
      setPage(1);
    }
  };

  // 게시글 클릭 시 상세페이지로 이동
  const handlePostClick = (post, event) => {
    // 클릭 시 시각적 피드백
    const clickedElement = event.currentTarget;
    if (clickedElement) {
      clickedElement.style.backgroundColor = "#e3f2fd";
      clickedElement.style.transform = "scale(0.98)";
    }
    
    // 잠시 후 페이지 이동 (시각적 피드백을 위해)
    setTimeout(() => {
      // postType에 따라 다른 상세페이지로 이동
      switch (post.postType) {
        case "CARS":
          // 자동차는 현재 별도 상세페이지가 없으므로 기본 상세페이지 사용
          navigate(`/board/GoodsDetail?postId=${post.postId}`);
          break;
        case "REAL_ESTATES":
          // 부동산은 현재 별도 상세페이지가 없으므로 기본 상세페이지 사용
          navigate(`/board/GoodsDetail?postId=${post.postId}`);
          break;
        case "ITEMS":
          // 중고물품 상세페이지
          navigate(`/board/GoodsDetail?postId=${post.postId}`);
          break;
        default:
          // 기본 상세페이지
          navigate(`/board/GoodsDetail?postId=${post.postId}`);
          break;
      }
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
                             {rows.map((post) => (
                                   <li key={post.postId} style={{ 
                    padding: 12, 
                    borderBottom: "1px solid #eee",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    borderRadius: "4px",
                    marginBottom: "4px"
                  }}
                  onMouseEnter={(e) => {
                    // li 요소에 직접 스타일 적용
                    e.currentTarget.style.backgroundColor = "#f0f8ff";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    // li 요소에 직접 스타일 적용
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
                  <div>가격: {post.price?.toLocaleString?.() ?? post.price}원</div>
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
              ))}
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
