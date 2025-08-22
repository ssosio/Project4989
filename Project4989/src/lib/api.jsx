// /src/lib/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE, // 예: http://localhost:4989
  withCredentials: false,
});

// 요청마다 Authorization 자동 부착
api.interceptors.request.use((config) => {
  // ★ 네 저장소 키와 맞춤: 'jwtToken' 또는 'accessToken' 아무거나 쓰게
  const raw = localStorage.getItem('jwtToken') || localStorage.getItem('accessToken');
  console.log('API 요청 - 토큰 확인:', raw ? '있음' : '없음');
  
  if (raw) {
    const jwt = raw.replace(/^Bearer\s+/,''); // 'Bearer ' 붙어있으면 제거
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${jwt}`;
    console.log('API 요청 - Authorization 헤더 설정:', `Bearer ${jwt.substring(0, 20)}...`);
  } else {
    console.log('API 요청 - 토큰 없음, 헤더 설정 안함');
  }
  return config;
});



api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response } = error;
    if (!response) throw error;

    if (response.status === 401) {
      console.log('인증 만료, 로그아웃 처리');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('jwtToken');
      window.location.href = '/login';
    }
    throw error;
  }
);

export default api;
