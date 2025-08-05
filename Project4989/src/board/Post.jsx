import axios from 'axios';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

const Post = () => {

    const [uploadFiles,setUploadFiles]=useState([]);
    const [postType,setPostType]=useState('');
    const [tradeType,setTradeType]=useState('');
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


    const postInsert=()=>{
        const formData=new FormData();

        formData.append("title",title);
        formData.append("postType",postType);
        formData.append("tradeType",tradeType);
        formData.append("content",content);
        formData.append("price",price);

        uploadFiles.forEach(file=>{
            formData.append("uploadFiles",file);
        });

        axios.post("http://localhost:4989/post/insert",formData,{
            headers:{'Content-Type':'multipart/form-data'}
        }).then(()=>{
            alert("성공");
            navi("/goods");
        }).catch(err=>{
            alert("에러"+err);
        })
    }



  return (
    <div>
        <table>
            <tr>
                <td>
                    <select name="postType" id="" style={{width:'150px'}} value={postType} onChange={(e)=>{
                        setPostType(e.target.value);
                    }}>
                        <option value="ITEMS">중고물품</option>
                        <option value="CARS">자동차</option>
                        <option value="REAL_ESTATES">부동산</option>
                    </select>
                </td>
                <td>
                    <select name="tradeType" id="" style={{width:'150px'}} value={tradeType} onChange={(e)=>{
                        setTradeType(e.target.value);
                    }}>
                        <option value="SALE">판매</option>
                        <option value="AUCTION">경매</option>
                        <option value="SHARE">나눔</option>
                    </select>
                </td>
            </tr>
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
                <button type='button' style={{width:'130px', backgroundColor:'bisque'}}>목록</button>
            </tr>
        </table>
    </div>
  )
}

export default Post