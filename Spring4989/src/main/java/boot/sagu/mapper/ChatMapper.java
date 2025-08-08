package boot.sagu.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import boot.sagu.dto.ChatDto;

@Mapper
public interface ChatMapper {

	public List<ChatDto> getAllChat(@Param("login_id") String login_id);
	
	public List<Map<String, Object>> getChatRoomsWithLastMessage(@Param("memberId") Long memberId);
	
	public Map<String, Object> getOtherUserInChatRoom(@Param("chatRoomId") Long chatRoomId, 
            @Param("currentMemberId") Long currentMemberId);
	
}
