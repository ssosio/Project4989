package boot.sagu.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import boot.sagu.dto.ChatDeclarationDto;

@Mapper
public interface ChatDeclarationMapper {

	public void insertDeclaration(ChatDeclarationDto dto);
	
	public List<ChatDeclarationDto> getChatDeclarationsForMember(long memberId);
	
	public List<ChatDeclarationDto> getAllDeclarations();
	
	public int countDeclarations();
}
