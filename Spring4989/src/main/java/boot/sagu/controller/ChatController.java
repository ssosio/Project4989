package boot.sagu.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import boot.sagu.dto.ChatDto;
import boot.sagu.dto.MemberDto;
import boot.sagu.service.ChatServiceInter;
import boot.sagu.service.MemberServiceInter;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class ChatController {

	@Autowired
	ChatServiceInter chatservice;
	
	@Autowired
	MemberServiceInter memberService;
	
	@GetMapping("/chatlist")
	public List<ChatDto> getAllChat(@RequestParam("login_id") String login_id)
	{
		
		// loginId로 사용자 정보 조회
		MemberDto member = memberService.getMemberByLoginId(login_id);
		if (member == null) {
			return null;
		}
		
		
		List<ChatDto> result = chatservice.getAllChat(String.valueOf(member.getMemberId()));
		return result;
	}
}
