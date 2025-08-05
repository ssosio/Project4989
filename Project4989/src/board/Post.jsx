import axios from 'axios';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

const Post = () => {

    const [uploadFiles,setUploadFiles]=useState([]);
    const [postType,setPostType]=useState('ITEMS');
    const [tradeType,setTradeType]=useState('SALE');
    const [title,setTitle]=useState('');
    const [price,setPrice]=useState('');
    const [content,setContent]=useState('');
    const [photoPreview,setPhotoPreview]=useState([]);

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

        formData.append("title",title);
        formData.append("postType",postType);
        formData.append("tradeType",tradeType);
        formData.append("content",content);
        formData.append("price",price);

        // 디버깅을 위한 콘솔 로그 추가
        console.log("전송할 tradeType:", tradeType);
        console.log("전송할 postType:", postType);
        console.log("전송할 title:", title);
        console.log("전송할 price:", price);
        console.log("전송할 content:", content);

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
    <div>
        <table>
            <tr>
                <td>
                    <label>물건타입
                    <select name="postType" id="" style={{width:'150px'}} value={postType} onChange={(e)=>{
                        setPostType(e.target.value);
                    }}>
                        <option value="ITEMS">중고물품</option>
                        <option value="CARS">자동차</option>
                        <option value="REAL_ESTATES">부동산</option>
                    </select>
                    </label>
                </td>
                </tr>
                {
                    postType==='REAL_ESTATES'&&(
                        <tr>
                            <td>
                                <label>매물종류
                                    <select name='propertyType' style={{width:'150px'}}>
                                        <option value="apt">아파트</option>
                                        <option value="studio">오피스텔</option>
                                        <option value="oneroom">원룸</option>
                                        <option value="tworoom">투룸</option>
                                    </select>
                                </label>
                            </td>
                            <td>
                                <label>면적
                                <input type="text" name='area' style={{width:'80px'}}/>㎡
                                </label>
                            </td>
                            <td>
                                <label>방 개수
                                <input type="text" name='rooms' style={{width:'50px'}}/>
                                </label>
                            </td>
                            <td>
                                <label>층
                                <input type="text" name='floor' style={{width:'50px'}}/>
                                </label>
                            </td>
                            <td>
                                <label>거래유형
                                    <select name='dealType'>
                                        <option value="lease">전세</option>
                                        <option value="rent">월세</option>
                                        <option value="leaseAndrent">전월세</option>
                                        <option value="buy">매매</option>
                                    </select>
                                </label>
                            </td>
                            <td>
                                <label>위치
                                <input type="text" name='location' style={{width:'50px'}}/>
                                </label>
                            </td>
                        </tr>
                    )
                }
                {
                    postType==='CARS'&&(
                        <tr>
                            <td>
                                <label>브랜드
                                    <select name='brand' style={{width:'150px'}}>
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
                                <input type="text" name='model' style={{width:'180px'}}/>
                                </label>
                            </td>
                            <td>
                                <label>연식
                                <input type="text" name='year' style={{width:'80px'}}/>
                                </label>
                            </td>
                            <td>
                                <label>주행거리
                                <input type="text" name='mileage' style={{width:'80px'}}/>km
                                </label>
                            </td>
                            <td>
                                <label>연료
                                    <select name='fuelType'>
                                        <option value="gasiline">휘발유</option>
                                        <option value="diesel">경유</option>
                                        <option value="electric">전기</option>
                                    </select>
                                </label>
                            </td>
                            <td>
                                <label>변속기
                                    <select name='transmission'>
                                        <option value="auto">오토</option>
                                        <option value="stick">수동</option>
                                    </select>
                                </label>
                            </td>
                            <td>
                                <label>위치
                                <input type="text" name='location' style={{width:'50px'}}/>
                                </label>
                            </td>
                        </tr>
                    )
                }
                {
                    (postType==='ITEMS'||postType==='CARS') &&(
                    <tr>
                        <td>
                            <label>판매타입
                            <select name="tradeType" id="" style={{width:'150px'}} value={tradeType} onChange={(e)=>{
                            setTradeType(e.target.value);
                            }}>
                                <option value="SALE">판매</option>
                                <option value="AUCTION">경매</option>
                                <option value="SHARE">나눔</option>
                            </select>
                            </label>
                        </td>
                    </tr>
                    )
                }
            <tr>
                <td>
                    <label>제목
                    <input type="text" name='title' style={{width:'250px'}} onChange={(e)=>{
                        setTitle(e.target.value);
                    }}/>
                    </label>
                </td>
            </tr>
            <tr>
                <td>
                    <label>가격
                    <input type="text" name='price' style={{width:'150px'}} onChange={(e)=>{
                        setPrice(e.target.value);
                    }}/>
                    </label>
                </td>
            </tr>
            <tr>
                <td colSpan='4'>
                    <textarea name="content" id="" style={{width:'400px',height:'150px'}} onChange={(e)=>{
                        setContent(e.target.value);
                    }}></textarea>
                </td>
            </tr>
            <tr>
                <td>
                    <label>사진
                    <input type="file" name='uploadfiles' style={{width:'250px'}} multiple onChange={handleFileChag}/>
                    </label>
                </td>
            </tr>
            <tr>
                <td>
                    {photoPreview.map((url,idx)=>(
                        <img src={url} alt="" key={idx} width="200" />
                    ))}
                </td>
            </tr>
            <tr>
                <button type='button' style={{width:'130px', backgroundColor:'bisque',marginRight:'30px'}} onClick={postInsert}>등록</button>
                <button type='button' style={{width:'130px', backgroundColor:'bisque'}} onClick={clickList}>목록</button>
            </tr>
        </table>
    </div>
  )
}

export default Post