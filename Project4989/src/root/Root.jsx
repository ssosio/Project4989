import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import RouterMain from './RouterMain';
import { AuthContext } from '../context/AuthContext'; // AuthContext 경로 확인
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const Root = () => {
  // 앱 전체에서 사용할 로그인 사용자 정보를 담을 state
  const [userInfo, setUserInfo] = useState(null);

  // 컴포넌트가 처음 렌더링될 때(새로고침 등) 한 번만 실행되는 자동 로그인 로직
  useEffect(() => {
    // localStorage에서 토큰을 가져옵니다.
    const token = localStorage.getItem('jwtToken');

    // 토큰이 존재하면 디코딩하여 사용자 정보를 state에 저장합니다.
    if (token) {
      const decodedToken = jwtDecode(token);
      setUserInfo({
        loginId: decodedToken.sub,
        memberId: decodedToken.memberId,
        nickname: decodedToken.nickname,
        profileImageUrl: decodedToken.profileImageUrl
      });
      // 새로고침 후에도 모든 axios 요청 헤더에 토큰을 포함시킵니다.
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []); // []를 비워두면 최초 1회만 실행됩니다.

  // 로그인 성공 시 LoginForm에서 호출될 함수
  const handleLoginSuccess = (userData) => {
    setUserInfo(userData);
  };

  // 로그아웃 시 Header에서 호출될 함수
  const handleLogout = () => {
    localStorage.removeItem('jwtToken'); // localStorage에서 토큰 삭제
    delete axios.defaults.headers.common['Authorization']; // axios 헤더에서 토큰 제거
    setUserInfo(null); // userInfo 상태를 null로 변경하여 로그아웃 처리
  };

  return (
    // AuthContext.Provider로 하위 컴포넌트들을 감싸줍니다.
    // value 안에 공유하고 싶은 모든 값(userInfo, 함수 등)을 넣습니다.
    <AuthContext.Provider value={{ userInfo, handleLoginSuccess, handleLogout }}>
      <BrowserRouter>
        <RouterMain />
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

export default Root;