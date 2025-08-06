package boot.sagu.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import boot.sagu.dto.PhotoDto;

@Mapper
public interface PhotoMapperInter {

	public void insertPhoto(@Param("list") List<PhotoDto> list);
	
}
