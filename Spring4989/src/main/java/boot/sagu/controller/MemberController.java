package boot.sagu.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import boot.sagu.config.JwtUtil;
import boot.sagu.dto.MemberDto;
import boot.sagu.service.CustomUserDetailsService;
import boot.sagu.service.MemberServiceInter;
import jakarta.validation.Valid;

@RestController
@CrossOrigin
public class MemberController {

    @Autowired
    private MemberServiceInter memberService;

    @Autowired
    private CustomUserDetailsService userDetailsService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/signup")
    public void signup(@Valid @ModelAttribute("memberDto") MemberDto dto,
    		@RequestParam(value = "profileImageFile", required = false) MultipartFile profileImageFile) {
        memberService.signup(dto,profileImageFile);
    }
    
    // 로그인 성공 시 JWT 토큰을 반환하도록 로직 변경
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody MemberDto dto) {
        try {
            final UserDetails userDetails = userDetailsService.loadUserByUsername(dto.getLoginId());

            if (passwordEncoder.matches(dto.getPassword(), userDetails.getPassword())) {
                // 인증 성공 시, DB에서 사용자 정보 전체를 가져옴
                MemberDto member = memberService.getMemberByLoginId(dto.getLoginId());
                
                // 사용자 정보를 담아 JWT 토큰 생성
                final String token = jwtUtil.generateToken(member);
                
                // 생성된 토큰을 JSON 형태로 반환
                return ResponseEntity.ok(Map.of("token", token));
            } else {
                // 비밀번호 불일치
                return ResponseEntity.status(401).body("Login failed: Bad credentials");
            }
        } catch (Exception e) {
            // 아이디 없음 또는 기타 예외
            return ResponseEntity.status(401).body("Login failed: " + e.getMessage());
        }
    }
    
    @GetMapping("/check-loginid")
    public ResponseEntity<?> checkLoginId(@RequestParam("loginId") String loginId) {
        boolean isAvailable = memberService.isLoginIdAvailable(loginId);
        // 사용 가능하면 OK(200), 중복이면 Conflict(409) 상태 코드를 반환
        if (isAvailable) {
            return ResponseEntity.ok(Map.of("isAvailable", true));
        } else {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("isAvailable", false));
        }
    }
}