package boot.sagu.controller;

import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import boot.sagu.dto.ChatDto;
import boot.sagu.dto.MemberDto;
import boot.sagu.dto.WebSocketMessageDto;
import boot.sagu.service.ChatFileUploadService;
import boot.sagu.service.ChatServiceInter;
import boot.sagu.service.MemberServiceInter;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class ChatController {
	
	private static final Logger logger = LoggerFactory.getLogger(ChatController.class);
	
	private final String SERVER_BASE_URL = "http://192.168.10.136:4989";
	
	@Autowired
	ChatServiceInter chatservice;
	
	@Autowired
	MemberServiceInter memberService;
	
	@Autowired
	ChatFileUploadService fileUploadService;
	
    // SimpMessagingTemplate 주입
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
	
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
	
	@GetMapping("/chat/rooms")
	public ResponseEntity<?> getChatRoomsWithLastMessage(@RequestParam(name = "memberId") Long memberId) {
	    try {
	        List<Map<String, Object>> chatRooms = chatservice.getChatRoomsWithLastMessage(memberId);
	        return ResponseEntity.ok(chatRooms);
	    } catch (Exception e) {
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                .body("채팅방 목록을 가져오는데 실패했습니다: " + e.getMessage());
	    	}
	
}
	  @PostMapping("/chat/uploadImage")
	    public ResponseEntity<?> uploadChatImage(@RequestPart("file") MultipartFile file,
	            @RequestParam("chatRoomId") Long chatRoomId,
	            @RequestParam("senderId") Long senderId) {
	        
	        logger.info("이미지 업로드 요청 시작: chatRoomId={}, senderId={}", chatRoomId, senderId);
	        
	        try {
	            if (file.isEmpty()) {
	                logger.warn("업로드된 파일이 비어 있습니다.");
	                return ResponseEntity.badRequest().body("업로드된 파일이 없습니다.");
	            }
	            
	            // 파일 업로드 및 DB 저장
	            var chatFileDto = fileUploadService.uploadChatImage(file, chatRoomId, senderId);
	            
//	            String absoluteImageUrl = SERVER_BASE_URL + chatFileDto.getFileUrl();
//	            
//	            // DB 저장 후 웹소켓으로 알림 메시지 전송
//	            WebSocketMessageDto webSocketMessage = new WebSocketMessageDto();
//	            webSocketMessage.setType("CHAT");
//	            webSocketMessage.setChatRoomId(chatRoomId);
//	            webSocketMessage.setSenderId(senderId);
//	            webSocketMessage.setMessageType("image");
//	            webSocketMessage.setMessageContent(absoluteImageUrl); // ⭐⭐ 절대 경로 URL을 설정
//	            
//	            System.out.println("웹소켓으로 전송할 절대 URL: " + absoluteImageUrl); // ⭐ 이 로그가 찍히는지 확인
	            
	            // 특정 채팅방 구독자들에게 메시지 전송
//	            messagingTemplate.convertAndSend("/topic/chat/" + chatRoomId, webSocketMessage);
	            
	            logger.info("이미지 업로드 성공: messageId={}", chatFileDto.getMessageId());
	            return ResponseEntity.ok(chatFileDto);
	        } catch (IllegalArgumentException e) {
	            logger.error("잘못된 요청: {}", e.getMessage());
	            return ResponseEntity.badRequest().body(e.getMessage());
	        } catch (Exception e) {
	            // 이 로그가 찍히는지 확인
	            logger.error("이미지 업로드 중 서버 오류 발생", e); 
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                    .body("이미지 업로드에 실패했습니다: " + e.getMessage());
	        }
	    }
	    @GetMapping("/chat/otherUser")
	    public ResponseEntity<?> getOtherUserInfo(@RequestParam(name = "chat_room_id") Long chatRoomId, 
	                                            @RequestParam(name = "member_id") Long memberId) {
	        try {
	            Map<String, Object> otherUser = chatservice.getOtherUserInChatRoom(chatRoomId, memberId);
	            
	            if (otherUser != null) {
	                return ResponseEntity.ok(otherUser);
	            } else {
	                return ResponseEntity.notFound().build();
	            }
	        } catch (Exception e) {
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                    .body("상대방 정보를 가져오는데 실패했습니다: " + e.getMessage());
	        }
	    }
	    
	    @PostMapping("/chat/exit")
	    public ResponseEntity<String> exitChatRoom(@RequestBody Map<String, Long> request) {
	        Long chatRoomId = request.get("chatRoomId");
	        Long currentMemberId = request.get("currentMemberId");

	        if (chatRoomId == null || currentMemberId == null) {
	            return ResponseEntity.badRequest().body("chatRoomId 또는 currentMemberId가 누락되었습니다.");
	        }

	        try {
	            chatservice.updateExit(chatRoomId, currentMemberId);
	            return ResponseEntity.ok("채팅방 나가기 성공");
	        } catch (Exception e) {
	            System.err.println("채팅방 나가기 중 오류 발생: " + e.getMessage());
	            e.printStackTrace();
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("채팅방 나가기 실패: " + e.getMessage());
	        }
	    }
}