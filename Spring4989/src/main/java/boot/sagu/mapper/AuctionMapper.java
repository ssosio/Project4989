package boot.sagu.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import boot.sagu.dto.AuctionDto;
import boot.sagu.dto.AuctionGuaranteeDTO;
import boot.sagu.dto.MemberDto;
import boot.sagu.dto.PostsDto;

@Mapper
public interface AuctionMapper {
	public List<PostsDto> getAuctionPosts(); // 경매글 리스트용
	public PostsDto getAuctionDetail(long postId); // 경매글 상세 조회용
	public void insertBid(AuctionDto auctionDto); // 입찰 정보 저장용
	public AuctionDto getHighestBid(long postId); // 최고가 조회용
	public MemberDto getMemberNickname(long memberId); // 작성자 닉네임 조회용
	
	// 경매 종료 처리용 메서드들
	public List<PostsDto> getEndedAuctions(); // 종료된 경매 목록 조회
	public void updateWinnerId(@Param("postId") long postId, @Param("winnerId") long winnerId); // winner_id 업데이트
	public void updateAuctionStatus(@Param("postId") long postId, @Param("status") String status); // 경매 상태 업데이트
	public void updateAuctionStatusAndEndTime(@Param("postId") long postId, @Param("status") String status); // 수동 경매 종료 시 상태와 종료시간 업데이트
	
	//보증금 메서드
	public int countAuctionGuaranteeByPostAndMember(@Param("postId")long postId,@Param("memberId")long memberId); //게시글에 보증금 납부했는지
	//보증금 납부
	public void insertGuarantee(AuctionGuaranteeDTO AuctionGuaranteeDto); 
	//낙찰자가 아닌 사람들의 입찰자들의 리스트뽑기
	public List<AuctionGuaranteeDTO> findNonWinnerGuarantees(@Param("postID")long postId,@Param("winnerId")long winnerId);
	//환불
	public void updateRefundStatus(@Param("guaranteeID")long guaranteeId);
	
	
}
