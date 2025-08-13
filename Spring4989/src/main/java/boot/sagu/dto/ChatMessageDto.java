package boot.sagu.dto;

import java.sql.Timestamp;

import org.apache.ibatis.type.Alias;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
//@Alias("message")
public class ChatMessageDto {
	
	private Long message_id;
	private Long chat_room_id;
	private Long sender_id;
	private String message_type;
	private String message_content;
	private String fileUrl; // 추가
	private int is_read;
	private Timestamp deleted_at;
	
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	private Timestamp created_at;
	
	
}