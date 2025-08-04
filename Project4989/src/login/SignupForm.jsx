import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function SignupForm() {
  // 1. 폼 데이터 State
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    nickname: ''
  });
  const [email, setEmail] = useState({ localPart: '', domain: '' });
  const [emailDomain, setEmailDomain] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('https://placehold.co/150x150');
  
  const emailDomains = ['naver.com', 'gmail.com', 'daum.net', 'nate.com', 'hanmail.net'];
  const fileInputRef = useRef(null);

  // 2. 핸들러 함수들
  useEffect(() => {
    if (emailDomain === 'direct') {
      setEmail(prev => ({ ...prev, domain: '' }));
    } else {
      setEmail(prev => ({ ...prev, domain: emailDomain }));
    }
  }, [emailDomain]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleEmailChange = (e) => {
    setEmail({ ...email, [e.target.name]: e.target.value });
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
    
    // FormData 객체 생성
    const signupData = new FormData();
    
    // ✨ DTO의 각 필드를 개별적으로 FormData에 추가합니다.
    signupData.append('loginId', formData.loginId);
    signupData.append('password', formData.password);
    signupData.append('nickname', formData.nickname);
    signupData.append('email', `${email.localPart}@${email.domain}`);
    signupData.append('phoneNumber', phoneNumber);
    
    // 이미지 파일 추가 (선택된 경우에만)
    if (profileImage) {
      // ✨ Controller의 @RequestParam 이름과 동일하게 'profileImageFile'로 설정
      signupData.append('profileImageFile', profileImage);
    }
    
    try {
      // 서버로 FormData 전송
      await axios.post('http://localhost:4989/signup', signupData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('회원가입 성공! 이제 로그인해주세요.');
    } catch (error) {
      alert('회원가입에 실패했습니다.');
      console.error(error);
    }
};

  // 3. JSX 렌더링
  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>회원가입 (이미지 테스트용)</h2>
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
          {/* ✨ required 속성 제거 */}
          <input type="text" name="loginId" value={formData.loginId} onChange={handleChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}/>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>비밀번호</label>
          {/* ✨ required 속성 제거 */}
          <input type="password" name="password" value={formData.password} onChange={handleChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}/>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>닉네임</label>
          {/* ✨ required 속성 제거 */}
          <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}/>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>이메일</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input type="text" name="localPart" value={email.localPart} onChange={handleEmailChange} style={{ width: '40%', padding: '8px' }}/>
            <span style={{ margin: '0 5px' }}>@</span>
            <input type="text" name="domain" value={email.domain} onChange={handleEmailChange} disabled={emailDomain !== 'direct' && emailDomain !== ''} style={{ width: '40%', padding: '8px' }}/>
            <select value={emailDomain} onChange={(e) => setEmailDomain(e.target.value)} style={{ marginLeft: '10px', padding: '8px' }}>
              <option value="">선택</option>
              {emailDomains.map(d => <option key={d} value={d}>{d}</option>)}
              <option value="direct">직접입력</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>휴대폰 번호 (인증 생략)</label>
          <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}/>
        </div>
        
        {/* ✨ '가입하기' 버튼에서 disabled 속성 제거 */}
        <button type="submit" style={{ width: '100%', padding: '10px', marginTop: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          가입하기 (테스트)
        </button>
      </form>
    </div>
  );
}

export default SignupForm;