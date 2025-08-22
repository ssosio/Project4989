package boot.sagu.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
    
 // 로그인 성공 시 JWT 토큰 반환 (JSON만 받음)
 // 필요하면 consumes 제거해도 되지만, 프론트가 JSON 보내고 있으니 명시 유지 권장
 @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
 public ResponseEntity<?> login(@RequestBody Map<String, Object> body) {
     try {
         // 0) 디버깅용(문제 생기면 무엇이 왔는지 바로 확인)
         System.out.println("[LOGIN] body=" + body);

         // 1) 로그인 아이디 추출: id / loginId / username 모두 허용
         String loginId = getFirstNonBlank(body, "loginId", "id", "username");
         String password = getFirstNonBlank(body, "password", "pwd");

         if (loginId == null || password == null) {
             return ResponseEntity.status(400).body("필수값 누락(loginId/id/username, password/pwd)");
         }

         // 2) 사용자/패스워드 검증 (기존 로직 그대로)
         final UserDetails userDetails = userDetailsService.loadUserByUsername(loginId);
         if (!passwordEncoder.matches(password, userDetails.getPassword())) {
             return ResponseEntity.status(401).body("Login failed: Bad credentials");
         }

         // 3) 토큰 생성 (기존 로직 그대로)
         MemberDto member = memberService.getMemberByLoginId(loginId);
         final String token = jwtUtil.generateToken(member);
         return ResponseEntity.ok(Map.of("token", token));

     } catch (Exception e) {
         return ResponseEntity.status(401).body("Login failed: " + e.getMessage());
     }
 }

 private String getFirstNonBlank(Map<String, Object> body, String... keys) {
     for (String k : keys) {
         Object v = body.get(k);
         if (v != null) {
             String s = String.valueOf(v).trim();
             if (!s.isEmpty()) return s;
         }
     }
     return null;
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
    
    // 아이디 찾기 - 이메일과 전화번호로 아이디 조회
    @PostMapping("/find-id")
    public ResponseEntity<?> findLoginId(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String phoneNumber = request.get("phoneNumber");
            
            if (email == null || phoneNumber == null) {
                return ResponseEntity.badRequest().body("이메일과 전화번호를 모두 입력해주세요.");
            }
            
            MemberDto member = memberService.findByEmailAndPhone(email, phoneNumber);
            
            if (member != null) {
                // 아이디 마스킹 처리 (abc*** 형태)
                String maskedLoginId = maskLoginId(member.getLoginId());
                return ResponseEntity.ok(Map.of("loginId", maskedLoginId, "fullLoginId", member.getLoginId()));
            } else {
                return ResponseEntity.status(404).body("입력하신 정보와 일치하는 회원을 찾을 수 없습니다.");
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("아이디 찾기 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    // 비밀번호 재설정을 위한 회원 확인
    @PostMapping("/verify-for-password-reset")
    public ResponseEntity<?> verifyForPasswordReset(@RequestBody Map<String, String> request) {
        try {
            String loginId = request.get("loginId");
            String phoneNumber = request.get("phoneNumber");
            
            if (loginId == null || phoneNumber == null) {
                return ResponseEntity.badRequest().body("아이디와 전화번호를 모두 입력해주세요.");
            }
            
            MemberDto member = memberService.findByLoginIdAndPhone(loginId, phoneNumber);
            
            if (member != null) {
                return ResponseEntity.ok(Map.of("message", "회원 정보가 확인되었습니다.", "memberId", member.getMemberId()));
            } else {
                return ResponseEntity.status(404).body("입력하신 정보와 일치하는 회원을 찾을 수 없습니다.");
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("회원 확인 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    // 비밀번호 재설정
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String loginId = request.get("loginId");
            String newPassword = request.get("newPassword");
            
            if (loginId == null || newPassword == null) {
                return ResponseEntity.badRequest().body("아이디와 새 비밀번호를 모두 입력해주세요.");
            }
            
            memberService.updatePassword(loginId, newPassword);
            return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("비밀번호 변경 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    // 아이디 마스킹 처리 헬퍼 메서드
    private String maskLoginId(String loginId) {
        if (loginId == null || loginId.length() <= 3) {
            return loginId;
        }
        return loginId.substring(0, 3) + "*".repeat(loginId.length() - 3);
    }

    // ===== 마이페이지 관련 API =====
    
    // 프로필 정보 조회
    @GetMapping("/member/profile")
    public ResponseEntity<?> getProfile(@RequestParam("loginId") String loginId) {
        try {
            MemberDto member = memberService.getMemberByLoginId(loginId);
            if (member != null) {
                // 민감한 정보는 제외하고 반환
                MemberDto profileInfo = new MemberDto();
                profileInfo.setMemberId(member.getMemberId());
                profileInfo.setLoginId(member.getLoginId());
                profileInfo.setNickname(member.getNickname());
                profileInfo.setEmail(member.getEmail());
                profileInfo.setPhoneNumber(member.getPhoneNumber());
                profileInfo.setProfileImageUrl(member.getProfileImageUrl());
                profileInfo.setTier(member.getTier());
                profileInfo.setStatus(member.getStatus());
                profileInfo.setRole(member.getRole());
                profileInfo.setCreatedAt(member.getCreatedAt());
                
                return ResponseEntity.ok(profileInfo);
            } else {
                return ResponseEntity.status(404).body("회원을 찾을 수 없습니다.");
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("프로필 정보 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    // 프로필 정보 수정
    @PutMapping("/member/profile")
    public ResponseEntity<?> updateProfile(@RequestParam("loginId") String loginId, @RequestBody MemberDto updateData) {
        try {
            MemberDto existingMember = memberService.getMemberByLoginId(loginId);
            if (existingMember == null) {
                return ResponseEntity.status(404).body("회원을 찾을 수 없습니다.");
            }
            
            // 업데이트할 수 있는 필드들만 수정
            if (updateData.getNickname() != null) {
                existingMember.setNickname(updateData.getNickname());
            }
            if (updateData.getEmail() != null) {
                existingMember.setEmail(updateData.getEmail());
            }
            if (updateData.getPhoneNumber() != null) {
                existingMember.setPhoneNumber(updateData.getPhoneNumber());
            }
            
            memberService.updateProfile(existingMember);
            return ResponseEntity.ok("프로필이 성공적으로 수정되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("프로필 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    // 프로필 사진 변경
    @PutMapping("/member/profile-image")
    public ResponseEntity<?> updateProfileImage(@RequestParam("loginId") String loginId, 
                                              @RequestParam("profileImageFile") MultipartFile profileImageFile) {
        try {
            if (profileImageFile.isEmpty()) {
                return ResponseEntity.badRequest().body("프로필 사진을 선택해주세요.");
            }
            
            // 파일 유효성 검사
            if (!profileImageFile.getContentType().startsWith("image/")) {
                return ResponseEntity.badRequest().body("이미지 파일만 업로드 가능합니다.");
            }
            
            if (profileImageFile.getSize() > 5 * 1024 * 1024) { // 5MB 제한
                return ResponseEntity.badRequest().body("파일 크기는 5MB 이하여야 합니다.");
            }
            
            // 프로필 사진 업로드 및 URL 반환
            String imageUrl = memberService.updateProfileImage(loginId, profileImageFile);
            return ResponseEntity.ok(Map.of("message", "프로필 사진이 성공적으로 변경되었습니다.", "imageUrl", imageUrl));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body("프로필 사진 변경 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    // 비밀번호 변경 (현재 비밀번호 확인 후 변경)
    @PutMapping("/member/password")
    public ResponseEntity<?> changePassword(@RequestParam("loginId") String loginId, @RequestBody Map<String, String> request) {
        try {
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");
            
            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest().body("현재 비밀번호와 새 비밀번호를 모두 입력해주세요.");
            }
            
            MemberDto member = memberService.getMemberByLoginId(loginId);
            if (member == null) {
                return ResponseEntity.status(404).body("회원을 찾을 수 없습니다.");
            }
            
            // 현재 비밀번호 확인
            if (!passwordEncoder.matches(currentPassword, member.getPassword())) {
                return ResponseEntity.status(401).body("현재 비밀번호가 올바르지 않습니다.");
            }
            
            // 새 비밀번호 유효성 검사
            if (newPassword.length() < 10) {
                return ResponseEntity.badRequest().body("새 비밀번호는 10자 이상이어야 합니다.");
            }
            
            // 강력한 비밀번호 정규식 검사
            String strongPasswordRegex = "^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{10,}$";
            if (!newPassword.matches(strongPasswordRegex)) {
                return ResponseEntity.badRequest().body("비밀번호는 10자 이상이어야 하며, 대문자, 특수문자, 숫자를 포함해야 합니다.");
            }
            
            // 새 비밀번호로 업데이트
            memberService.updatePassword(loginId, newPassword);
            return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("비밀번호 변경 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}