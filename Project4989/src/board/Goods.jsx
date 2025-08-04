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

  //  photoUrl="http://localhost:4989/save/";

  return (
    <div>

      <button type='button' style={{width:'150px', backgroundColor:'beige'}}  onClick={()=>{
        navi("/board/post");
      }}>등록</button>


      <table>
      
  <tbody>
    {postList.map(p => (
      <tr key={p.id}>
        <td style={{width:'100px', height:'130px', border:'1px solid grey'}}><img src="" alt="" /></td>
        <td>{p.member_id}</td>
        <td>{p.title}</td>
        <td>{new Intl.NumberFormat().format(p.price)}원</td>
        <td>{new Date(p.created_at).toLocaleString()}</td>
      </tr>
    ))}
  </tbody>
      </table>
    </div>
  )
}

export default Goods
