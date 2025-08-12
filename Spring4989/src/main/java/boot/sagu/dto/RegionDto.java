package boot.sagu.dto;

import org.apache.ibatis.type.Alias;

import lombok.Data;

@Data
public class RegionDto {

	private int region_id;
	private String province;
	private String city;
	private String district;
	private double latitude;
	private double longitude;
}
