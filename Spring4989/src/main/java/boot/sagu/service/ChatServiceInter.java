package boot.sagu.service;

import java.util.List;

import boot.sagu.dto.ChatDto;

public interface ChatServiceInter {

public List<ChatDto> getAllChat(String login_id);
	
}
