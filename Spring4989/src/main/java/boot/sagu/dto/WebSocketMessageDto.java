package boot.sagu.dto;

import java.sql.Timestamp;

import lombok.Data;

@Data
public class WebSocketMessageDto {
    private String type; // "CHAT", "JOIN", "LEAVE" 등
    private Long chatRoomId;
    private Long senderId;
    private String messageContent;
    private String messageType;
    private Long messageId;
    private Timestamp timestamp;
    
    // 프론트엔드와의 호환성을 위한 snake_case 필드들
    private Long chat_room_id;
    private Long sender_id;
    private String message_content;
    private String message_type;
    private Long message_id;
    private Timestamp created_at;
    private Integer is_read;
    private Timestamp deleted_at;
} 