package boot.sagu.mapper;

import org.apache.ibatis.annotations.Mapper;

import boot.sagu.dto.PhotoDto;

@Mapper
public interface PhotoMapperInter {

	public void insertPhoto(PhotoDto photoDto);
	
}
