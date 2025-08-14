package boot.sagu.dto;

import java.sql.Timestamp;

import lombok.Data;

@Data
public class ChatDeclarationDto {

	private int declaration_id;
	private int declaration_chat_room_id;
	private int declaration_memberid;
	private int declaration_opposite_memberid;
	private String declaration_type;
	private String declaration_content;
	private Timestamp declaration_time;
}
