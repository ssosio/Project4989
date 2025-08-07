package boot.sagu.service;

import boot.sagu.config.CustomUserDetails;
import boot.sagu.dto.MemberDto;
import boot.sagu.mapper.MemberMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private MemberMapper memberMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. 기본 OAuth2UserService를 통해 사용자 정보 가져오기
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        // 2. 소셜 서비스 종류(google, kakao 등)와 사용자 정보(attributes)를 가져옴
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();
        
        // 3. 각 소셜 서비스에 맞는 방식으로 이메일, 닉네임, 프로필 사진 추출
        String email;
        String nickname;
        String profileImageUrl;
        String providerId;

        if (registrationId.equals("google")) {
            email = (String) attributes.get("email");
            nickname = (String) attributes.get("name");
            profileImageUrl = (String) attributes.get("picture");
            providerId = (String) attributes.get("sub");
        } else if (registrationId.equals("kakao")) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            
            email = (String) kakaoAccount.get("email");
            nickname = (String) profile.get("nickname");
            profileImageUrl = (String) profile.get("profile_image_url");
            providerId = String.valueOf(attributes.get("id"));
        } else {
            throw new OAuth2AuthenticationException("지원하지 않는 소셜 로그인입니다.");
        }

        // 4. DB에 해당 이메일을 가진 사용자가 있는지 확인
        MemberDto member = memberMapper.findByEmail(email); // (MemberMapper에 findByEmail 메서드 추가 필요)

        if (member == null) {
            // 5. 신규 회원인 경우, 자동으로 회원가입 처리
            member = new MemberDto();
            member.setEmail(email);
            member.setNickname(nickname);
            member.setProfileImageUrl(profileImageUrl);
            // 소셜 로그인 사용자는 비밀번호가 필요 없으므로 임의의 값으로 설정
            member.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            // loginId는 유니크해야 하므로, 이메일 또는 다른 고유한 값으로 설정 (정책에 따라 변경)
            member.setLoginId(email); 
            member.setRole("ROLE_USER");
            
            memberMapper.signup(member); // DB에 신규 회원 정보 저장
            
            // social_accounts 테이블에도 정보 저장
            // (member_id를 알아내기 위해 signup 후 다시 select 하거나, signup 시 ID를 반환받아야 함)
            // 이 부분은 추가 구현이 필요합니다.
        }
        
        // 6. CustomUserDetails 객체를 생성하여 반환 (인증 완료)
        return new CustomUserDetails(member);
    }
}