package boot.sagu.service;

import boot.sagu.dto.ChatDeclarationDto;
import boot.sagu.mapper.ChatDeclarationMapper;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ChatDeclarationService implements ChatDeclarationServiceInter{

	@Autowired
    private final ChatDeclarationMapper chatDeclarationMapper;

    public ChatDeclarationService(ChatDeclarationMapper chatDeclarationMapper) {
        this.chatDeclarationMapper = chatDeclarationMapper;
    }

    public void insertDeclaration(ChatDeclarationDto dto) {
        chatDeclarationMapper.insertDeclaration(dto);
    }

	@Override
	public List<ChatDeclarationDto> getChatDeclarationsForMember(long memberId) {
		return chatDeclarationMapper.getChatDeclarationsForMember(memberId);
	}

	@Override
	public List<ChatDeclarationDto> getAllDeclarations() {
		// TODO Auto-generated method stub
		return chatDeclarationMapper.getAllDeclarations();
	}

	@Override
	public int countDeclarations() {
		// TODO Auto-generated method stub
		return chatDeclarationMapper.countDeclarations();
	}
}