package boot.sagu.controller;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import boot.sagu.service.CoolSmsService;

@RestController
@RequestMapping("/sms")
public class SmsController {

	@Autowired
    private CoolSmsService coolSmsService;

    private final Map<String, String> verificationCodes = new ConcurrentHashMap<>();

    @PostMapping("/send")
    public ResponseEntity<?> sendVerificationCode(@RequestBody Map<String, String> payload) {
        String phoneNumber = payload.get("phoneNumber");
        String code = String.format("%06d", new Random().nextInt(999999));
        
        try {
            // CoolSms 서비스의 sendSms 메서드 호출
            coolSmsService.sendSms(phoneNumber, "[사구팔구] 인증번호 [" + code + "] 를 입력해주세요.");
            verificationCodes.put(phoneNumber, code);
            return ResponseEntity.ok("인증번호가 발송되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("SMS 발송에 실패했습니다.");
        }
    }
    
    // 인증번호 확인 요청을 처리하는 API
    @PostMapping("/verify")
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> payload) {
        String phoneNumber = payload.get("phoneNumber");
        String code = payload.get("code");
        
        String storedCode = verificationCodes.get(phoneNumber);
        
        if (storedCode != null && storedCode.equals(code)) {
            verificationCodes.remove(phoneNumber); // 인증 성공 시 코드 삭제
            return ResponseEntity.ok("인증 성공");
        } else {
            return ResponseEntity.status(400).body("인증번호가 일치하지 않습니다.");
        }
    }
}