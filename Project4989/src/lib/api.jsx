// /src/lib/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:4989', // 기본값 설정
  withCredentials: false,
});

// 요청마다 Authorization 자동 부착
api.interceptors.request.use((config) => {
  // ★ 네 저장소 키와 맞춤: 'jwtToken' 또는 'accessToken' 아무거나 쓰게
  const raw = localStorage.getItem('jwtToken') || localStorage.getItem('accessToken');
  if (raw) {
    const jwt = raw.replace(/^Bearer\s+/,''); // 'Bearer ' 붙어있으면 제거
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  return config;
});

let refreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;
    if (!response) throw error;

    if (response.status === 401 && !config._retry) {
      config._retry = true;

      if (!refreshing) {
        refreshing = true;
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          const r = await axios.post(`${import.meta.env.VITE_API_BASE || 'http://localhost:4989'}/api/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', r.data.accessToken);

          queue.forEach((resolve) => resolve());
          queue = [];
          return api(config);
        } catch (e) {
          queue = [];
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          throw e;
        } finally {
          refreshing = false;
        }
      } else {
        await new Promise((resolve) => queue.push(resolve));
        return api(config);
      }
    }
    throw error;
  }
);

// 채팅신고 관련 API 함수들
export const chatDeclarationAPI = {
  // 관리자용 채팅신고 목록 조회
  getAllChatDeclarations: () => api.get('/api/chat-declarations/admin'),
  // 특정 회원의 채팅신고 목록 조회
  getChatDeclarationsForMember: (memberId) => api.get(`/api/chat-declarations/declarations?memberId=${memberId}`),
  // 채팅신고 제출
  submitChatDeclaration: (declarationData) => api.post('/api/chat-declarations/submit', declarationData)
};

// 사용자 정보 관련 API
export const userAPI = {
  getUserInfo: (memberId) => api.get(`/api/users/${memberId}`),
  getMultipleUsers: (memberIds) => api.post('/api/users/multiple', memberIds)
};

export default api;
