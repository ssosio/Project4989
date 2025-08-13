package boot.sagu.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import boot.sagu.dto.RegionDto;
import boot.sagu.mapper.RegionMapper;

@Service
public class RegionService {

	@Autowired
	RegionMapper regionmapper;
	
	public void insertRegion(RegionDto dto) {
		
		regionmapper.insertRegion(dto);
	}
}
