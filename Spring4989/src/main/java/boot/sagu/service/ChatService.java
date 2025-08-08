package boot.sagu.service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import boot.sagu.dto.ChatDto;
import boot.sagu.dto.ChatMessageDto;
import boot.sagu.mapper.ChatMapper;
import boot.sagu.mapper.ChatMessageMapper;
import boot.sagu.mapper.MemberMapper;

@Service
public class ChatService implements ChatServiceInter{

	@Autowired
	ChatMapper chatmapper;
	
	@Autowired
	MemberMapper membermapper;
	
	@Autowired
	ChatMessageMapper chatmessagemapper;

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
	
	  @Override
	    @Transactional
	    public void updateExit(Long chatRoomId, Long currentMemberId) {
	        
	        // 1. chatRoomId를 통해 buyer_id와 seller_id 조회
	        Map<String, Object> chatRoomInfo = chatmapper.getChatRoomInfoById(chatRoomId);
	        Long buyerId = (Long) chatRoomInfo.get("buyer_id");
	        Long sellerId = (Long) chatRoomInfo.get("seller_id");
	        
	        // 2. 채팅방 나가기 상태 업데이트
	        chatmapper.updateExitStatus(chatRoomId, currentMemberId, buyerId, sellerId);

	        String nickName = chatmapper.getMemberNickname(currentMemberId);
	        if (nickName == null) {
	            System.err.println("경고: member_id " + currentMemberId + "에 대한 닉네임을 찾을 수 없습니다.");
	            // 닉네임이 없을 경우, 기본 메시지로 설정
	            nickName = "알 수 없는 사용자";
	        }
	        
	        // 3. 시스템 메시지 추가
	        ChatMessageDto systemMessage = new ChatMessageDto();
	        systemMessage.setChat_room_id(chatRoomId);
	        systemMessage.setSender_id(currentMemberId);
	        String messageContent = nickName + "님이 채팅방을 나갔습니다.";
	        systemMessage.setMessage_content(messageContent); 
	        chatmessagemapper.insertSystemMessage(systemMessage);
	        
	        // 4. ✨ 새로 추가된 로직: 두 사용자의 탈퇴 상태 확인 및 메시지 삭제
	        Map<String, Integer> exitStatuses = chatmapper.getChatroomExitStatus(chatRoomId); // ✨ 새로운 매퍼 메서드 호출
	        
	        // Map에서 값을 가져올 때 null 체크 및 형변환
	        Integer buyerExitStatus = (Integer) exitStatuses.get("buyer_exit_status");
	        Integer sellerExitStatus = (Integer) exitStatuses.get("seller_exit_status");
	        
	        // 5. ✨ 두 사용자가 모두 나갔는지 확인
	        if (buyerExitStatus != null && sellerExitStatus != null && buyerExitStatus == 1 && sellerExitStatus == 1) {
	            System.out.println("두 사용자 모두 채팅방에서 나갔으므로 메시지를 일괄 삭제합니다.");
	            chatmessagemapper.updateAllMessagesDeletedAt(chatRoomId);
	        } else {
	            System.out.println("아직 채팅방에 사용자가 남아있습니다. 메시지 삭제를 건너뜁니다.");
	        }
	    }
	
}

	


