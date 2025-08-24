package boot.sagu.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import boot.sagu.dto.ChatDeclarationDto;
import boot.sagu.service.ChatDeclarationService;

@RestController
@RequestMapping("/api/chat-declarations")
public class ChatDeclarationController {

	@Autowired
    private final ChatDeclarationService chatDeclarationService;

    public ChatDeclarationController(ChatDeclarationService chatDeclarationService) {
        this.chatDeclarationService = chatDeclarationService;
    }

    /**
     * 테스트용 간단한 엔드포인트 (인증 없이 접근 가능)
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return new ResponseEntity<>("ChatDeclarationController is working!", HttpStatus.OK);
    }

    /**
     * 관리자용 채팅 신고 목록을 조회하는 API (인증 없이 접근 가능하도록 임시 설정)
     */
    @GetMapping("/admin")
    public ResponseEntity<List<ChatDeclarationDto>> getAllChatDeclarations() {
        System.out.println(">>> [DEBUG] getAllChatDeclarations API 호출됨 (관리자용)");
        try {
            List<ChatDeclarationDto> declarations = chatDeclarationService.getAllDeclarations();
            
            // 디버깅을 위한 상세 로그
            System.out.println(">>> [DEBUG] 받아온 데이터 개수: " + (declarations != null ? declarations.size() : "null"));
            if (declarations != null && !declarations.isEmpty()) {
                for (int i = 0; i < declarations.size(); i++) {
                    ChatDeclarationDto dto = declarations.get(i);
                    System.out.println(">>> [DEBUG] 데이터[" + i + "]: " + dto);
                    if (dto != null) {
                        System.out.println("  - declaration_id: " + dto.getDeclaration_id());
                        System.out.println("  - declaration_type: " + dto.getDeclaration_type());
                        System.out.println("  - declaration_content: " + dto.getDeclaration_content());
                    } else {
                        System.out.println("  - DTO 객체가 null입니다.");
                    }
                }
            } else {
                System.out.println(">>> [DEBUG] 받아온 데이터가 없습니다.");
            }
            
            return new ResponseEntity<>(declarations, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println(">>> [ERROR] getAllChatDeclarations API에서 예외 발생: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<String> submitReport(@RequestBody ChatDeclarationDto declarationDto) {
        System.out.println("신고 접수: " + declarationDto);
        try {
            chatDeclarationService.insertDeclaration(declarationDto);
            return new ResponseEntity<>("신고가 성공적으로 접수되었습니다.", HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("신고 접수에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 채팅 신고 조치 처리 API
     * @param declarationId 신고 ID
     * @param request 조치 정보 (reason, actionType)
     * @return 처리 결과
     */
    @PutMapping("/{declarationId}/action")
    public ResponseEntity<String> processAction(
            @PathVariable("declarationId") Integer declarationId,
            @RequestBody java.util.Map<String, Object> request) {
        try {
            System.out.println(">>> [DEBUG] 조치 처리 API 호출됨");
            System.out.println(">>> [DEBUG] declarationId: " + declarationId);
            System.out.println(">>> [DEBUG] request: " + request);
            
            String reason = (String) request.get("reason");
            String actionType = (String) request.get("actionType");
            
            if (reason == null || reason.trim().isEmpty()) {
                return new ResponseEntity<>("reason은 필수입니다.", HttpStatus.BAD_REQUEST);
            }
            
            if (actionType == null || actionType.trim().isEmpty()) {
                return new ResponseEntity<>("actionType은 필수입니다.", HttpStatus.BAD_REQUEST);
            }
            
            // 조치 처리 서비스 호출
            chatDeclarationService.processAction(declarationId, reason, actionType);
            
            return new ResponseEntity<>("조치 처리가 완료되었습니다.", HttpStatus.OK);
        } catch (Exception e) {
            System.err.println(">>> [ERROR] 조치 처리 중 예외 발생: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>("조치 처리 중 오류가 발생했습니다: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * 로그인한 회원에게 온 채팅 신고 알림 목록을 조회하는 API
     * URL: /api/chat-declarations/declarations?memberId={memberId}
     * @param memberId 쿼리 파라미터로 전달받은 로그인 회원 ID
     * @return 신고 알림 목록
     */
    @GetMapping("/declarations")
    public List<ChatDeclarationDto> getDeclarations(@RequestParam("memberId") long memberId) {
        System.out.println(">>> [DEBUG] getDeclarations API 호출됨. memberId: " + memberId);
        try {
            return chatDeclarationService.getChatDeclarationsForMember(memberId);
        } catch (Exception e) {
            System.err.println(">>> [ERROR] getDeclarations API에서 예외 발생: " + e.getMessage());
            e.printStackTrace(); // 예외 스택 트레이스 전체 출력
            throw e; // 예외를 다시 던져서 Spring이 처리하도록 함
        }
    }
}