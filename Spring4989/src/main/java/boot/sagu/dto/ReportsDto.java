package boot.sagu.dto;

import java.sql.Timestamp;

import org.apache.ibatis.type.Alias;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
@Alias("report")
public class ReportsDto {
	
	private Long reportId;
	private Long reporterId;
	@JsonProperty("targetType")
	private String targetType;
	@JsonProperty("targetPostId")// "POST" or "MEMBER"
    private Long targetPostId;
	@JsonProperty("targetMemberId")// targetType=POST일 때만 사용
    private Long targetMemberId; // targetType=MEMBER일 때만 사용
	private String reason;
	private String status;
	private Timestamp createdAt;
	
	

}
