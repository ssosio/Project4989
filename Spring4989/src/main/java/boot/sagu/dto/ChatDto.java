package boot.sagu.dto;

import java.sql.Timestamp;

import org.apache.ibatis.type.Alias;

import lombok.Data;

@Data
@Alias("chat")
public class ChatDto {

	private Long chat_room_id;
	private Long product_id;
	private Long seller_id;
	private Long buyer_id;
	private Timestamp created_at;
	private Timestamp last_message_at;
	private String opponent_nickname;
	private int buyer_exit_status;
	private int seller_exit_status;
	private Timestamp deleted_at;
	
}
