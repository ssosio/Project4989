package boot.sagu.controller;

import boot.sagu.dto.ChatDeclarationDto;
import boot.sagu.service.ChatDeclarationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
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
}