package boot.sagu.dto;

import org.apache.ibatis.type.Alias;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
@Alias("file")
public class ChatFileDto {

	private int file_id;
	private int chat_room_id;
	private int message_id;
	private String file_url;
	private int file_size;
	
	@JsonFormat(pattern = "yyyyMMddHHmmss")
	private int uploaded_at;
}
