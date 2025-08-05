package boot.sagu.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import boot.sagu.dto.ChatMessageDto;
import boot.sagu.mapper.ChatMessageMapper;

@Service
public class ChatMessageService implements ChatMessageServiceInter{

	@Autowired
	ChatMessageMapper chatMessageMapper;
	
	@Override
	public void insertMessage(ChatMessageDto dto) {
		// TODO Auto-generated method stub
		chatMessageMapper.insertMessage(dto);
	}

	@Override
	public List<ChatMessageDto> getAllMessages(Long chat_room_id) {
		System.out.println("=== ChatMessageService.getAllMessages ===");
		System.out.println("입력받은 chat_room_id: " + chat_room_id);
		
		try {
			List<ChatMessageDto> result = chatMessageMapper.getAllMessages(chat_room_id);
			System.out.println("Mapper에서 반환된 결과: " + result);
			System.out.println("결과 클래스: " + (result != null ? result.getClass().getName() : "null"));
			
			if (result != null) {
				System.out.println("결과 크기: " + result.size());
				for (int i = 0; i < result.size(); i++) {
					ChatMessageDto msg = result.get(i);
					System.out.println("메시지 " + i + ": " + msg);
					System.out.println("메시지 " + i + " 클래스: " + (msg != null ? msg.getClass().getName() : "null"));
					if (msg != null) {
						System.out.println("  - message_id: " + msg.getMessage_id());
						System.out.println("  - chat_room_id: " + msg.getChat_room_id());
						System.out.println("  - sender_id: " + msg.getSender_id());
						System.out.println("  - message_type: " + msg.getMessage_type());
						System.out.println("  - message_content: " + msg.getMessage_content());
						System.out.println("  - created_at: " + msg.getCreated_at());
						System.out.println("  - is_read: " + msg.getIs_read());
					} else {
						System.out.println("  - 메시지 " + i + "는 null입니다.");
					}
				}
			} else {
				System.out.println("Mapper에서 null이 반환되었습니다.");
			}
			return result;
		} catch (Exception e) {
			System.out.println("=== ChatMessageService 에러 발생 ===");
			System.out.println("에러 메시지: " + e.getMessage());
			e.printStackTrace();
			return null;
		}
	}
	
	@Override
	// 메시지 읽음 처리 메서드
	public void markMessageAsRead(Long chatRoomId, Long readerId) {
		System.out.println("=== ChatMessageService.markMessageAsRead ===");
		System.out.println("채팅방 ID: " + chatRoomId);
		System.out.println("읽은 사용자 ID: " + readerId);
		
		try {
			// 상대방이 보낸 안읽은 메시지들을 읽음 처리
			int updatedRows = chatMessageMapper.updateMessagesAsRead(chatRoomId, readerId);
			System.out.println("읽음 처리된 메시지 수: " + updatedRows);
			
		} catch (Exception e) {
			System.out.println("=== 메시지 읽음 처리 에러 ===");
			System.out.println("에러 메시지: " + e.getMessage());
			e.printStackTrace();
		}
	}
	
	@Override
	// 메시지 읽음 상태 초기화 메서드
	public void resetMessageReadStatus(Long chatRoomId) {
		System.out.println("=== ChatMessageService.resetMessageReadStatus ===");
		System.out.println("채팅방 ID: " + chatRoomId);
		
		try {
			// 모든 메시지를 안읽음 상태로 초기화
			int updatedRows = chatMessageMapper.updateAllMessagesToUnread(chatRoomId);
			System.out.println("초기화된 메시지 수: " + updatedRows);
			
		} catch (Exception e) {
			System.out.println("=== 메시지 읽음 상태 초기화 에러 ===");
			System.out.println("에러 메시지: " + e.getMessage());
			e.printStackTrace();
		}
	}

}
