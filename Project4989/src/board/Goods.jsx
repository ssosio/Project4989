import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

const Goods = () => {

  const navi=useNavigate();

  const [postList,setPostList]=useState([]);

  const list=()=>{
    let url="http://localhost:4989/post/list";

    axios.get(url)
    .then(res=>{

      console.log(res.data);
      setPostList(res.data);

    })

    .catch(err => {
      console.error("에러 발생:", err);
    });
};


       useEffect(()=>{

           console.log("list");
          list();
       },[])

        useEffect(() => {
    console.log(postList); // mainPhotoUrl 값 확인
  }, [postList]);

  const photoUrl="http://localhost:4989/save/";

  return (
    <div>

      <button type='button' style={{width:'150px', backgroundColor:'beige',color:'#000'}}  onClick={()=>{
        navi("/board/post");
      }}>등록</button>


      <table>
      
  <tbody>
    {postList.map(p => (
      <tr key={p.postId}>
        <td style={{width:'100px', height:'130px', border:'1px solid grey'}}>
          {p.mainPhotoUrl ? (
            <img 
              src={photoUrl + p.mainPhotoUrl} 
              alt={p.title} 
              style={{width:'100%', height:'100%', objectFit:'cover'}}
            />
          ) : (
            <div style={{width:'100%', height:'100%', backgroundColor:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center'}}>
              이미지 없음
            </div>
          )}
        </td>
        <td>{p.memberId}</td>
        <td>{p.title}</td>
        <td>{p.price ? new Intl.NumberFormat().format(p.price) + '원' : '가격 미정'}</td>
        <td>{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</td>
      </tr>
    ))}
  </tbody>
      </table>
    </div>
  )
}

export default Goods
