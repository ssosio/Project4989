package boot.sagu.mapper;

import org.apache.ibatis.annotations.Mapper;
import boot.sagu.dto.MemberDto;
import boot.sagu.dto.SocialAccountDto;

@Mapper
public interface MemberMapper {
    public void signup(MemberDto dto);
    public MemberDto findByLoginId(String loginId);
    public int countByLoginId(String loginId);
    public MemberDto findByEmail(String email);
    public void insertSocialAccount(SocialAccountDto socialAccountDto);
}