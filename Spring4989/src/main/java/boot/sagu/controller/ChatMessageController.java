package boot.sagu.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import boot.sagu.dto.ChatFileDto;
import boot.sagu.dto.ChatMessageDto;
import boot.sagu.service.ChatFileUploadService;
import boot.sagu.service.ChatMessageServiceInter;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class ChatMessageController {

	@Autowired
	ChatMessageServiceInter chatMessageService;
	
	@Autowired
	ChatFileUploadService chatFileUploadService;
	
	@PostMapping("/insertMessage")
	public void insertMessage(@RequestBody ChatMessageDto dto)
	{
		chatMessageService.insertMessage(dto);
	}
	
	@GetMapping("/test")
	public String test()
	{
		System.out.println("=== 테스트 API 호출 ===");
		return "Hello World";
	}
	
	@GetMapping("/listMessage")
	public List<ChatMessageDto> getList(@RequestParam("chat_room_id") Long chat_room_id)
	{
		System.out.println("=== 메시지 조회 API 호출 ===");
		System.out.println("요청 받은 chat_room_id: " + chat_room_id);
		System.out.println("chat_room_id 타입: " + ((Object)chat_room_id).getClass().getName());
		
		try {
			List<ChatMessageDto> result = chatMessageService.getAllMessages(chat_room_id);
			System.out.println("서비스 호출 완료");
			System.out.println("조회 결과: " + result);
			System.out.println("조회 결과 크기: " + (result != null ? result.size() : "null"));
			
			for (ChatMessageDto message : result) {
			    if ("image".equals(message.getMessage_type())) {
			        // chatfile 테이블에서 message_id로 파일 정보를 조회합니다.
			        ChatFileDto fileInfo = chatFileUploadService.getChatFileByMessageId(message.getMessage_id());
			        if (fileInfo != null) {
			            // DB에 저장된 fileUrl로 message_content를 업데이트합니다.
			            // 이제 프론트엔드에서는 message_content를 그대로 사용할 수 있습니다.
			            message.setMessage_content(fileInfo.getFileUrl());
			        } else {
			        	// 파일 정보가 없을 경우, 에러 메시지를 표시하거나 기본값을 설정할 수 있습니다.
			        	message.setMessage_content("이미지를 찾을 수 없습니다.");
			        }
			    }
			}
			
			return result;
		} catch (Exception e) {
			System.out.println("=== 에러 발생 ===");
			System.out.println("에러 메시지: " + e.getMessage());
			e.printStackTrace();
			throw e;
		}
	}
	
	// 기존 메시지들을 안읽음 상태로 초기화하는 API
	@PostMapping("/resetMessageReadStatus")
	public String resetMessageReadStatus(@RequestParam("chat_room_id") Long chat_room_id)
	{
		System.out.println("=== 메시지 읽음 상태 초기화 API 호출 ===");
		System.out.println("요청 받은 chat_room_id: " + chat_room_id);
		
		try {
			chatMessageService.resetMessageReadStatus(chat_room_id);
			return "메시지 읽음 상태가 초기화되었습니다.";
		} catch (Exception e) {
			System.out.println("=== 에러 발생 ===");
			System.out.println("에러 메시지: " + e.getMessage());
			e.printStackTrace();
			return "초기화 중 오류가 발생했습니다: " + e.getMessage();
		}
	}
	
	
}
