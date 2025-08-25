import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  IconButton,
  Chip,
  Paper
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Lock as LockIcon,
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TestModal from '../chat/AddMemberAddress.jsx';

const ProfileSection = ({ userInfo }) => {
  const { handleLogout, updateUserInfo } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true); // 주소 목록 로딩 상태

  // 주소 목록 상태 추가
  const [addresses, setAddresses] = useState([
    // 임시 데이터 (나중에 API에서 가져올 예정) - 동까지만 표시
    { id: 1, address: '서울시 강남구 압구정동' },
    { id: 2, address: '서울시 서초구 서초동' },
    { id: 3, address: '부산시 해운대구 우동' }
  ]);

  // 프로필 정보 상태
  const [profileData, setProfileData] = useState({
    nickname: userInfo.nickname || '',
    email: '',
    phoneNumber: '',
    profileImageUrl: userInfo.profileImageUrl || ''
  });

  // 비밀번호 변경 상태
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // SMS 인증 상태
  const [smsData, setSmsData] = useState({
    phoneNumber: '',
    verificationCode: '',
    isCodeSent: false,
    isVerified: false
  });

  // 에러 및 성공 메시지
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordError, setPasswordError] = useState('');

  // 컴포넌트 마운트 시 사용자 정보 가져오기
  useEffect(() => {
    fetchUserProfile();
    fetchMemberAddresses(); // 컴포넌트 마운트 시 주소 목록 로드
  }, []);

  // 토큰 유효성 검사 및 자동 로그아웃 처리
  const handleAuthError = (error) => {
    if (error.response?.status === 401) {
      console.log('인증 오류 발생, 자동 로그아웃 처리');
      setMessage({ type: 'error', text: '인증이 만료되었습니다. 다시 로그인해주세요.' });
      setTimeout(() => {
        handleLogout();
        navigate('/login');
      }, 2000);
      return true; // 인증 오류 처리됨
    }
    return false; // 인증 오류가 아님
  };

  // 사용자 프로필 정보 가져오기
  const fetchUserProfile = async () => {
    try {
      // 토큰이 있는지 확인
      const token = localStorage.getItem('jwtToken');
      console.log('Token from localStorage:', token);
      if (!token) {
        console.log('No token found!');
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        setTimeout(() => {
          handleLogout();
          navigate('/login');
        }, 2000);
        return;
      }

      console.log('Making request with token:', token);
      const response = await axios.get(`${import.meta.env.VITE_API_BASE}/member/profile?loginId=${userInfo.loginId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const userData = response.data;

      setProfileData({
        nickname: userData.nickname || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        createdAt: userData.createdAt || '',
        role: userData.role || '',
        status: userData.status || '',
        tier: userData.tier || '',
        profileImageUrl: userData.profileImageUrl || ''
      });

      // userInfo도 업데이트하여 초기 로딩 시에도 이미지가 표시되도록 함
      if (userData.profileImageUrl && userData.profileImageUrl !== userInfo.profileImageUrl) {
        const updatedUserInfo = {
          ...userInfo,
          profileImageUrl: userData.profileImageUrl
        };
        updateUserInfo(updatedUserInfo);
      }

      // 디버깅을 위한 로그
      console.log('Profile data updated:', {
        profileData: userData,
        profileImageUrl: userData.profileImageUrl,
        fullUrl: userData.profileImageUrl ? `http://localhost:4989${userData.profileImageUrl}` : 'No URL',
        role: userData.role,
        status: userData.status
      });
    } catch (error) {
      console.error('프로필 정보를 가져오는데 실패했습니다:', error);

      // 인증 오류 처리
      if (handleAuthError(error)) {
        return;
      }

      setMessage({ type: 'error', text: '프로필 정보를 가져오는데 실패했습니다.' });
    }
  };

  // 주소 목록 불러오기 (DB 연동)
  const fetchMemberAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const token = localStorage.getItem('jwtToken');
      
      if (!token) {
        console.log('No token found for address fetch!');
        return;
      }

      const response = await axios.get(`http://localhost:4989/api/member-region/addresses?loginId=${userInfo.loginId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('API 응답 원본 데이터:', response.data);
      
      // API 응답을 UI에 맞게 변환 (동까지만 표시)
      const formattedAddresses = response.data.map(item => ({
        id: item.member_region_id,
        address: `${item.province} ${item.city || ''} ${item.district || ''} ${item.town}`.trim(),
        memberRegionId: item.member_region_id,
        regionId: item.region_id,
        isPrimary: item.is_primary === 1 || item.is_primary === true
      }));
      
      console.log('변환된 주소 데이터:', formattedAddresses);
      console.log('is_primary 값들:', response.data.map(item => ({ id: item.member_region_id, is_primary: item.is_primary, isPrimary: item.is_primary === 1 })));
      
      setAddresses(formattedAddresses);
      console.log('주소 목록 로드 성공:', formattedAddresses);
    } catch (error) {
      console.error('주소 목록 조회 실패:', error);
      if (handleAuthError(error)) return;
      setMessage({ type: 'error', text: '주소 목록을 불러오는데 실패했습니다.' });
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  // 프로필 수정 모드 토글
  const handleEditToggle = () => {
    if (isEditing) {
      // 수정 취소 시 원래 데이터로 복원
      fetchUserProfile();
    }
    setIsEditing(!isEditing);
  };

  const handleAddressRegistrationClick = () => {
    setIsModalOpen(true); // 3. 버튼 클릭 시 모달 상태를 true로 변경합니다.
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // 4. 모달을 닫는 함수를 만듭니다.
  };

  // 프로필 정보 저장
  const handleProfileSave = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      const response = await axios.put(`http://localhost:4989/member/profile?loginId=${userInfo.loginId}`, profileData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 새로운 토큰과 메시지 받기
      const { message: responseMessage, token: newToken } = response.data;
      
      // 새로운 토큰을 localStorage에 저장
      localStorage.setItem('jwtToken', newToken);
      
      // axios 헤더에 새로운 토큰 설정
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // 새로운 토큰으로 사용자 정보 디코딩
      const { jwtDecode } = await import('jwt-decode');
      const decodedToken = jwtDecode(newToken);
      
      // 업데이트된 사용자 정보로 전역 상태 업데이트
      const updatedUserInfo = {
        loginId: decodedToken.sub,
        memberId: decodedToken.memberId,
        nickname: decodedToken.nickname,
        role: decodedToken.role,
        profileImageUrl: decodedToken.profileImageUrl
      };
      
      // AuthContext의 updateUserInfo 함수 호출
      updateUserInfo(updatedUserInfo);

      setMessage({ type: 'success', text: responseMessage });
      setIsEditing(false);

      // 성공 메시지 3초 후 제거
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('프로필 수정에 실패했습니다:', error);

      // 인증 오류 처리
      if (handleAuthError(error)) {
        return;
      }

      setMessage({ type: 'error', text: '프로필 수정에 실패했습니다.' });
    }
  };

  // 비밀번호 변경 다이얼로그 열기
  const handlePasswordDialogOpen = () => {
    setIsPasswordDialogOpen(true);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
  };

  // SMS 인증 다이얼로그 열기
  const handleSmsDialogOpen = () => {
    setIsSmsDialogOpen(true);
    setSmsData({
      phoneNumber: profileData.phoneNumber || '',
      verificationCode: '',
      isCodeSent: false,
      isVerified: false
    });
  };

  // SMS 인증번호 발송
  const handleSendSmsCode = async () => {
    if (!smsData.phoneNumber) {
      setMessage({ type: 'error', text: '휴대폰 번호를 입력해주세요.' });
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      await axios.post('http://localhost:4989/sms/send', {
        phoneNumber: smsData.phoneNumber
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSmsData(prev => ({ ...prev, isCodeSent: true }));
      setMessage({ type: 'success', text: '인증번호가 발송되었습니다. (서버 콘솔을 확인하세요)' });
    } catch (error) {
      console.error('SMS 발송 실패:', error);

      // 인증 오류 처리
      if (handleAuthError(error)) {
        return;
      }

      setMessage({ type: 'error', text: '인증번호 발송에 실패했습니다.' });
    }
  };

  // SMS 인증번호 확인
  const handleVerifySmsCode = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      await axios.post('http://localhost:4989/sms/verify', {
        phoneNumber: smsData.phoneNumber,
        code: smsData.verificationCode
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSmsData(prev => ({ ...prev, isVerified: true }));
      setMessage({ type: 'success', text: '인증이 완료되었습니다!' });
    } catch (error) {
      console.error('SMS 인증 실패:', error);

      // 인증 오류 처리
      if (handleAuthError(error)) {
        return;
      }

      setMessage({ type: 'error', text: '인증번호가 올바르지 않습니다.' });
    }
  };

  // 비밀번호 변경 처리
  const handlePasswordChange = async () => {
    // 비밀번호 유효성 검사
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordData.newPassword.length < 10) {
      setPasswordError('새 비밀번호는 10자 이상이어야 합니다.');
      return;
    }

    // 강력한 비밀번호 정규식 (대문자, 특수문자, 숫자 포함)
    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{10,}$/;
    if (!strongPasswordRegex.test(passwordData.newPassword)) {
      setPasswordError('비밀번호는 10자 이상이어야 하며, 대문자, 특수문자, 숫자를 포함해야 합니다.');
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      const response = await axios.put(`http://localhost:4989/member/password?loginId=${userInfo.loginId}`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 새로운 토큰과 메시지 받기
      const { message: responseMessage, token: newToken } = response.data;
      
      // 새로운 토큰을 localStorage에 저장
      localStorage.setItem('jwtToken', newToken);
      
      // axios 헤더에 새로운 토큰 설정
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // 새로운 토큰으로 사용자 정보 디코딩
      const { jwtDecode } = await import('jwt-decode');
      const decodedToken = jwtDecode(newToken);
      
      // 업데이트된 사용자 정보로 전역 상태 업데이트
      const updatedUserInfo = {
        loginId: decodedToken.sub,
        memberId: decodedToken.memberId,
        nickname: decodedToken.nickname,
        role: decodedToken.role,
        profileImageUrl: decodedToken.profileImageUrl
      };
      
      // AuthContext의 updateUserInfo 함수 호출
      updateUserInfo(updatedUserInfo);

      setMessage({ type: 'success', text: responseMessage });
      setIsPasswordDialogOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordError('');

      // 성공 메시지 3초 후 제거
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('비밀번호 변경에 실패했습니다:', error);

      // 인증 오류 처리
      if (handleAuthError(error)) {
        return;
      }

      setMessage({ type: 'error', text: '비밀번호 변경에 실패했습니다.' });
    }
  };

  // 가입일 포맷팅 함수
  const formatJoinDate = (timestamp) => {
    if (!timestamp) return '정보 없음';

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '정보 없음';

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      return `${year}년 ${month}월 ${day}일`;
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return '정보 없음';
    }
  };

  // 프로필 이미지 변경
  const handleProfileImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '이미지 파일만 선택 가능합니다.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB 제한
      setMessage({ type: 'error', text: '파일 크기는 5MB 이하여야 합니다.' });
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      // FormData 생성
      const formData = new FormData();
      formData.append('profileImageFile', file);

      const response = await axios.put(`http://localhost:4989/member/profile-image?loginId=${userInfo.loginId}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.imageUrl) {
        // 프로필 이미지 URL 업데이트
        setProfileData(prev => ({ ...prev, profileImageUrl: response.data.imageUrl }));

        // userInfo도 업데이트하여 헤더에 즉시 반영
        const updatedUserInfo = {
          ...userInfo,
          profileImageUrl: response.data.imageUrl
        };
        updateUserInfo(updatedUserInfo);

        setMessage({ type: 'success', text: '프로필 사진이 성공적으로 변경되었습니다.' });

        // 성공 메시지 3초 후 제거
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('프로필 사진 변경 실패:', error);

      // 인증 오류 처리
      if (handleAuthError(error)) {
        return;
      }

      setMessage({ type: 'error', text: '프로필 사진 변경에 실패했습니다.' });
    }
  };

  // 주소 삭제 함수 (DB 연동)
  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('정말로 이 주소를 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      // member_regions 테이블에서 해당 주소 삭제
      await axios.delete(`http://localhost:4989/api/member-region/addresses/${addressId}?loginId=${userInfo.loginId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // 성공 시 주소 목록 새로고침 (DB에서 최신 상태 가져오기)
      fetchMemberAddresses();
      
      setMessage({ type: 'success', text: '주소가 삭제되었습니다.' });
      
      // 성공 메시지 3초 후 제거
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('주소 삭제 실패:', error);
      if (handleAuthError(error)) return;
      setMessage({ type: 'error', text: '주소 삭제에 실패했습니다.' });
    }
  };

  // 새 주소 추가 함수
  const handleAddNewAddress = () => {
    setIsModalOpen(true);
  };

  // 주소 추가 완료 후 콜백
  const handleAddressAdded = () => {
    // 주소 목록 새로고침
    fetchMemberAddresses();
  };
  
  // 일반주소를 기본주소로 변경
  const handleSetAsPrimary = async (addressId) => {
    if (!window.confirm('이 주소를 기본주소로 변경하시겠습니까?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      
      const response = await axios.put(
        `http://localhost:4989/api/member-region/addresses/${addressId}/set-primary?loginId=${userInfo.loginId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200) {
        setMessage({ type: 'success', text: '기본주소가 성공적으로 변경되었습니다.' });
        // 주소 목록 새로고침
        fetchMemberAddresses();
        
        // 성공 메시지 3초 후 제거
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('기본주소 변경 실패:', error);
      if (handleAuthError(error)) return;
      setMessage({ type: 'error', text: '기본주소 변경에 실패했습니다.' });
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 'none' }}>
      {/* 메시지 표시 */}
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={4} sx={{ width: '100%' }}>
        {/* 프로필 이미지 및 기본 정보 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ width: '100%', minWidth: '180px' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={profileData.profileImageUrl ? `http://localhost:4989${profileData.profileImageUrl}` : (userInfo.profileImageUrl ? `http://localhost:4989${userInfo.profileImageUrl}` : 'https://placehold.co/150x150')}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                  onError={(e) => {
                    console.log('Avatar image load error:', e);
                    e.target.src = 'https://placehold.co/120x120';
                  }}
                />
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="profile-image-input"
                  type="file"
                  onChange={handleProfileImageChange}
                />
                <label htmlFor="profile-image-input">
                  <IconButton
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': { backgroundColor: 'primary.dark' }
                    }}
                  >
                    <PhotoCameraIcon />
                  </IconButton>
                </label>
              </Box>

              <Typography variant="h6" gutterBottom>
                {userInfo.nickname}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {userInfo.loginId}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Chip
                  label={profileData.status === 'ACTIVE' ? '활성 회원' : '정지 회원'}
                  color={profileData.status === 'ACTIVE' ? 'success' : 'error'}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={profileData.role === 'ROLE_ADMIN' ? '관리자' : '일반 회원'}
                  variant="outlined"
                  size="small"
                  color={profileData.role === 'ROLE_ADMIN' ? 'error' : 'primary'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 상세 정보 및 수정 폼 */}
        <Grid item xs={12} md={8}>
          <Card sx={{ width: '100%', minWidth: '1100px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">회원 정보</Typography>
                <Box>
                  {!isEditing ? (
                    <Box>
                      <Button
                        startIcon={<EditIcon />}
                        variant="outlined"
                        onClick={handleEditToggle}
                        sx={{ mr: 2 }}
                      >
                        수정
                      </Button>
                      <Button
                        startIcon={<LockIcon />}
                        variant="outlined"
                        color="primary"
                        onClick={handlePasswordDialogOpen}
                      >
                        비밀번호 변경
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Button
                        startIcon={<SaveIcon />}
                        variant="contained"
                        onClick={handleProfileSave}
                        sx={{ mr: 1 }}
                      >
                        저장
                      </Button>
                      <Button
                        startIcon={<CancelIcon />}
                        variant="outlined"
                        onClick={handleEditToggle}
                      >
                        취소
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="닉네임"
                    value={profileData.nickname}
                    onChange={(e) => setProfileData(prev => ({ ...prev, nickname: e.target.value }))}
                    disabled={!isEditing}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="이메일"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    margin="normal"
                    type="email"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="휴대폰 번호"
                    value={profileData.phoneNumber}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    disabled={!isEditing}
                    margin="normal"
                    type="tel"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="가입일"
                    value={profileData.createdAt ? formatJoinDate(profileData.createdAt) : '정보 없음'}
                    disabled
                    margin="normal"
                  />
                </Grid>
              </Grid>

              {/* 주소 목록 섹션 추가 */}
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>
                  주소 설정
                </Typography>

                <Grid container spacing={2} sx={{ width: '100%' }}>
                  {/* 기존 주소들 */}
                  {isLoadingAddresses ? (
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          border: '1px solid #e0e0e0',
                          borderRadius: 2,
                          backgroundColor: '#fafafa',
                          minHeight: '80px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          주소 목록을 불러오는 중입니다...
                        </Typography>
                      </Paper>
                    </Grid>
                  ) : addresses.length === 0 ? (
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          border: '1px solid #e0e0e0',
                          borderRadius: 2,
                          backgroundColor: '#fafafa',
                          minHeight: '80px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          등록된 주소가 없습니다
                        </Typography>
                      </Paper>
                    </Grid>
                  ) : (
                    addresses.map((address) => (
                      <Grid item xs={12} sm={6} md={4} key={address.id}>
                        <Paper
                          elevation={2}
                          sx={{
                            p: 2,
                            position: 'relative',
                            border: address.isPrimary ? '2px solid #1976d2' : '1px solid #e0e0e0',
                            borderRadius: 2,
                            backgroundColor: address.isPrimary ? '#f3f8ff' : 'white',
                            minHeight: '80px',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: address.isPrimary ? 'default' : 'pointer',
                            '&:hover': {
                              boxShadow: 4,
                              borderColor: address.isPrimary ? '#1976d2' : '#1976d2'
                            }
                          }}
                          onClick={() => !address.isPrimary && handleSetAsPrimary(address.id)}
                        >
                          {/* 기본주소 배지 (좌측 상단) */}
                          {address.isPrimary && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                left: 4,
                                backgroundColor: '#1976d2',
                                color: 'white',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}
                            >
                              기본주소
                            </Box>
                          )}

                          {/* 삭제 버튼 (우측 상단) */}
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation(); // 클릭 이벤트 전파 방지
                              handleDeleteAddress(address.id);
                            }}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              color: '#999',
                              backgroundColor: '#f5f5f5',
                              '&:hover': {
                                color: '#d32f2f',
                                backgroundColor: '#ffebee'
                              }
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>

                          {/* 주소 내용 - 동까지만 표시 */}
                          <Box sx={{ 
                            pr: 3, 
                            flex: 1, 
                            mt: address.isPrimary ? 2.5 : 0 
                          }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: address.isPrimary ? 600 : 500,
                                color: address.isPrimary ? '#1976d2' : '#333',
                                lineHeight: 1.4
                              }}
                            >
                              {address.address}
                            </Typography>
                            {!address.isPrimary && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#666',
                                  fontSize: '0.75rem',
                                  mt: 0.5,
                                  display: 'block'
                                }}
                              >
                                클릭하여 기본주소로 설정
                              </Typography>
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    ))
                  )}

                  {/* 새 주소 추가 버튼 */}
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        border: '2px dashed #ddd',
                        borderRadius: 2,
                        backgroundColor: '#fafafa',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '80px',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#1976d2',
                          backgroundColor: '#f3f8ff',
                          transform: 'translateY(-2px)',
                          boxShadow: 2
                        }
                      }}
                      onClick={handleAddNewAddress}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <AddIcon sx={{ fontSize: 28, color: '#666', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          새 주소 추가
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 비밀번호 변경 다이얼로그 */}
      <Dialog open={isPasswordDialogOpen} onClose={() => setIsPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>비밀번호 변경</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            보안을 위해 SMS 인증이 필요합니다.
          </Typography>

          <Button
            variant="contained"
            onClick={handleSmsDialogOpen}
            sx={{ mb: 2 }}
          >
            SMS 인증하기
          </Button>

          {smsData.isVerified && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="현재 비밀번호"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                margin="normal"
              />
              <TextField
                fullWidth
                label="새 비밀번호"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                margin="normal"
                helperText="10자 이상, 대문자, 특수문자, 숫자 포함"
              />
              <TextField
                fullWidth
                label="새 비밀번호 확인"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                margin="normal"
              />

              {passwordError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {passwordError}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPasswordDialogOpen(false)}>취소</Button>
          {smsData.isVerified && (
            <Button onClick={handlePasswordChange} variant="contained">
              비밀번호 변경
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* SMS 인증 다이얼로그 */}
      <Dialog open={isSmsDialogOpen} onClose={() => setIsSmsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>SMS 인증</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="휴대폰 번호"
            value={smsData.phoneNumber}
            onChange={(e) => setSmsData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            margin="normal"
            type="tel"
            disabled={smsData.isCodeSent}
          />

          {!smsData.isCodeSent ? (
            <Button
              fullWidth
              variant="contained"
              onClick={handleSendSmsCode}
              sx={{ mt: 2 }}
            >
              인증번호 발송
            </Button>
          ) : (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="인증번호"
                value={smsData.verificationCode}
                onChange={(e) => setSmsData(prev => ({ ...prev, verificationCode: e.target.value }))}
                margin="normal"
                placeholder="6자리 인증번호를 입력하세요"
              />

              {!smsData.isVerified ? (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleVerifySmsCode}
                  sx={{ mt: 2 }}
                >
                  인증 확인
                </Button>
              ) : (
                <Alert severity="success" sx={{ mt: 2 }}>
                  ✅ 인증이 완료되었습니다!
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSmsDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
      {isModalOpen && <TestModal onClose={handleCloseModal} onAddressAdded={handleAddressAdded} />}
    </Box>

  );
};

export default ProfileSection;