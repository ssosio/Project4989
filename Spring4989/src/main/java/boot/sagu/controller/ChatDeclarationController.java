package boot.sagu.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import boot.sagu.dto.ChatDeclarationDto;
import boot.sagu.service.ChatDeclarationService;

@RestController
@RequestMapping("/api/notifications")
public class ChatDeclarationController {

	@Autowired
    private final ChatDeclarationService chatDeclarationService;

    public ChatDeclarationController(ChatDeclarationService chatDeclarationService) {
        this.chatDeclarationService = chatDeclarationService;
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
     * 로그인한 회원에게 온 채팅 신고 알림 목록을 조회하는 API
     * URL: /api/notifications/declarations?memberId={memberId}
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