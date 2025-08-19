package boot.sagu.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import boot.sagu.dto.MemberRegionDto;

@Mapper
public interface MemberRegionMapper {
   public void insertMemberRegion(MemberRegionDto dto);
   
   public int countMemberRegionsByMemberId(@Param("memberId") int memberId);

   public int findMaxIsPrimaryByMemberId(@Param("memberId") int memberId);
}
