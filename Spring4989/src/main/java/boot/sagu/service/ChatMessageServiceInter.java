package boot.sagu.service;

import java.util.List;

import boot.sagu.dto.ChatMessageDto;

public interface ChatMessageServiceInter {

	public void insertMessage(ChatMessageDto dto);
	
	public List<ChatMessageDto> getAllMessages(Long chat_room_id);
	
	// 메시지 읽음 처리
	public void markMessageAsRead(Long chatRoomId, Long readerId);
	
	// 메시지 읽음 상태 초기화
	public void resetMessageReadStatus(Long chatRoomId);
}
