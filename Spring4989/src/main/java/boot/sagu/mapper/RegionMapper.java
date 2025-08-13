package boot.sagu.mapper;

import org.apache.ibatis.annotations.Mapper;

import boot.sagu.dto.RegionDto;

@Mapper
public interface RegionMapper {
	
	public void insertRegion(RegionDto dto);
}
