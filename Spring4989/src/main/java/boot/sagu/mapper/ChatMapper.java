package boot.sagu.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import boot.sagu.dto.ChatDto;

@Mapper
public interface ChatMapper {

	public List<ChatDto> getAllChat(@Param("login_id") String login_id);
	
}
