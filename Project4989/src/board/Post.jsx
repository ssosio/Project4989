import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './post.css';

const Post = () => {


    //공통
    const [uploadFiles,setUploadFiles]=useState([]);
    const [postType,setPostType]=useState('');
    const [tradeType,setTradeType]=useState('');
    const [title,setTitle]=useState('');
    const [price,setPrice]=useState('');
    const [content,setContent]=useState('');
    const [photoPreview,setPhotoPreview]=useState([]);

    const [location,setLocation]=useState('');

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

    

    const navi=useNavigate();

    // let uploadUrl="http://localhost:4989/post/upload";
    // let insertUrl="http://localhost:4989/post/insert";
    //let photoUrl="http://localhost:4989/save";

    const handleFileChag=(e)=>{
        const files=Array.from(e.target.files);

        setUploadFiles(files);
        setPhotoPreview(files.map(file=>URL.createObjectURL(file)));
    }

    const clickList=()=>{
        navi("/goods");
    }


    const postInsert=()=>{
        const formData=new FormData();

        //공통
        formData.append("title",title);
        formData.append("postType",postType);
        
        formData.append("content",content);
        formData.append("price",price);
        formData.append("location",location);

        if(postType!=='REAL_ESTATES'){
        formData.append("tradeType",tradeType);
        }

        //부동산
        if(postType==='REAL_ESTATES'){
        formData.append("propertyType",propertyType);
        formData.append("area",area);
        formData.append("rooms",rooms);
        formData.append("floor",floor);
        formData.append("dealType",dealType);
        }
        

        //자동차
        if(postType==='CARS'){
        formData.append("brand",brand);
        formData.append("model",model);
        formData.append("year",year);
        formData.append("mileage",mileage);
        formData.append("fuelType",fuelType);
        formData.append("transmission",transmission);
        }
        

        //아이템
        if(postType==='ITEMS'){
            formData.append("categoryId",categoryId);
            formData.append("conditions",conditions);
         }
        

        // 디버깅을 위한 콘솔 로그 추가
        console.log("전송할 tradeType:", tradeType);
        console.log("전송할 postType:", postType);
        console.log("전송할 title:", title);
        console.log("전송할 price:", price);
        console.log("전송할 location:", location);
        console.log("전송할 propertyType:", propertyType);
        console.log("전송할 area:", area);
        console.log("전송할 rooms:", rooms);
        console.log("전송할 floor:", floor);
        console.log("전송할 brand:", brand);
        console.log("전송할 model:", model);
        console.log("전송할 year:", year);
        console.log("전송할 mileage:", mileage);
        console.log("전송할 fuelType:", fuelType);
        console.log("전송할 transmission:", transmission);
        console.log("전송할 condition:", conditions);

        


        uploadFiles.forEach(file=>{
            formData.append("uploadFiles",file);
        });

        // JWT 토큰 가져오기
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'multipart/form-data'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }


        axios.post("http://localhost:4989/post/insert",formData,{
            headers: headers
        }).then(()=>{
            alert("성공");
            navi("/goods");
        }).catch(err=>{
            console.error("에러 상세:", err.response?.data);
            alert("에러"+err);
        })
    }



  return (
    <div className="post-page">
      <div className="post-container">
        {/* 헤더 섹션 */}
        <div className="post-header">
          <h1 className="post-title">물품 등록</h1>
          <p className="post-subtitle">판매하고 싶은 물품을 등록해보세요</p>
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
                                        setLocation(e.target.value);
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
                                        setLocation(e.target.value);
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
                    <input type="text" name='title' onChange={(e)=>{
                        setTitle(e.target.value);
                    }}/>
                    </label>
                </td>
            </tr>
            <tr>
                <td>
                    <label>가격
                    <input type="text" name='price' onChange={(e)=>{
                        setPrice(e.target.value);
                    }}/>
                    </label>
                </td>
            </tr>
            <tr>
                <td colSpan='4'>
                    <textarea name="content" id="" onChange={(e)=>{
                        setContent(e.target.value);
                    }}></textarea>
                </td>
            </tr>
            <tr>
                <td>
                    <label>사진
                    <input type="file" name='uploadfiles' multiple onChange={handleFileChag}/>
                    </label>
                </td>
            </tr>
            <tr>
                <td>
                    <div className="photo-preview-container">
                        {photoPreview.map((url,idx)=>(
                            <img src={url} alt="" key={idx} className="photo-preview" />
                        ))}
                    </div>
                </td>
            </tr>
          </table>
          
          {/* 버튼 컨테이너 */}
          <div className="post-button-container">
            <button type='submit' className="post-submit-btn" onClick={postInsert}>등록</button>
            <button type='button' className="post-list-btn" onClick={clickList}>목록</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Post