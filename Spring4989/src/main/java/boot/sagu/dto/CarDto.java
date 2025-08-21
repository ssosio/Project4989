package boot.sagu.dto;

import org.apache.ibatis.type.Alias;

import lombok.Data;

@Data
@Alias("car")
public class CarDto {
	
	private Long carId;
	private Long postId;
	private String brand;
	private String model;
	private int year;
	private int mileage;
	private String fuelType;
	private String transmission;
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
