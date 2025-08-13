package boot.sagu.controller;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
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


    // 방 인원수 관리를 위한 필드들
    private final Map<String, AtomicInteger> roomUserCounts = new ConcurrentHashMap<>();
    private final Map<String, Map<String, String>> roomUsers = new ConcurrentHashMap<>();


    @MessageMapping("/chat.sendMessage")
    public WebSocketMessageDto sendMessage(@Payload WebSocketMessageDto webSocketMessage) {
        // 메시지를 데이터베이스에 저장
    	 if ("text".equals(webSocketMessage.getMessageType())) {
             // 메시지를 데이터베이스에 저장
             ChatMessageDto chatMessage = new ChatMessageDto();
             chatMessage.setChat_room_id(webSocketMessage.getChatRoomId());
             chatMessage.setSender_id(webSocketMessage.getSenderId());
             chatMessage.setMessage_content(webSocketMessage.getMessageContent());
             chatMessage.setMessage_type(webSocketMessage.getMessageType());
             chatMessage.setCreated_at(new Timestamp(System.currentTimeMillis()));
             chatMessageService.insertMessage(chatMessage);
         
             // 텍스트 메시지를 특정 채팅방에 전송
             messagingTemplate.convertAndSend("/topic/chat/" + webSocketMessage.getChatRoomId(), webSocketMessage);
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
            chatMessageService.markMessageAsRead(
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

    // 경매 방 입장 처리
    @MessageMapping("/auction/room/join/{postId}")
    @SendTo("/topic/auction/{postId}")
    public Map<String, Object> joinAuctionRoom(String message, String postId) {
        try {
            // JSON 파싱 (간단한 구현)
            String sessionId = extractValue(message, "sessionId");
            String userId = extractValue(message, "userId");
            String userNickname = extractValue(message, "userNickname");
            
            String roomKey = "auction_" + postId;
            
            // 방이 없으면 생성
            roomUserCounts.putIfAbsent(roomKey, new AtomicInteger(0));
            roomUsers.putIfAbsent(roomKey, new ConcurrentHashMap<>());
            
            // 사용자 추가
            Map<String, String> users = roomUsers.get(roomKey);
            users.put(sessionId, userNickname != null ? userNickname : "ID: " + userId);
            
            // 인원수 증가
            int currentCount = roomUserCounts.get(roomKey).incrementAndGet();
            
            Map<String, Object> response = new HashMap<>();
            response.put("type", "USER_COUNT_UPDATE");
            response.put("userCount", currentCount);
            response.put("users", new HashMap<>(users));
            
            // System.out.println("WebSocket 경매방 입장: " + roomKey + ", 현재 인원: " + currentCount);
            
            return response;
        } catch (Exception e) {
            System.err.println("WebSocket 경매방 입장 처리 실패: " + e.getMessage());
            return new HashMap<>();
        }
    }

    // 경매 방 퇴장 처리
    @MessageMapping("/auction/room/leave/{postId}")
    @SendTo("/topic/auction/{postId}")
    public Map<String, Object> leaveAuctionRoom(String message, String postId) {
        try {
            String sessionId = extractValue(message, "sessionId");
            String roomKey = "auction_" + postId;
            
            Map<String, String> users = roomUsers.get(roomKey);
            if (users != null) {
                String userNickname = users.remove(sessionId);
                
                // 인원수 감소
                AtomicInteger count = roomUserCounts.get(roomKey);
                if (count != null) {
                    int currentCount = count.decrementAndGet();
                    
                    // 방이 비었으면 정리
                    if (currentCount <= 0) {
                        roomUserCounts.remove(roomKey);
                        roomUsers.remove(roomKey);
                        // System.out.println("WebSocket 경매방 정리: " + roomKey);
                    }
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("type", "USER_COUNT_UPDATE");
                    response.put("userCount", currentCount);
                    response.put("users", new HashMap<>(users));
                    
                    // System.out.println("WebSocket 경매방 퇴장: " + roomKey + ", 현재 인원: " + currentCount);
                    
                    return response;
                }
            }
            
            return new HashMap<>();
        } catch (Exception e) {
            System.err.println("WebSocket 경매방 퇴장 처리 실패: " + e.getMessage());
            return new HashMap<>();
        }
    }

    // 간단한 JSON 파싱 헬퍼 메서드
    private String extractValue(String json, String key) {
        try {
            String pattern = "\"" + key + "\":\"([^\"]*)\"";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(json);
            if (m.find()) {
                return m.group(1);
            }
        } catch (Exception e) {
            System.err.println("JSON 파싱 실패: " + e.getMessage());
        }
        return null;
    }
} 