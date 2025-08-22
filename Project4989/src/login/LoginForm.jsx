import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

// props로 onLoginSuccess 함수를 받습니다.
function LoginForm({ onLoginSuccess }) {
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
    const base = import.meta.env.VITE_API_BASE;

    // JSON으로만 보냄: 서버가 username을 기대하든 loginId를 기대하든 OK
    const payload = {
      id: formData.loginId,
      username: formData.loginId,   // 백엔드가 username 기대할 때 대비
      loginId: formData.loginId,    // 백엔드가 loginId 기대할 때 대비
      password: formData.password,
    };

    const res = await axios.post(`${base}/login`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    const token = res.data?.token || res.data?.accessToken || res.data?.jwt;
    if (!token) throw new Error("토큰 없음");

    localStorage.setItem("jwtToken", token);
    const decoded = jwtDecode(token);
    const userInfo = {
      loginId: decoded.sub,
      memberId: decoded.memberId,
      nickname: decoded.nickname,
      profileImageUrl: decoded.profileImageUrl,
    };
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    onLoginSuccess(userInfo);
    alert("로그인 성공!");
    navi("/");
  } catch (err) {
    console.error("로그인 중 오류 발생:", err);
    alert(
      (err?.response?.data && typeof err.response.data === "string")
        ? err.response.data
        : "로그인 실패! 아이디 또는 비밀번호를 확인해주세요."
    );
  }
};

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>로그인</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>아이디</label>
          <input type="text" name="loginId" value={formData.loginId} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>비밀번호</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>

        {/* 소셜로그인 */}
        <button type='button' onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE}/oauth2/authorization/kakao`}>
          카카오로 로그인
        </button>
        <br />
        <button type='button' onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE}/oauth2/authorization/google`}>
          구글로 로그인
        </button>

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          로그인
        </button>
      </form>
    </div>
  );
}

export default LoginForm;