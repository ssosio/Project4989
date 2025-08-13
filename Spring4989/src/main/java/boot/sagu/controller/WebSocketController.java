package boot.sagu.controller;

import java.sql.Timestamp;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import boot.sagu.dto.ChatMessageDto;
import boot.sagu.dto.WebSocketMessageDto;
import boot.sagu.service.ChatMessageServiceInter;

@Controller
public class WebSocketController {

    @Autowired
    private ChatMessageServiceInter chatMessageService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public WebSocketMessageDto sendMessage(@Payload WebSocketMessageDto webSocketMessage) {
        // 메시지를 데이터베이스에 저장
    	 if ("text".equals(webSocketMessage.getMessageType()) || "text".equals(webSocketMessage.getMessage_type())) {
             // 메시지를 데이터베이스에 저장
             ChatMessageDto chatMessage = new ChatMessageDto();
             
             // 프론트엔드에서 보내는 snake_case 구조 처리
             if (webSocketMessage.getChat_room_id() != null) {
                 chatMessage.setChat_room_id(webSocketMessage.getChat_room_id());
                 chatMessage.setSender_id(webSocketMessage.getSender_id());
                 chatMessage.setMessage_content(webSocketMessage.getMessage_content());
                 chatMessage.setMessage_type(webSocketMessage.getMessage_type());
             } else {
                 // 기존 camelCase 구조 처리
                 chatMessage.setChat_room_id(webSocketMessage.getChatRoomId());
                 chatMessage.setSender_id(webSocketMessage.getSenderId());
                 chatMessage.setMessage_content(webSocketMessage.getMessageContent());
                 chatMessage.setMessage_type(webSocketMessage.getMessageType());
             }
             
             chatMessage.setCreated_at(new Timestamp(System.currentTimeMillis()));
             Long messageId = chatMessageService.insertMessage(chatMessage);
             chatMessage.setMessage_id(messageId);
         
             // 텍스트 메시지를 특정 채팅방에 전송
             // 프론트엔드에서 보내는 메시지 구조에 맞게 수정
             WebSocketMessageDto responseMessage = new WebSocketMessageDto();
             responseMessage.setType("CHAT");
             responseMessage.setMessageId(chatMessage.getMessage_id());
             responseMessage.setChatRoomId(chatMessage.getChat_room_id());
             responseMessage.setSenderId(chatMessage.getSender_id());
             responseMessage.setMessageType(chatMessage.getMessage_type());
             responseMessage.setMessageContent(chatMessage.getMessage_content());
             responseMessage.setTimestamp(chatMessage.getCreated_at());
             
             System.out.println("=== WebSocket 메시지 전송 ===");
             System.out.println("전송할 메시지: " + responseMessage);
             System.out.println("채팅방 ID: " + chatMessage.getChat_room_id());
             System.out.println("메시지 내용: " + chatMessage.getMessage_content());
             System.out.println("메시지 타입: " + chatMessage.getMessage_type());
             
             messagingTemplate.convertAndSend("/topic/chat/" + chatMessage.getChat_room_id(), responseMessage);
         }
        
        
        return webSocketMessage;
    }

    @MessageMapping("/chat.addUser")
    public WebSocketMessageDto addUser(@Payload WebSocketMessageDto webSocketMessage, 
                                     SimpMessageHeaderAccessor headerAccessor) {
        // 사용자 이름을 WebSocket 세션에 추가
        headerAccessor.getSessionAttributes().put("username", webSocketMessage.getSenderId());
        
        // 특정 채팅방에 사용자 입장 메시지 전송
        messagingTemplate.convertAndSend("/topic/chat/" + webSocketMessage.getChatRoomId(), webSocketMessage);
        
        return webSocketMessage;
    }
    
    @MessageMapping("/chat.leaveRoom")
    public WebSocketMessageDto leaveRoom(@Payload WebSocketMessageDto webSocketMessage) {
        // 채팅방에서 사용자 제거 로직
        // 다른 사용자들에게 "사용자 퇴장" 알림 전송
        messagingTemplate.convertAndSend("/topic/chat/" + webSocketMessage.getChatRoomId(), webSocketMessage);
        return webSocketMessage;
    }
    
    @MessageMapping("/chat.readMessage")
    public WebSocketMessageDto readMessage(@Payload WebSocketMessageDto webSocketMessage) {
        try {
            System.out.println("=== WebSocket 읽음 처리 시작 ===");
            System.out.println("받은 메시지: " + webSocketMessage);
            System.out.println("chatRoomId: " + webSocketMessage.getChatRoomId());
            System.out.println("senderId: " + webSocketMessage.getSenderId());
            
            // 메시지 읽음 처리 (is_read = 1 → 0)
            chatMessageService.markMessagesAsRead(
                Long.valueOf(webSocketMessage.getChatRoomId()), 
                Long.valueOf(webSocketMessage.getSenderId())
            );
            
            // 읽음 상태 업데이트를 모든 사용자에게 전송
            WebSocketMessageDto readUpdate = new WebSocketMessageDto();
            readUpdate.setType("READ_UPDATE");
            readUpdate.setChatRoomId(webSocketMessage.getChatRoomId());
            readUpdate.setSenderId(webSocketMessage.getSenderId());
            readUpdate.setTimestamp(new Timestamp(System.currentTimeMillis()));
            
            messagingTemplate.convertAndSend("/topic/chat/" + webSocketMessage.getChatRoomId(), readUpdate);
            
            System.out.println("=== WebSocket 읽음 처리 완료 ===");
            return readUpdate;
        } catch (NumberFormatException e) {
            System.out.println("=== WebSocket 읽음 처리 오류 ===");
            System.out.println("chatRoomId: " + webSocketMessage.getChatRoomId());
            System.out.println("senderId: " + webSocketMessage.getSenderId());
            System.out.println("오류 메시지: " + e.getMessage());
            e.printStackTrace();
            return webSocketMessage;
        } catch (Exception e) {
            System.out.println("=== WebSocket 읽음 처리 일반 오류 ===");
            System.out.println("오류 메시지: " + e.getMessage());
            e.printStackTrace();
            return webSocketMessage;
        }
    }
} 