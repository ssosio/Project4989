package boot.sagu.service;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Param;

import boot.sagu.dto.ChatDto;

public interface ChatServiceInter {

public List<ChatDto> getAllChat(String login_id);

public List<Map<String, Object>> getChatRoomsWithLastMessage(@Param("memberId") Long memberId);

public Map<String, Object> getOtherUserInChatRoom(@Param("chatRoomId") Long chatRoomId, 
        @Param("currentMemberId") Long currentMemberId);
}
