package boot.sagu.dto;

import org.apache.ibatis.type.Alias;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
@Alias("chat")
public class ChatDto {

	private int chat_room_id;
	private String product_type;
	private int product_id;
	private int seller_id;
	private int buyer_id;
	
	@JsonFormat(pattern = "yyyyMMddHHmmss")
	private int created_at;
	@JsonFormat(pattern = "yyyyMMddHHmmss")
	private int last_message_at;
}
