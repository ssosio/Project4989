import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import './post.css';

const UpdatePost = () => {

    const navi = useNavigate();
    const { search } = useLocation();
    const postId = new URLSearchParams(search).get('postId');

    //공통
    const [uploadFiles,setUploadFiles]=useState([]);
    const [postType,setPostType]=useState('');
    const [tradeType,setTradeType]=useState('');
    const [title,setTitle]=useState('');
    const [price,setPrice]=useState('');
    const [content,setContent]=useState('');
    const [photoPreview,setPhotoPreview]=useState([]);

    const [locationVal, setLocationVal] = useState('');

    // 기존 사진(서버 저장본) + 삭제/대표 관리
    const [existingPhotos, setExistingPhotos] = useState([]); // [{photoId, photoUrl, isMain}]
    const [deletePhotoIds, setDeletePhotoIds] = useState([]);
    const [mainPhotoId, setMainPhotoId] = useState(null);

    //부동산
    const [propertyType,setPropertyType]=useState('');
    const [area,setArea]=useState('');
    const [rooms,setRooms]=useState('');
    const [floor,setFloor]=useState('');
    const [dealType,setDealType]=useState('');

    //자동차
    const [brand,setBrand]=useState('');
    const [model,setModel]=useState('');
    const [year,setYear]=useState('');
    const [mileage,setMileage]=useState('');
    const [fuelType,setFuelType]=useState('');
    const [transmission,setTransmission]=useState('');

    //아이템(카테고리)
    const [parents, setParents] = useState([]);
    const [children, setChildren] = useState([]);
    const [selectedParent, setSelectedParent] = useState('');
    const [selectedChild, setSelectedChild] = useState('');
    const [conditions,setConditions]=useState('');
    const [categoryId,setCategoryId]=useState('');


    useEffect(()=>{
        axios.get("http://localhost:4989/category/category")
        .then(res=> setParents(res.data))
        .catch(err=> console.log(err));
    },[]);

  const handleParentChange = (e) => {
  const val = e.target.value;

  if (!val || isNaN(Number(val))) {
    console.warn("❌ 유효하지 않은 parentId:", val);
    setSelectedParent('');
    setChildren([]);
    return;
  }

  const parentId = Number(val);
  setSelectedParent(parentId);
  setCategoryId(parentId);
  console.log("✅ 선택된 parentId:", parentId);

  axios.get(`http://localhost:4989/category/child?parentId=${parentId}`)
    .then(res => setChildren(res.data))
    .catch(err => console.error("❌ axios 에러:", err));
};


    const handleChildChange=(e)=>{
        const parentId=Number(e.target.value);
        setSelectedChild(parentId);
    };

    // 상세 데이터 로드 (초기값 세팅)
  useEffect(() => {
    if (!postId) return;
    axios.get(`http://localhost:4989/post/detail?postId=${postId}`)
      .then(res => {
        // 응답 구조는 백에서 보낸 형태에 맞춰 조정
        // 예시: { post, car, realEstate, item, photos }
        const data = res.data || {};
        const p = data.post || data; // 혹시 바로 post 필드 없이 map이면 보정
        setPostType(p.postType || '');
        setTradeType(p.tradeType || '');
        setTitle(p.title || '');
        setPrice(p.price ?? '');
        setContent(p.content || '');
        setLocationVal(p.location || '');

        // subtype
        if (data.car) {
          setBrand(data.car.brand || '');
          setModel(data.car.model || '');
          setYear(data.car.year ?? '');
          setMileage(data.car.mileage ?? '');
          setFuelType(data.car.fuelType || '');
          setTransmission(data.car.transmission || '');
        }
        if (data.realEstate) {
          setPropertyType(data.realEstate.propertyType || '');
          setArea(data.realEstate.area ?? '');
          setRooms(data.realEstate.rooms ?? '');
          setFloor(data.realEstate.floor ?? '');
          setDealType(data.realEstate.dealType || '');
          setLocationVal(data.realEstate.location || p.location || '');
        }
        if (data.item) {
          setCategoryId(data.item.categoryId ?? '');
          setConditions(data.item.conditions || '');
          // parent/child는 필요시 별도 API로 역추적
        }

        // 사진
        const photos = data.photos || p.photos || [];
        setExistingPhotos(Array.isArray(photos) ? photos : []);
        // 대표 기본값 (있다면)
        const main = (Array.isArray(photos) ? photos : []).find(ph => ph.isMain === 1 || ph.isMain === true);
        setMainPhotoId(main ? main.photoId : null);
      })
      .catch(err => console.error(err));
  }, [postId]);
    
   //사진파일업로드
    const handleFileChag=(e)=>{
        const files=Array.from(e.target.files);

        setUploadFiles(files);
        setPhotoPreview(files.map(file=>URL.createObjectURL(file)));
    }

    // 기존 사진 삭제 토글
  const toggleDeletePhoto = (photoId) => {
    setDeletePhotoIds(prev =>
      prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
    );
    // 삭제로 체크한 사진이 대표로 선택되어 있으면 대표 선택 해제
    if (mainPhotoId === photoId) {
      setMainPhotoId(null);
    }
  };

  const appendIf = (fd, key, val) => {
    if (val !== undefined && val !== null && `${val}`.trim() !== '') {
      fd.append(key, val);
    }
  };

  const submitUpdate = () => {
    if (!postId) {
      alert('postId가 없습니다.');
      return;
    }

    const fd = new FormData();
    fd.append('postId', postId);

    // 공통
    appendIf(fd, 'title', title);
    appendIf(fd, 'postType', postType);
    appendIf(fd, 'content', content);
    appendIf(fd, 'price', price);
    appendIf(fd, 'location', locationVal);

    if (postType !== 'REAL_ESTATES') {
      appendIf(fd, 'tradeType', tradeType);
    }

    // 부동산
    if (postType === 'REAL_ESTATES') {
      appendIf(fd, 'propertyType', propertyType);
      appendIf(fd, 'area', area);
      appendIf(fd, 'rooms', rooms);
      appendIf(fd, 'floor', floor);
      appendIf(fd, 'dealType', dealType);
    }

    // 자동차
    if (postType === 'CARS') {
      appendIf(fd, 'brand', brand);
      appendIf(fd, 'model', model);
      appendIf(fd, 'year', year);
      appendIf(fd, 'mileage', mileage);
      appendIf(fd, 'fuelType', fuelType);
      appendIf(fd, 'transmission', transmission);
    }

    // 아이템
    if (postType === 'ITEMS') {
      appendIf(fd, 'categoryId', categoryId);
      appendIf(fd, 'conditions', conditions);
    }

    // 새 파일
    uploadFiles.forEach(f => fd.append('uploadFiles', f));

    // 삭제할 기존 사진 ids
    deletePhotoIds.forEach(id => fd.append('deletePhotoIds', id));

    // 대표 선택(선택)
    if (mainPhotoId) fd.append('mainPhotoId', mainPhotoId);

    // 헤더
    const token = localStorage.getItem('jwtToken');
    const headers = { 'Content-Type': 'multipart/form-data' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    axios.post('http://localhost:4989/post/update', fd, { headers })
      .then(() => {
        alert('수정 성공');
        navi('/goods'); // 또는 상세로
      })
      .catch(err => {
        console.error('에러 상세:', err.response?.data || err);
        alert('수정 실패');
      });
  };

    const clickList=()=>{
        navi("/goods");
    }


    return (
         <div className="post-page">
      <div className="post-container">
        {/* 헤더 섹션 */}
        <div className="post-header">
          <h1 className="post-title">물품 수정</h1>
          <p className="post-subtitle">판매하고 싶은 물품을 수정해보세요</p>
        </div>

        {/* 폼 컨테이너 */}
        <div className="post-form-container">
          <table className="post-form-table">
            <tr>
                <td>
                    <label>물건타입
                    <select name="postType" id="" value={postType} onChange={(e)=>{
                        setPostType(e.target.value);
                    }}>
                        <option value="" disabled selected>물건타입을 선택해 주세요</option>
                        <option value="ITEMS" selected>중고물품</option>
                        <option value="CARS">자동차</option>
                        <option value="REAL_ESTATES">부동산</option>
                    </select>
                    </label>
                </td>
                </tr>
                {
                    postType==='REAL_ESTATES'&&(
                        <tr className="conditional-section">
                            <td>
                                <label>매물종류
                                    <select name='propertyType' value={propertyType} onChange={(e)=>{
                                        setPropertyType(e.target.value);
                                    }}>
                                        <option value="" disabled selected>매물종류를 선택해 주세요</option>
                                        <option value="apt">아파트</option>
                                        <option value="studio">오피스텔</option>
                                        <option value="oneroom">원룸</option>
                                        <option value="tworoom">투룸</option>
                                    </select>
                                </label>
                            </td>
                            <td>
                                <label>면적
                                <input type="text" name='area' value={area} onChange={(e)=>{
                                        setArea(e.target.value);
                                    }}/>㎡
                                </label>
                            </td>
                            <td>
                                <label>방 개수
                                <input type="text" name='rooms' value={rooms} onChange={(e)=>{
                                        setRooms(e.target.value);
                                    }}/>
                                </label>
                            </td>
                            <td>
                                <label>층
                                <input type="text" name='floor' value={floor} onChange={(e)=>{
                                        setFloor(e.target.value);
                                    }}/>
                                </label>
                            </td>
                            <td>
                                <label>거래유형
                                    <select name='dealType' value={dealType} onChange={(e)=>{
                                        setDealType(e.target.value);
                                    }}>
                                        <option value="" disabled selected>거래유형을 선택해 주세요</option>
                                        <option value="lease">전세</option>
                                        <option value="rent">월세</option>
                                        <option value="leaseAndrent">전월세</option>
                                        <option value="buy">매매</option>
                                    </select>
                                </label>
                            </td>
                            <td>
                                <label>위치
                                <input type="text" name='location' value={location} onChange={(e)=>{
                                        setLocationVal(e.target.value);
                                    }}/>
                                </label>
                            </td>
                        </tr>
                    )
                }
                {
                    postType==='CARS'&&(
                        <tr className="conditional-section">
                            <td>
                                <label>브랜드
                                    <select name='brand' value={brand} onChange={(e)=>{
                                        setBrand(e.target.value);
                                    }}>
                                        <option value="" disabled selected>브랜드를 선택해 주세요</option>
                                        <option value="kia">기아</option>
                                        <option value="hyundai">현대</option>
                                        <option value="benz">벤츠</option>
                                        <option value="audi">아우디</option>
                                        <option value="bmw">BMW</option>
                                    </select>
                                </label>
                            </td>
                            <td>
                                <label>모델
                                <input type="text" name='model' value={model} onChange={(e)=>{
                                        setModel(e.target.value);
                                    }}/>
                                </label>
                            </td>
                            <td>
                                <label>연식
                                <input type="number" name='year' value={year} onChange={(e)=>{
                                        setYear(e.target.value);
                                    }}/>
                                </label>
                            </td>
                            <td>
                                <label>주행거리
                                <input type="text" name='mileage' value={mileage} onChange={(e)=>{
                                        setMileage(e.target.value);
                                    }}/>km
                                </label>
                            </td>
                            <td>
                                <label>연료
                                    <select name='fuelType' value={fuelType} onChange={(e)=>{
                                        setFuelType(e.target.value);
                                    }}>
                                        <option value="" disabled selected>연료타입을 선택해 주세요</option>
                                        <option value="gasoline">휘발유</option>
                                        <option value="diesel">경유</option>
                                        <option value="electric">전기</option>
                                    </select>
                                </label>
                            </td>
                            <td>
                                <label>변속기
                                    <select name='transmission' value={transmission} onChange={(e)=>{
                                        setTransmission(e.target.value);
                                    }}>
                                        <option value="" disabled selected>변속기타입을 선택해 주세요</option>
                                        <option value="auto">오토</option>
                                        <option value="stick">수동</option>
                                    </select>
                                </label>
                            </td>
                            <td>
                                <label>위치
                                <input type="text" name='location' value={location} onChange={(e)=>{
                                        setLocationVal(e.target.value);
                                    }}/>
                                </label>
                            </td>
                        </tr>
                    )
                }
                {
                    (postType==='ITEMS'||postType==='CARS') &&(
                    <tr className="conditional-section">
                        <td>
                            <label>판매타입
                            <select name="tradeType" id="" value={tradeType} onChange={(e)=>{
                            setTradeType(e.target.value);
                            }}>
                                <option value="" disabled selected>판매타입을 선택해 주세요</option>
                                <option value="SALE">판매</option>
                                <option value="AUCTION">경매</option>
                                <option value="SHARE">나눔</option>
                            </select>
                            </label>
                        </td>
                    </tr>
                    )
                }
                {
                    postType==='ITEMS' &&(
                    <tr className="conditional-section">
                        <td>
                            <label>대분류
                                <select onChange={handleParentChange} value={selectedParent}>
                                    <option value=""></option>
                                    {
                                        parents.map(p=>(
                                            <option key={p.categoryId} value={p.categoryId}>{p.name}</option>
                                        ))
                                    }
                                </select>
                            </label>
                        </td>
                        <td>
                            <label>소분류
                                <select onChange={handleChildChange} value={selectedChild}>
                                    <option value=""></option>
                                    {
                                        children.map(c=>(
                                            <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                                        ))
                                    }
                                </select>
                            </label>
                        </td>
                         <td>
                            <label>상태
                                <select value={conditions} onChange={(e)=>{
                                    setConditions(e.target.value);
                                }}>
                                    <option value="">선택해주세요</option>
                                    <option value="best">상</option>
                                    <option value="good">중</option>
                                    <option value="bad">하</option>
                                </select>
                            </label>
                        </td>
                    </tr>
                   
                    )
                } 
            <tr>
                <td>
                    <label>제목
                    <input type="text" name='title'  value={title} onChange={(e)=>{
                        setTitle(e.target.value);
                    }}/>
                    </label>
                </td>
            </tr>
            <tr>
                <td>
                    <label>가격
                    <input type="text" name='price'  value={price} onChange={(e)=>{
                        setPrice(e.target.value);
                    }}/>
                    </label>
                </td>
            </tr>
            <tr>
                <td colSpan='4'>
                    <textarea name="content" id="" value={content} onChange={(e)=>{
                        setContent(e.target.value);
                    }}></textarea>
                </td>
            </tr>
            
              {/* 기존 사진 목록 (삭제/대표 선택) */}
              <tr>
                <td>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {existingPhotos.map((ph) => (
                      <div key={ph.photoId} style={{ textAlign: 'center' }}>
                        <img
                          src={`http://localhost:4989/save/${ph.photoUrl}`}
                          alt=""
                          className="photo-preview"
                          style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }}
                        />
                        <div style={{ marginTop: 6 }}>
                          <label style={{ display: 'block' }}>
                            <input
                              type="checkbox"
                              checked={deletePhotoIds.includes(ph.photoId)}
                              onChange={() => toggleDeletePhoto(ph.photoId)}
                            /> 삭제
                          </label>
                          <label style={{ display: 'block' }}>
                            <input
                              type="radio"
                              name="mainPhoto"
                              checked={mainPhotoId === ph.photoId}
                              onChange={() => setMainPhotoId(ph.photoId)}
                              disabled={deletePhotoIds.includes(ph.photoId)}
                            /> 대표
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>

              {/* 새 사진 추가 */}
              <tr>
                <td>
                  <label>사진 추가
                    <input type="file" multiple onChange={handleFileChag} />
                  </label>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="photo-preview-container">
                    {photoPreview.map((url, idx) => (
                      <img src={url} alt="" key={idx} className="photo-preview" />
                    ))}
                  </div>
                </td>
              </tr>
          </table>

          <div className="post-button-container">
            <button type="button" className="post-submit-btn" onClick={submitUpdate}>수정</button>
            <button type="button" className="post-list-btn" onClick={clickList}>목록</button>
          </div>
        </div>
      </div>
    </div>
    );
};

export default UpdatePost;