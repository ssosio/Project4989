package boot.sagu.mapper;

import org.apache.ibatis.annotations.Mapper;
import boot.sagu.dto.MemberDto;

@Mapper
public interface MemberMapper {
    public void signup(MemberDto dto);
    public MemberDto findByLoginId(String loginId);
}