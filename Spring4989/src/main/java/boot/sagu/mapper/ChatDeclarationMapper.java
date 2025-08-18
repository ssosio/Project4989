package boot.sagu.mapper;

import org.apache.ibatis.annotations.Mapper;

import boot.sagu.dto.ChatDeclarationDto;

@Mapper
public interface ChatDeclarationMapper {

	public void insertDeclaration(ChatDeclarationDto dto);
}
