import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaChevronUp } from 'react-icons/fa';
import './real_estate.css';

const ESTATE_DETAIL_URL = 'http://localhost:4989/post/estatedetail';
const LIST_URL = 'http://localhost:4989/post/list';
const PHOTO_BASE = 'http://localhost:4989/postphoto/';

const Real_estate = () => {
  const [postList, setPostList] = useState([]);
  const [estateDetailMap, setEstateDetailMap] = useState({}); // postId -> detail
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const itemsPerPage = 12;

  const navi = useNavigate('');
  const location = useLocation();

  // ---------- 유틸 ----------
  const norm = (v) => (v ?? '').toString().trim().toUpperCase();
  const toInt = (v) => {
    if (v === null || v === undefined) return null;
    const n = parseInt(v.toString().replace(/[^0-9]/g, ''), 10);
    return Number.isNaN(n) ? null : n;
  };
  const STATUS_ALIAS = (v) => (norm(v) === 'SOLD' ? 'SOLD_OUT' : norm(v));

  const ROOMS_RANGES = [
    { key: 'ALL', label: '전체', test: () => true },
    { key: '1', label: '1개', test: (r) => r !== null && r === 1 },
    { key: '2', label: '2개', test: (r) => r !== null && r === 2 },
    { key: '3', label: '3개', test: (r) => r !== null && r === 3 },
    { key: '4+', label: '4개 이상', test: (r) => r !== null && r >= 4 },
  ];

  const AREA_RANGES = [
    { key: 'ALL', label: '전체', test: () => true },
    { key: '<=66', label: '66㎡ 이하', test: (a) => a !== null && a <= 66 },
    { key: '66-99', label: '66-99㎡', test: (a) => a !== null && a > 66 && a <= 99 },
    { key: '99-132', label: '99-132㎡', test: (a) => a !== null && a > 99 && a <= 132 },
    { key: '132-165', label: '132-165㎡', test: (a) => a !== null && a > 132 && a <= 165 },
    { key: '>165', label: '165㎡ 이상', test: (a) => a !== null && a > 165 },
  ];

  // ---------- 스크롤 ----------
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // ---------- 페이지 쿼리 ----------
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const page = Number(q.get('page')) || 1;
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, [location.search]);

  const handlePageChange = (page) => {
    const q = new URLSearchParams(location.search);
    q.set('page', page);
    navi(`${location.pathname}?${q.toString()}`, { replace: true });
  };
  const handleNextPage = () => currentPage < totalPages && handlePageChange(currentPage + 1);
  const handlePrevPage = () => currentPage > 1 && handlePageChange(currentPage - 1);

  // ---------- 데이터 로드 (공통 리스트) ----------
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(LIST_URL);
        setPostList(data || []);
      } catch (e) {
        console.error('리스트 에러:', e);
      }
    })();
  }, []);

  // ---------- REAL_ESTATES만 추출 ----------
  const estatesFromList = useMemo(() => postList.filter((p) => p.postType === 'REAL_ESTATES'), [postList]);

  // ---------- estate detail 프리패치 ----------
  useEffect(() => {
    const needIds = estatesFromList.map((e) => e.postId).filter((id) => estateDetailMap[id] === undefined);
    if (!needIds.length) return;

    Promise.all(
      needIds.map((id) =>
        axios
          .get(ESTATE_DETAIL_URL, { params: { postId: id } })
          .then((r) => ({ id, detail: r.data }))
          .catch((e) => {
            console.warn('estatedetail 실패 postId=', id, e);
            return { id, detail: null };
          }),
      ),
    ).then((res) => {
      const next = { ...estateDetailMap };
      res.forEach(({ id, detail }) => (next[id] = detail));
      setEstateDetailMap(next);
    });
  }, [estatesFromList]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- 공통(status) + 상세(부동산필드) 머지 & 정규화 ----------
  const estates = useMemo(() => {
    console.log('=== 부동산 데이터 처리 ===');
    console.log('estatesFromList:', estatesFromList.length);
    console.log('estateDetailMap keys:', Object.keys(estateDetailMap));
    
    const processed = estatesFromList.map((p) => {
      const d = estateDetailMap[p.postId] || {};
      console.log(`부동산 ${p.postId} 상세 데이터:`, d);
      
      const propertyType = d.propertyType ?? d.type ?? d.PropertyType ?? null;
      const dealType = d.dealType ?? d.deal ?? d.DealType ?? null;
      const rooms = d.rooms ?? d.roomCount ?? d.Rooms ?? null;
      const area = d.area ?? d.size ?? d.Area ?? null;
      const floor = d.floor ?? d.Floor ?? null;
      const parking = d.parking ?? d.Parking ?? null;

      const processedEstate = {
        ...p, // 사진/제목/가격/createdAt/status 등
        // 정규화 필드(필터/옵션/비교는 전부 이 값으로)
        _status: STATUS_ALIAS(p.status), // ✅ status는 공통 리스트 기준
        _propertyType: propertyType,
        _dealType: dealType,
        _rooms: toInt(rooms),
        _area: toInt(area),
        _floor: toInt(floor),
        _parking: parking,
      };
      
      console.log(`부동산 ${p.postId} 처리 결과:`, {
        title: processedEstate.title,
        _status: processedEstate._status,
        _propertyType: processedEstate._propertyType,
        _dealType: processedEstate._dealType,
        _rooms: processedEstate._rooms,
        _area: processedEstate._area,
        _floor: processedEstate._floor,
        _parking: processedEstate._parking
      });
      
      return processedEstate;
    });
    
    console.log('=== 부동산 데이터 처리 완료 ===');
    return processed;
  }, [estatesFromList, estateDetailMap]);

  // ---------- 필터 상태 ----------
  const [filters, setFilters] = useState({
    status: 'ALL',
    propertyType: 'ALL',
    dealType: 'ALL',
    rooms: 'ALL',
    area: 'ALL',
  });

  // ---------- 필터 적용 ----------
  const filteredEstates = useMemo(() => {
    console.log('=== 필터링 시작 ===');
    console.log('현재 필터:', filters);
    console.log('총 부동산 수:', estates.length);
    
    const filtered = estates.filter((e) => {
      // 상태 필터
      if (filters.status !== 'ALL') {
        if (e._status !== filters.status) {
          console.log(`❌ 상태 필터 제외: ${e.title} (상태: ${e._status}, 필터: ${filters.status})`);
          return false;
        }
      }
      
      // 매물종류 필터
      if (filters.propertyType !== 'ALL') {
        const estateType = norm(e._propertyType || '');
        const filterType = norm(filters.propertyType);
        if (estateType !== filterType) {
          console.log(`❌ 매물종류 필터 제외: ${e.title} (종류: ${estateType}, 필터: ${filterType})`);
          return false;
        }
      }
      
      // 거래유형 필터
      if (filters.dealType !== 'ALL') {
        const estateDeal = norm(e._dealType || '');
        const filterDeal = norm(filters.dealType);
        if (estateDeal !== filterDeal) {
          console.log(`❌ 거래유형 필터 제외: ${e.title} (거래: ${estateDeal}, 필터: ${filterDeal})`);
          return false;
        }
      }
      
      // 방 개수 필터
      if (filters.rooms !== 'ALL') {
        const range = ROOMS_RANGES.find((r) => r.key === filters.rooms);
        if (!range?.test(e._rooms)) {
          console.log(`❌ 방 개수 필터 제외: ${e.title} (방 개수: ${e._rooms}개, 필터: ${filters.rooms})`);
          return false;
        }
      }
      
      // 면적 필터
      if (filters.area !== 'ALL') {
        const range = AREA_RANGES.find((r) => r.key === filters.area);
        if (!range?.test(e._area)) {
          console.log(`❌ 면적 필터 제외: ${e.title} (면적: ${e._area}평, 필터: ${filters.area})`);
          return false;
        }
      }
      
      console.log(`✅ 필터 통과: ${e.title}`);
      return true;
    });
    
    console.log('=== 필터링 완료 ===');
    console.log('필터링 후 부동산 수:', filtered.length);
    console.log('========================');
    
    return filtered;
  }, [estates, filters]);

  // ---------- 페이지네이션 (필터 이후) ----------
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredEstates.length / itemsPerPage)),
    [filteredEstates.length, itemsPerPage],
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = useMemo(
    () => filteredEstates.slice(startIndex, startIndex + itemsPerPage),
    [filteredEstates, startIndex, itemsPerPage],
  );

  // ---------- 상세에서 돌아왔을 때 포커스 ----------
  useEffect(() => {
    const focusId = location.state?.focusId;
    if (!focusId) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`post-${focusId}`);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'auto' });
        el.classList.add('focused-card');
        setTimeout(() => el.classList.remove('focused-card'), 700);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [postList, currentPage, location.state]);

  // ---------- 필터 핸들러 ----------
  const setAndResetPage = (updater) => {
    setCurrentPage(1);
    setFilters((prev) => (typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }));
  };

  const onChangeStatus = (e) => setAndResetPage({ status: e.target.value });
  const onChangePropertyType = (e) => setAndResetPage({ propertyType: e.target.value });
  const onChangeDealType = (e) => setAndResetPage({ dealType: e.target.value });
  const onChangeRooms = (e) => setAndResetPage({ rooms: e.target.value });
  const onChangeArea = (e) => setAndResetPage({ area: e.target.value });
  
  // 필터 초기화 함수
  const resetFilters = () => {
    setAndResetPage({
      status: 'ALL',
      propertyType: 'ALL',
      dealType: 'ALL',
      rooms: 'ALL',
      area: 'ALL',
    });
  };

  return (
    <div className="real-estate-page">
      <div className="real-estate-container">
        <div className="real-estate-header">
          <h1 className="real-estate-title">부동산 목록</h1>
          <p className="real-estate-subtitle">다양한 부동산을 찾아보세요</p>
          <button type='button' className="real-estate-register-btn" onClick={() => navi("/board/post")}>
              부동산 등록하기
            </button>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className="real-estate-main-content">
          {/* 왼쪽 사이드바 - 필터 */}
          <div className="real-estate-sidebar">
            <div className="estates-filters">
              {/* 필터 초기화 버튼 */}
              <div className="filter-reset-container">
                <button 
                  type="button" 
                  className="filter-reset-btn" 
                  onClick={resetFilters}
                  title="모든 필터 초기화"
                >
                  필터 초기화
                </button>
              </div>

              <div className="filter-group">
                <div className="filter-label">상태</div>
                <label><input type="radio" name="status" value="ALL" checked={filters.status === 'ALL'} onChange={onChangeStatus} /> 전체</label>
                <label><input type="radio" name="status" value="ON_SALE" checked={filters.status === 'ON_SALE'} onChange={onChangeStatus} /> 판매중</label>
                <label><input type="radio" name="status" value="RESERVED" checked={filters.status === 'RESERVED'} onChange={onChangeStatus} /> 예약</label>
                <label><input type="radio" name="status" value="SOLD" checked={filters.status === 'SOLD'} onChange={onChangeStatus} /> 판매완료</label>
              </div>

              <div className="filter-group">
                <div className="filter-label">매물종류</div>
                <label><input type="radio" name="propertyType" value="ALL" checked={filters.propertyType === 'ALL'} onChange={onChangePropertyType} /> 전체</label>
                <label><input type="radio" name="propertyType" value="apt" checked={filters.propertyType === 'apt'} onChange={onChangePropertyType} /> 아파트</label>
                <label><input type="radio" name="propertyType" value="studio" checked={filters.propertyType === 'studio'} onChange={onChangePropertyType} /> 오피스텔</label>
                <label><input type="radio" name="propertyType" value="oneroom" checked={filters.propertyType === 'oneroom'} onChange={onChangePropertyType} /> 원룸</label>
                <label><input type="radio" name="propertyType" value="tworoom" checked={filters.propertyType === 'tworoom'} onChange={onChangePropertyType} /> 투룸</label>
              </div>

              <div className="filter-group">
                <div className="filter-label">거래유형</div>
                <label><input type="radio" name="dealType" value="ALL" checked={filters.dealType === 'ALL'} onChange={onChangeDealType} /> 전체</label>
                <label><input type="radio" name="dealType" value="lease" checked={filters.dealType === 'lease'} onChange={onChangeDealType} /> 전세</label>
                <label><input type="radio" name="dealType" value="rent" checked={filters.dealType === 'rent'} onChange={onChangeDealType} /> 월세</label>
                <label><input type="radio" name="dealType" value="leaseAndrent" checked={filters.dealType === 'leaseAndrent'} onChange={onChangeDealType} /> 전월세</label>
                <label><input type="radio" name="dealType" value="buy" checked={filters.dealType === 'buy'} onChange={onChangeDealType} /> 매매</label>
              </div>

              <div className="filter-group">
                <div className="filter-label">방 개수</div>
                {ROOMS_RANGES.map((r) => (
                  <label key={`rooms-${r.key}`}>
                    <input type="radio" name="rooms" value={r.key} checked={filters.rooms === r.key} onChange={onChangeRooms} />
                    {r.label}
                  </label>
                ))}
              </div>

              <div className="filter-group">
                <div className="filter-label">면적</div>
                {AREA_RANGES.map((r) => (
                  <label key={`area-${r.key}`}>
                    <input type="radio" name="area" value={r.key} checked={filters.area === r.key} onChange={onChangeArea} />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽 메인 컨텐츠 */}
          <div className="real-estate-content">
            

            {filteredEstates.length > 0 ? (
              <>
                <div className="real-estate-grid">
                  {currentItems.map(p => (
                    <div
                      id={`post-${p.postId}`}
                      key={p.postId}
                      className="real-estate-card"
                      onClick={() =>
                        navi(`/board/GoodsDetail?postId=${p.postId}`, {
                          state: { from: `${location.pathname}${location.search || ''}`, page: currentPage, focusId: p.postId }
                        })
                      }
                    >
                      <div className="real-estate-image">
                        {p.mainPhotoUrl ? (
                          <img loading="lazy" src={`${PHOTO_BASE}${p.mainPhotoUrl}`} alt={p.title} />
                        ) : (
                          <div className="real-estate-image-placeholder">이미지 없음</div>
                        )}
                      </div>
                      <div className="real-estate-info">
                        <h3 className="real-estate-title-text">{p.title}</h3>
                        <div className="real-estate-price">
                          {p.price ? new Intl.NumberFormat().format(p.price) + '원' : '가격 미정'}
                        </div>
                        <div className="real-estate-member">판매자: {p.nickname}</div>
                        <div>조회수: {p.viewCount}</div>
                        <div className="real-estate-date">{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</div>
                        
                        {/* 상태 및 부동산 정보 배지 */}
                        <div className="estates-status">
                          <span className={`status-badge ${p._status === 'ON_SALE' ? 'on-sale' : p._status === 'RESERVED' ? 'reserved' : 'sold'}`}>
                            {p._status === 'ON_SALE' ? '판매중' : p._status === 'RESERVED' ? '예약' : '판매완료'}
                          </span>
                          {p._propertyType && (
                            <span className="trade-type-badge">
                              {p._propertyType === 'apt' ? '아파트' : 
                               p._propertyType === 'studio' ? '오피스텔' : 
                               p._propertyType === 'oneroom' ? '원룸' : 
                               p._propertyType === 'tworoom' ? '투룸' : p._propertyType}
                            </span>
                          )}
                          {p._dealType && (
                            <span className="trade-type-badge">
                              {p._dealType === 'lease' ? '전세' : 
                               p._dealType === 'rent' ? '월세' : 
                               p._dealType === 'leaseAndrent' ? '전월세' : 
                               p._dealType === 'buy' ? '매매' : p._dealType}
                            </span>
                          )}
                          {p._rooms && (
                            <span className="trade-type-badge">
                              {p._rooms}개
                            </span>
                          )}
                          {p._area && (
                            <span className="trade-type-badge">
                              {p._area}㎡
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="real-estate-pagination">
                  <div className="real-estate-page-info">
                    총 {filteredEstates.length}개 중 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredEstates.length)}개 표시
                  </div>

                  {totalPages > 1 ? (
                    <>
                      <button className="real-estate-page-btn real-estate-prev-btn" onClick={handlePrevPage} disabled={currentPage === 1}>이전</button>
                      <div className="real-estate-page-numbers">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            className={`real-estate-page-number ${currentPage === page ? 'active' : ''}`}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button className="real-estate-page-btn real-estate-next-btn" onClick={handleNextPage} disabled={currentPage === totalPages}>다음</button>
                    </>
                  ) : (
                    <div className="real-estate-page-single">페이지 1 / 1</div>
                  )}
                </div>
              </>
            ) : (
              <div className="real-estate-empty">
                <div className="real-estate-empty-icon">🏠</div>
                <div className="real-estate-empty-text">조건에 맞는 부동산이 없습니다</div>
                <button className="real-estate-empty-btn" onClick={() => navi("/board/post")}>
                  첫 번째 부동산 등록하기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 최상단으로 스크롤하는 화살표 버튼 */}
        {showScrollTop && (
          <button 
            className="scroll-to-top-btn"
            onClick={scrollToTop}
            title="최상단으로 이동"
          >
            <FaChevronUp />
          </button>
        )}
      </div>
    </div>
  );
};

export default Real_estate;
