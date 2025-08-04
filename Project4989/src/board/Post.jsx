import axios from 'axios';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

const Post = () => {

    const [photo,setPhoto]=useState('');
    const [postType,setPostType]=useState('');
    const [tradeType,setTradeType]=useState('');
    const [title,setTitle]=useState('');
    const [price,setPrice]=useState('');
    const [content,setContent]=useState('');

    const navi=useNavigate();

    let uploadUrl="http://localhost:4989/post/upload";
    let insertUrl="http://localhost:4989/post/insert";
    let photoUrl="http://localhost:4989/save";

    const uploadImage=(e)=>{

        const uploadFile=e.target.files;
        const imageFiles=new FormData();

        Array.from(uploadFile).forEach(file=>{
            imageFiles.append("uploadFile",file);
        });

        axios({

            method:'post',
            url:uploadUrl,
            data:imageFiles,
            headers:{'Content-Type':'multipart/form-data'}

        }).then(res=>{
            setPhoto(res.data);
        }).catch(err=>{
            alert(err);
        });

    }

    const postInsert=()=>{
        axios.post(insertUrl,{postType,tradeType,title,price,content,photo})
        .then(()=>{
            navi("/goods");
        })
    }


  return (
    <div>
        <table>
            <tr>
                <td>
                    <select name="post_type" id="" style={{width:'150px'}} value={postType} onChange={(e)=>{
                        setPostType(e.target.value);
                    }}>
                        <option value="used_items">중고물품</option>
                        <option value="cars">자동차</option>
                        <option value="real_estates">부동산</option>
                    </select>
                </td>
                <td>
                    <select name="trade_type" id="" style={{width:'150px'}} value={tradeType} onChange={(e)=>{
                        setTradeType(e.target.value);
                    }}>
                        <option value="sale">판매</option>
                        <option value="auction">경매</option>
                        <option value="share">나눔</option>
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
                    <input type="file" name='photo' style={{width:'250px'}} multiple onChange={uploadImage}/>
                    </label>
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