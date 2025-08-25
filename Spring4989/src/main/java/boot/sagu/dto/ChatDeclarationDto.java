package boot.sagu.dto;

import java.sql.Timestamp;

public class ChatDeclarationDto {

	private Integer declaration_id;
	private Integer declaration_chat_room_id;
	private Integer declaration_memberid;
	private Integer declaration_opposite_memberid;
	private String declaration_type;
	private String declaration_content;
	private Timestamp declaration_time;
	private String status;
	private String result;

	// 기본 생성자 (MyBatis에서 필수)
	public ChatDeclarationDto() {
		System.out.println(">>> [DEBUG] ChatDeclarationDto 기본 생성자 호출됨");
	}

	// 전체 생성자
	public ChatDeclarationDto(Integer declaration_id, Integer declaration_chat_room_id, 
							Integer declaration_memberid, Integer declaration_opposite_memberid,
							String declaration_type, String declaration_content, 
							Timestamp declaration_time, String status, String result) {
		System.out.println(">>> [DEBUG] ChatDeclarationDto 전체 생성자 호출됨");
		this.declaration_id = declaration_id;
		this.declaration_chat_room_id = declaration_chat_room_id;
		this.declaration_memberid = declaration_memberid;
		this.declaration_opposite_memberid = declaration_opposite_memberid;
		this.declaration_type = declaration_type;
		this.declaration_content = declaration_content;
		this.declaration_time = declaration_time;
		this.status = status;
		this.result = result;
	}

	// Getter와 Setter
	public Integer getDeclaration_id() { return declaration_id; }
	public void setDeclaration_id(Integer declaration_id) { 
		System.out.println(">>> [DEBUG] setDeclaration_id 호출됨: " + declaration_id);
		this.declaration_id = declaration_id; 
	}

	public Integer getDeclaration_chat_room_id() { return declaration_chat_room_id; }
	public void setDeclaration_chat_room_id(Integer declaration_chat_room_id) { 
		System.out.println(">>> [DEBUG] setDeclaration_chat_room_id 호출됨: " + declaration_chat_room_id);
		this.declaration_chat_room_id = declaration_chat_room_id; 
	}

	public Integer getDeclaration_memberid() { return declaration_memberid; }
	public void setDeclaration_memberid(Integer declaration_memberid) { 
		System.out.println(">>> [DEBUG] setDeclaration_memberid 호출됨: " + declaration_memberid);
		this.declaration_memberid = declaration_memberid; 
	}

	public Integer getDeclaration_opposite_memberid() { return declaration_opposite_memberid; }
	public void setDeclaration_opposite_memberid(Integer declaration_opposite_memberid) { 
		System.out.println(">>> [DEBUG] setDeclaration_opposite_memberid 호출됨: " + declaration_opposite_memberid);
		this.declaration_opposite_memberid = declaration_opposite_memberid; 
	}

	public String getDeclaration_type() { return declaration_type; }
	public void setDeclaration_type(String declaration_type) { 
		System.out.println(">>> [DEBUG] setDeclaration_type 호출됨: " + declaration_type);
		this.declaration_type = declaration_type; 
	}

	public String getDeclaration_content() { return declaration_content; }
	public void setDeclaration_content(String declaration_content) { 
		System.out.println(">>> [DEBUG] setDeclaration_content 호출됨: " + declaration_content);
		this.declaration_content = declaration_content; 
	}

	public Timestamp getDeclaration_time() { return declaration_time; }
	public void setDeclaration_time(Timestamp declaration_time) { 
		System.out.println(">>> [DEBUG] setDeclaration_time 호출됨: " + declaration_time);
		this.declaration_time = declaration_time; 
	}

	public String getStatus() { return status; }
	public void setStatus(String status) { 
		System.out.println(">>> [DEBUG] setStatus 호출됨: " + status);
		this.status = status; 
	}

	public String getResult() { return result; }
	public void setResult(String result) { 
		System.out.println(">>> [DEBUG] setResult 호출됨: " + result);
		this.result = result; 
	}

	@Override
	public String toString() {
		return "ChatDeclarationDto{" +
				"declaration_id=" + declaration_id +
				", declaration_chat_room_id=" + declaration_chat_room_id +
				", declaration_memberid=" + declaration_memberid +
				", declaration_opposite_memberid=" + declaration_opposite_memberid +
				", declaration_type='" + declaration_type + '\'' +
				", declaration_content='" + declaration_content + '\'' +
				", declaration_time=" + declaration_time +
				", status='" + status + '\'' +
				", result='" + result + '\'' +
				'}';
	}
}
