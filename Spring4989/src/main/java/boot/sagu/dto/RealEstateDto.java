package boot.sagu.dto;

import org.apache.ibatis.type.Alias;

import lombok.Data;

@Data
@Alias("estate")
public class RealEstateDto {
	
	private Long estateId;
	private Long postId;
	private String propertyType;
	private int area;
	private int rooms;
	private int floor;
	private String dealType;
	private int location;
	private String detail_location;
	private double latitude;
	private double longitude;
	
	// 수동으로 getter/setter 추가 (Lombok 문제 해결용)
	public String getDetail_location() {
		return detail_location;
	}
	
	public void setDetail_location(String detail_location) {
		this.detail_location = detail_location;
	}

}
