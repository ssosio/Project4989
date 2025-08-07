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
	private String location;

}
