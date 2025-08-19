package boot.sagu.dto;

import java.sql.Timestamp;

import org.apache.ibatis.type.Alias;

import lombok.Data;

@Data
@Alias("report")
public class ReportsDto {
	
	private Long reportId;
	private Long reporterId;
	private String targetType;
	private Long targetId;
	private String reason;
	private String status;
	private Timestamp createdAt;
	
	

}
