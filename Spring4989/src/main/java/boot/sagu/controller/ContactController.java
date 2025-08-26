package boot.sagu.controller;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import boot.sagu.dto.ContactDto;
import boot.sagu.service.ContactService;
import boot.sagu.config.JwtUtil;

@RestController
@RequestMapping("/api/contact")
public class ContactController {
    
    @Autowired
    private ContactService contactService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    // 문의 등록
    @PostMapping("/submit")
    public ResponseEntity<?> submitContact(
        @RequestBody ContactDto contactDto,
        @RequestHeader(value = "Authorization", required = false) String token
    ) {
        try {
            // 로그인한 사용자의 경우 memberId 설정
            if (token != null && token.startsWith("Bearer ")) {
                String jwt = token.substring(7);
                Integer memberId = jwtUtil.extractMemberId(jwt);
                if (memberId != null) {
                    contactDto.setMemberId(memberId.longValue());
                }
            }
            
            contactService.submitContact(contactDto);
            
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "문의가 성공적으로 접수되었습니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "ERROR",
                "message", "문의 접수 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    // 모든 문의 조회 (관리자용)
    @GetMapping("/admin/all")
    public ResponseEntity<List<ContactDto>> getAllContacts() {
        List<ContactDto> contacts = contactService.getAllContacts();
        return ResponseEntity.ok(contacts);
    }
    
    // 특정 문의 조회
    @GetMapping("/admin/{contactId}")
    public ResponseEntity<ContactDto> getContactById(@PathVariable Long contactId) {
        ContactDto contact = contactService.getContactById(contactId);
        if (contact != null) {
            return ResponseEntity.ok(contact);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // 문의 상태 업데이트 (관리자용)
    @PutMapping("/admin/{contactId}/status")
    public ResponseEntity<?> updateContactStatus(
        @PathVariable Long contactId,
        @RequestBody Map<String, String> request
    ) {
        try {
            String status = request.get("status");
            contactService.updateContactStatus(contactId, status);
            
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "문의 상태가 업데이트되었습니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "ERROR",
                "message", "상태 업데이트 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    // 관리자 답변 추가
    @PostMapping("/admin/{contactId}/reply")
    public ResponseEntity<?> replyToContact(
        @PathVariable Long contactId,
        @RequestBody Map<String, String> request
    ) {
        try {
            String adminReply = request.get("adminReply");
            contactService.replyToContact(contactId, adminReply);
            
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "답변이 등록되었습니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "ERROR",
                "message", "답변 등록 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    // 사용자별 문의 조회
    @GetMapping("/my")
    public ResponseEntity<List<ContactDto>> getMyContacts(
        @RequestHeader(value = "Authorization", required = false) String token
    ) {
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            String jwt = token.substring(7);
            Integer memberId = jwtUtil.extractMemberId(jwt);
            if (memberId == null) {
                return ResponseEntity.status(401).build();
            }
            
            List<ContactDto> contacts = contactService.getContactsByMemberId(memberId.longValue());
            return ResponseEntity.ok(contacts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // 문의 통계 (관리자용)
    @GetMapping("/admin/stats")
    public ResponseEntity<Map<String, Object>> getContactStats() {
        int totalCount = contactService.getContactCount();
        int pendingCount = contactService.getPendingContactCount();
        
        return ResponseEntity.ok(Map.of(
            "totalCount", totalCount,
            "pendingCount", pendingCount,
            "completedCount", totalCount - pendingCount
        ));
    }
}
