package boot.sagu.dto;

import org.apache.ibatis.type.Alias;

import lombok.Data;

@Data
@Alias("category")
public class CategoryDto {

	private int categoryId;
	private int parentId;
	private String name;
}
