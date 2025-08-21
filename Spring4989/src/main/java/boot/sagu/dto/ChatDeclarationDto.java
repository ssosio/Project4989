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
	private int is_read;
	
//	  private int declarationId; // is_read와 동일한 방식으로 변경
//	    private int declarationChatRoomId;
//	    private int declarationMemberId;
//	    private int declarationOppositeMemberId;
//	    private String declarationType;
//	    private String reportedChatContent;
//	    private Timestamp createdAt;
//	    private int isRead;
}
