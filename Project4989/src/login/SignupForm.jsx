import React, { useState } from 'react';
import axios from 'axios'; // 👈 axios를 import 합니다.

function SignupForm() {
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    nickname: '',
    email: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        // ✅ 주소를 '/signup'으로 변경
        await axios.post('http://localhost:4989/signup', formData);

        // 회원가입 성공 메시지 표시
        alert('회원가입 성공! 이제 로그인해주세요.');

        // 성공 후 폼 초기화
        setFormData({
          loginId: '',
          password: '',
          nickname: '',
          email: ''
        });

    } catch (error) {
        console.error('회원가입 중 오류 발생:', error);
        alert('회원가입 실패!');
    }
};

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>회원가입 테스트 폼 (axios)</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>아이디</label>
          <input
            type="text"
            name="loginId"
            value={formData.loginId}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>비밀번호</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>닉네임</label>
          <input
            type="text"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>이메일</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          가입하기
        </button>
      </form>
    </div>
  );
}

export default SignupForm;