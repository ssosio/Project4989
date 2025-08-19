package boot.sagu.service;

import boot.sagu.dto.ChatDeclarationDto;
import boot.sagu.mapper.ChatDeclarationMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ChatDeclarationService {

	@Autowired
    private final ChatDeclarationMapper chatDeclarationMapper;

    public ChatDeclarationService(ChatDeclarationMapper chatDeclarationMapper) {
        this.chatDeclarationMapper = chatDeclarationMapper;
    }

    public void insertDeclaration(ChatDeclarationDto dto) {
        chatDeclarationMapper.insertDeclaration(dto);
    }
}