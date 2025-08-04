import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // AuthContext import
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  // useContext를 사용해 Root 컴포넌트의 handleLoginSuccess 함수를 가져옵니다.
  const { handleLoginSuccess } = useContext(AuthContext);
  const navi = useNavigate();
  
  // 폼 입력값을 관리하는 state
  const [formData, setFormData] = useState({
    loginId: '',
    password: ''
  });

  // 입력값 변경 시 state를 업데이트하는 함수
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 폼 제출 시 실행되는 함수
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 백엔드 로그인 API 호출
      const response = await axios.post('http://localhost:4989/login', formData);
      // 서버로부터 받은 토큰 추출
      const { token } = response.data;

      // 토큰을 localStorage에 저장 (브라우저를 닫아도 유지됨)
      localStorage.setItem('jwtToken', token);
      
      // 토큰을 디코딩하여 payload(사용자 정보)를 추출합니다.
      const decodedToken = jwtDecode(token);
      const userInfo = {
        loginId: decodedToken.sub,
        nickname: decodedToken.nickname,
        profileImageUrl: decodedToken.profileImageUrl
      };
      
      // 이후 모든 axios 요청 헤더에 자동으로 토큰을 포함시킴
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Context에서 가져온 함수를 호출하여 Root의 상태를 업데이트합니다.
      handleLoginSuccess(userInfo);

      alert('로그인 성공!');
      navi('/'); // 로그인 성공 후 메인 페이지로 이동
      
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      alert('로그인 실패! 아이디 또는 비밀번호를 확인해주세요.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>로그인</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>아이디</label>
          <input type="text" name="loginId" value={formData.loginId} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}/>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>비밀번호</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}/>
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          로그인
        </button>
      </form>
    </div>
  );
}

export default LoginForm;