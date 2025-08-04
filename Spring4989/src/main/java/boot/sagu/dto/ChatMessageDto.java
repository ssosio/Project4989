package boot.sagu.dto;

import org.apache.ibatis.type.Alias;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
@Alias("message")
public class ChatMessageDto {
	
	private int message_id;
	private int chat_room_id;
	private int sender_id;
	private String message_type;
	private String message_content;
	private int is_read;
	
	@JsonFormat(pattern = "yyyyMMddHHmmss")
	private int created_at;
	
}
