package boot.sagu.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import boot.sagu.dto.ChatMessageDto;

@Mapper
public interface ChatMessageMapper {

	public void insertMessage(ChatMessageDto dto);
	
	public List<ChatMessageDto> getAllMessages(Long chat_room_id);
	
	// 메시지 읽음 처리
	public int updateMessagesAsRead(Long chatRoomId, Long readerId);
	
	// 디버깅용: 메시지 상태 확인
	public List<ChatMessageDto> getMessageStatus(Long chatRoomId);
	
	// 테스트용: 모든 메시지를 안읽음으로 설정
	public int updateAllMessagesToUnread(Long chatRoomId);
	
	// 테스트용: 특정 조건의 메시지만 업데이트
	public int updateSpecificMessageAsRead(Long chatRoomId, Long readerId);
}
