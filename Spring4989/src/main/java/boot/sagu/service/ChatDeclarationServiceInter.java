package boot.sagu.service;

import java.util.List;

import boot.sagu.dto.ChatDeclarationDto;

public interface ChatDeclarationServiceInter {

	public void insertDeclaration(ChatDeclarationDto dto);

	public List<ChatDeclarationDto> getChatDeclarationsForMember(long memberId);
	
	public List<ChatDeclarationDto> getAllDeclarations();
	
	public int countDeclarations();
}
