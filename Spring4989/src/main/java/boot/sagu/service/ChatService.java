package boot.sagu.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import boot.sagu.dto.ChatDto;
import boot.sagu.mapper.ChatMapper;
import boot.sagu.mapper.MemberMapper;

@Service
public class ChatService implements ChatServiceInter{

	@Autowired
	ChatMapper chatmapper;
	
	@Autowired
	MemberMapper membermapper;

	@Override
	public List<ChatDto> getAllChat(String login_id) {
		System.out.println("ChatService.getAllChat 호출 - login_id: " + login_id);
		List<ChatDto> result = chatmapper.getAllChat(login_id);
		System.out.println("매퍼에서 반환된 결과: " + result);
		if (result != null) {
			System.out.println("결과 크기: " + result.size());
			for (int i = 0; i < result.size(); i++) {
				ChatDto chat = result.get(i);
				System.out.println("결과[" + i + "]: " + chat);
				if (chat != null) {
					System.out.println("  - chat_room_id: " + chat.getChat_room_id());
					System.out.println("  - product_id: " + chat.getProduct_id());
					System.out.println("  - seller_id: " + chat.getSeller_id());
					System.out.println("  - buyer_id: " + chat.getBuyer_id());
					System.out.println("  - opponent_nickname: " + chat.getOpponent_nickname());
				}
			}
		}
		return result;
	}
	
	public List<Map<String, Object>> getChatRoomsWithLastMessage(Long memberId) {
	    return chatmapper.getChatRoomsWithLastMessage(memberId);
	}
	
	public Map<String, Object> getOtherUserInChatRoom(Long chatRoomId, Long currentMemberId) {
	    return chatmapper.getOtherUserInChatRoom(chatRoomId, currentMemberId);
	}

}
