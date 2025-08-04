package boot.sagu.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import boot.sagu.dto.MemberDto;
import boot.sagu.mapper.MemberMapper;

@Service
public class MemberService implements MemberServiceInter {

    @Autowired
    private MemberMapper memberMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void signup(MemberDto dto) {
        // 비밀번호를 암호화
        String encodedPassword = passwordEncoder.encode(dto.getPassword());
        // 암호화된 비밀번호를 DTO에 다시 설정
        dto.setPassword(encodedPassword);
        // 암호화된 DTO를 DB에 저장
        memberMapper.signup(dto);
    }

	@Override
	public MemberDto getMemberByLoginId(String loginId) {
		// TODO Auto-generated method stub
		return memberMapper.findByLoginId(loginId);
	}
}