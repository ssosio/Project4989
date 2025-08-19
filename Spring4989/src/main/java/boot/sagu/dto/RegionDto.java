package boot.sagu.dto;

import lombok.Data;

@Data
public class RegionDto {

	private String address;
	private int regionId;
	private String province;
	private String city;
	private String district;
	private String town;
	private double latitude;
	private double longitude;
}
