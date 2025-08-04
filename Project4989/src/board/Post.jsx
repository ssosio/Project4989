import React from 'react'

const Post = () => {
  return (
    <div>
        <table>
            <tr>
                <td>
                    <select name="post_type" id="" style={{width:'150px'}}>
                        <option value="used_items">중고물품</option>
                        <option value="cars">자동차</option>
                        <option value="real_estates">부동산</option>
                    </select>
                </td>
                <td>
                    <select name="trade_type" id="" style={{width:'150px'}}>
                        <option value="sale">판매</option>
                        <option value="auction">경매</option>
                        <option value="share">나눔</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td>
                    <label>제목
                    <input type="text" name='title' style={{width:'250px'}}/>
                    </label>
                </td>
            </tr>
            <tr>
                <td>
                    <label>가격
                    <input type="text" name='price' style={{width:'150px'}}/>
                    </label>
                </td>
            </tr>
            <tr>
                <td colSpan='4'>
                    <textarea name="content" id="" style={{width:'400px',height:'150px'}}></textarea>
                </td>
            </tr>
            <tr>
                <td>
                    <label>사진
                    <input type="file" name='photo' style={{width:'250px'}}/>
                    </label>
                </td>
            </tr>
            <tr>
                <button type='button' style={{width:'130px', backgroundColor:'bisque',marginRight:'30px'}}>등록</button>
                <button type='button' style={{width:'130px', backgroundColor:'bisque'}}>목록</button>
            </tr>
        </table>
    </div>
  )
}

export default Post