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
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ProfileSection = ({ userInfo }) => {
  const { handleLogout, updateUserInfo } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
  
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
      const response = await axios.get(`http://localhost:4989/member/profile?loginId=${userInfo.loginId}`, {
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

  // 프로필 수정 모드 토글
  const handleEditToggle = () => {
    if (isEditing) {
      // 수정 취소 시 원래 데이터로 복원
      fetchUserProfile();
    }
    setIsEditing(!isEditing);
  };

  // 프로필 정보 저장
  const handleProfileSave = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      await axios.put(`http://localhost:4989/member/profile?loginId=${userInfo.loginId}`, profileData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setMessage({ type: 'success', text: '프로필이 성공적으로 수정되었습니다.' });
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

      await axios.put(`http://localhost:4989/member/password?loginId=${userInfo.loginId}`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });
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
      console.error('비밀번호 변경 실패:', error);
      
      // 인증 오류 처리
      if (handleAuthError(error)) {
        return;
      }
      
      if (error.response?.status === 401) {
        setPasswordError('현재 비밀번호가 올바르지 않습니다.');
      } else {
        setPasswordError('비밀번호 변경에 실패했습니다.');
      }
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

  // 역할을 한국어로 변환하는 함수
  const formatRole = (role) => {
    switch (role) {
      case 'ROLE_USER':
        return '일반 회원';
      case 'ROLE_ADMIN':
        return '관리자';
      default:
        return '일반 회원';
    }
  };

  // 상태를 한국어로 변환하는 함수
  const formatStatus = (status) => {
    switch (status) {
      case 'ACTIVE':
        return '활성 회원';
      case 'BANNED':
        return '정지 회원';
      default:
        return '활성 회원';
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

  return (
    <Box>
      {/* 메시지 표시 */}
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 프로필 이미지 및 기본 정보 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                 <Avatar
                   src={profileData.profileImageUrl ? `http://localhost:4989${profileData.profileImageUrl}` : (userInfo.profileImageUrl ? `http://localhost:4989${userInfo.profileImageUrl}` : 'https://placehold.co/150x150')}
                   sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                   onError={(e) => {
                     console.log('Avatar image load error:', e);
                     e.target.src = 'https://placehold.co/150x150';
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
                  label={formatStatus(profileData.status)} 
                  color={profileData.status === 'ACTIVE' ? 'success' : 'error'} 
                  size="small" 
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={formatRole(profileData.role)} 
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
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">회원 정보</Typography>
                <Box>
                  {!isEditing ? (
                    <Button
                      startIcon={<EditIcon />}
                      variant="outlined"
                      onClick={handleEditToggle}
                    >
                      수정
                    </Button>
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

              {/* 비밀번호 변경 버튼 */}
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button
                  startIcon={<LockIcon />}
                  variant="outlined"
                  color="primary"
                  onClick={handlePasswordDialogOpen}
                >
                  비밀번호 변경
                </Button>
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
    </Box>
  );
};

export default ProfileSection;
