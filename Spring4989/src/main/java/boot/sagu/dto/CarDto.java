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
	private String location;

}
