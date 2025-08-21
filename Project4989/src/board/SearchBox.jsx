import React, { useEffect, useState } from "react";
import axios from "axios";

export default function SearchBox() {
  const [q, setQ] = useState("");              // 입력값
  const [qd, setQd] = useState("");            // 디바운스된 값
  const [postType, setPostType] = useState("ALL"); // ALL/CARS/ESTATE/ITEMS
  const [page, setPage] = useState(1);
  const size = 10;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

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
        const { data } = await axios.get("/search", {
          params: { keyword: qd, postType, page, size }
        });
        setRows(data.rows || []);
        setTotal(data.total || 0);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [qd, postType, page]);

  // 페이지네이션 계산
  const lastPage = Math.max(1, Math.ceil(total / size));

  // Enter 치면 즉시 검색(디바운스 기다리지 않고)
  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      setQd(q.trim());
      setPage(1);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "20px auto" }}>
      {/* 검색 바 */}
      <div style={{ display: "flex", gap: 8 }}>
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
      </div>

      {/* 상태 표시 */}
      <div style={{ marginTop: 12 }}>
        {loading && <span>검색 중…</span>}
        {err && <span style={{ color: "crimson" }}>에러: {err}</span>}
        {!loading && !err && qd && <span>총 {total}건</span>}
      </div>

      {/* 결과 리스트 */}
      <ul style={{ marginTop: 12, listStyle: "none", padding: 0 }}>
        {rows.map((post) => (
          <li key={post.postId} style={{ padding: 12, borderBottom: "1px solid #eee" }}>
            <div style={{ fontWeight: 600 }}>[{post.postType}] {post.title}</div>
            <div>가격: {post.price?.toLocaleString?.() ?? post.price}</div>
            <div style={{ color: "#666" }}>{post.content}</div>

            {/* 타입별 상세 */}
            {post.postType === "CARS" && post.car && (
              <div style={{ marginTop: 6 }}>
                🚗 {post.car.brand} {post.car.model} / {post.car.year}년식 · {post.car.fuelType}/{post.car.transmission}
              </div>
            )}
            {post.postType === "REAL_ESTATES" && post.estate && (
              <div style={{ marginTop: 6 }}>
                🏠 {post.estate.propertyType} · {post.estate.area}㎡ · {post.estate.rooms}룸 · {post.estate.dealType}
              </div>
            )}
            {post.postType === "ITEMS" && post.item && (
              <div style={{ marginTop: 6 }}>
                📦 {post.item.category} · 상태: {post.item.conditions}
              </div>
            )}
          </li>
        ))}
      </ul>

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
