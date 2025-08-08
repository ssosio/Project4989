package boot.sagu.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import boot.sagu.dto.MemberDto;
import boot.sagu.dto.SocialAccountDto;

@Mapper
public interface MemberMapper {
	
	//회원가입
    public void signup(MemberDto dto);
    //중복처리
    public MemberDto findByLoginId(String loginId);
    public int countByLoginId(String loginId);
    public MemberDto findByEmail(String email);
    public MemberDto findByNickname(String nickname);
    public MemberDto findByProviderAndProviderId(@Param("provider") String provider, @Param("providerId") String providerId);
    // 소셜 로그인
    public void insertSocialAccount(SocialAccountDto socialAccountDto);
    // 아이디 찾기 - 이메일과 전화번호로 회원 조회
    public MemberDto findByEmailAndPhone(@Param("email") String email, @Param("phoneNumber") String phoneNumber);
    
    // 비밀번호 재설정을 위한 회원 확인 - 아이디와 전화번호로 회원 조회
    public MemberDto findByLoginIdAndPhone(@Param("loginId") String loginId, @Param("phoneNumber") String phoneNumber);
    // 비밀번호 업데이트
    public void updatePassword(@Param("loginId") String loginId, @Param("password") String password);
}