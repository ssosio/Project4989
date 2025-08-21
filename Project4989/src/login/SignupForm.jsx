import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SignupForm() {
  // 1. 폼 데이터 State
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    confirmPassword: '', // 비밀번호 확인 필드 추가
    nickname: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState(''); // 비밀번호 확인 에러 추가
  const [idCheckMessage,setIdCheckMessage]= useState('');
  const [email, setEmail] = useState({ localPart: '', domain: '' });
  const [emailDomain, setEmailDomain] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('https://placehold.co/150x150');
  
  const emailDomains = ['naver.com', 'gmail.com', 'daum.net', 'nate.com', 'hanmail.net'];
  const fileInputRef = useRef(null);

  const navi = useNavigate();

  // 2. 핸들러 함수들
  useEffect(() => {
    if (emailDomain === 'direct') {
      setEmail(prev => ({ ...prev, domain: '' }));
    } else {
      setEmail(prev => ({ ...prev, domain: emailDomain }));
    }
  }, [emailDomain]);

  // 비밀번호 유효성 검사 로직
  useEffect(() => {
    const { password } = formData;
    // 10자 이상, 대문자, 특수문자, 숫자 포함 정규식
    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{10,}$/;
    
    if (password && !strongPasswordRegex.test(password)) {
      setPasswordError('비밀번호는 10자 이상이어야 하며, 대문자, 특수문자, 숫자를 포함해야 합니다.');
    } else {
      setPasswordError(''); // 유효하면 에러 메시지 없음
    }
  }, [formData.password]);

  // 비밀번호 확인 검증 로직 추가
  useEffect(() => {
    const { password, confirmPassword } = formData;
    
    if (confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
    } else if (confirmPassword && password === confirmPassword) {
      setConfirmPasswordError(''); // 일치하면 에러 메시지 없음
    }
  }, [formData.password, formData.confirmPassword]);

  // 아이디 입력란에서 포커스가 벗어났을 때 실행될 함수
  const handleIdBlur = async () => {
    if (!formData.loginId) {
      setIdCheckMessage('');
      return;
    }
    try {
      // 백엔드에 중복 확인 요청
      await axios.get(`http://localhost:4989/check-loginid?loginId=${formData.loginId}`);
      setIdCheckMessage({ text: '사용 가능한 아이디입니다.', color: 'green' });
    } catch (error) {
      // 409 Conflict 오류가 발생하면 중복된 아이디임
      if (error.response && error.response.status === 409) {
        setIdCheckMessage({ text: '이미 사용 중인 아이디입니다.', color: 'red' });
      } else {
        console.error('아이디 중복 확인 중 오류:', error);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleEmailChange = (e) => {
    setEmail({ ...email, [e.target.name]: e.target.value });
  };

  const handleSendCode = async () => {
    if (!phoneNumber) {
      alert('휴대폰 번호를 입력해주세요.');
      return;
    }
    try {
      // 실제 SMS 발송 대신 서버 콘솔에 인증번호를 출력하는 Mocking 방식 사용
      await axios.post('http://localhost:4989/sms/send', { phoneNumber });
      alert('인증번호가 발송되었습니다.');
      setIsCodeSent(true);
    } catch (error) {
      alert('인증번호 발송에 실패했습니다.');
      console.error(error);
    }
  };

  const handleVerifyCode = async () => {
    try {
      await axios.post('http://localhost:4989/sms/verify', { phoneNumber, code: verificationCode });
      alert('인증 성공!');
      setIsVerified(true);
    } catch (error) {
      alert('인증번호가 일치하지 않습니다.');
      console.error(error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      
      // 비밀번호 확인 검증
      if (formData.password !== formData.confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }
      
      const signupData = new FormData();
      
      // ✨ DTO의 각 필드를 개별적으로 FormData에 추가
      signupData.append('loginId', formData.loginId);
      signupData.append('password', formData.password);
      signupData.append('nickname', formData.nickname);
      signupData.append('email', `${email.localPart}@${email.domain}`);
      signupData.append('phoneNumber', phoneNumber);
      
      // 이미지 파일 추가
      if (profileImage) {
        signupData.append('profileImageFile', profileImage);
      }
      
      try {
        await axios.post('http://localhost:4989/signup', signupData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('회원가입 성공!');
        navi('/login');
      } catch (error) {
        alert('회원가입에 실패했습니다.');
        console.error(error);
      }
  };

  // 3. JSX 렌더링
  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit}>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img
            src={previewUrl}
            alt="Profile Preview"
            style={{ width: '120px', height: '120px', borderRadius: '50%', cursor: 'pointer', objectFit: 'cover' }}
            onClick={() => fileInputRef.current.click()}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            style={{ display: 'none' }}
            accept="image/*"
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>아이디</label>
          <input type="text" name="loginId" value={formData.loginId} onChange={handleChange} onBlur={handleIdBlur} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}/>
          {/* 중복 확인 메시지 표시 */}
          {idCheckMessage && <p style={{ color: idCheckMessage.color, fontSize: '12px', margin: '5px 0 0' }}>{idCheckMessage.text}</p>}
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>비밀번호</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}/>
          {passwordError && <p style={{ color: 'red', fontSize: '12px' }}>{passwordError}</p>}
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>비밀번호 확인</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}/>
          {confirmPasswordError && <p style={{ color: 'red', fontSize: '12px' }}>{confirmPasswordError}</p>}
          {formData.confirmPassword && !confirmPasswordError && <p style={{ color: 'green', fontSize: '12px' }}>✅ 비밀번호가 일치합니다.</p>}
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>닉네임</label>
          <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}/>
          
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>이메일</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input type="text" name="localPart" value={email.localPart} onChange={handleEmailChange} required style={{ width: '40%', padding: '8px' }}/>
            <span style={{ margin: '0 5px' }}>@</span>
            <input type="text" name="domain" value={email.domain} onChange={handleEmailChange} required disabled={emailDomain !== 'direct' && emailDomain !== ''} style={{ width: '40%', padding: '8px' }}/>
            <select value={emailDomain} onChange={(e) => setEmailDomain(e.target.value)} style={{ marginLeft: '10px', padding: '8px' }}>
              <option value="">선택</option>
              {emailDomains.map(d => <option key={d} value={d}>{d}</option>)}
              <option value="direct">직접입력</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>휴대폰 번호</label>
          <div style={{ display: 'flex' }}>
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required disabled={isVerified} style={{ flex: 1, padding: '8px' }}/>
            <button type="button" onClick={handleSendCode} disabled={isCodeSent} style={{ marginLeft: '10px' }}>
              인증번호 발송
            </button>
          </div>
        </div>

        {isCodeSent && !isVerified && (
          <div style={{ marginBottom: '15px' }}>
            <label>인증번호</label>
            <div style={{ display: 'flex' }}>
              <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} required style={{ flex: 1, padding: '8px' }}/>
              <button type="button" onClick={handleVerifyCode} style={{ marginLeft: '10px' }}>
                인증 확인
              </button>
            </div>
          </div>
        )}
        
        {isVerified && <p style={{color: 'green', fontWeight: 'bold'}}>✅ 휴대폰 인증이 완료되었습니다.</p>}

        <button type="submit" disabled={!isVerified} style={{ width: '100%', padding: '10px', marginTop: '10px', backgroundColor: isVerified ? '#007bff' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          가입하기
        </button>
      </form>
    </div>
  );
}

export default SignupForm;