package boot.sagu.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import boot.sagu.dto.ChatDeclarationDto;
import boot.sagu.dto.ChatDeclarationResultDto;

@Mapper
public interface ChatDeclarationMapper {

	public void insertDeclaration(ChatDeclarationDto dto);
	
	public List<ChatDeclarationDto> getChatDeclarationsForMember(long memberId);
	
	public List<ChatDeclarationDto> getAllDeclarations();
	
	public int countDeclarations();
	
	/**
	 * 신고 결과 테이블에 데이터 삽입
	 * @param dto 신고 결과 DTO
	 */
	public void insertDeclarationResult(ChatDeclarationResultDto dto);
	
	/**
	 * 신고 ID로 신고 정보 조회
	 * @param declarationId 신고 ID
	 * @return 신고 정보
	 */
	public ChatDeclarationDto getDeclarationById(@Param("declarationId") Integer declarationId);
	
	/**
	 * chatdeclaration 테이블의 status와 result 업데이트
	 * @param params 파라미터 맵 (declarationId, status, result)
	 * @return 업데이트된 행의 수
	 */
	public void updateDeclarationStatus(java.util.Map<String, Object> params);
}
