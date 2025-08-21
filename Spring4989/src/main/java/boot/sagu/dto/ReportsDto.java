package boot.sagu.dto;

import java.sql.Timestamp;

import org.apache.ibatis.type.Alias;

import lombok.Data;

@Data
@Alias("report")
public class ReportsDto {
	
	private Long reportId;
	private Long reporterId;
	private String targetType;   // "POST" or "MEMBER"
    private Long targetPostId;   // targetType=POST일 때만 사용
    private Long targetMemberId; // targetType=MEMBER일 때만 사용
	private String reason;
	private String status;
	private Timestamp createdAt;
	
	

}
