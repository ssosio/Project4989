package boot.sagu.dto;

import org.apache.ibatis.type.Alias;

import lombok.Data;

@Data
@Alias("photo")
public class PhotoDto {

	private int photoId;
	private int postId;
	private String photoUrl;
	private int isMain;
	
}
