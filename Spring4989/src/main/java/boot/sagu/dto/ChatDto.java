package boot.sagu.dto;

import java.sql.Timestamp;

import org.apache.ibatis.type.Alias;

import lombok.Data;

@Data
@Alias("chat")
public class ChatDto {

	private int chat_room_id;
	private int product_id;
	private int seller_id;
	private int buyer_id;
	private Timestamp created_at;
	private Timestamp last_message_at;
	private String opponent_nickname;
	
	
}
