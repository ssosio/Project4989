package boot.sagu.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import boot.sagu.dto.AuctionDto;
import boot.sagu.dto.AuctionGuaranteeDTO;
import boot.sagu.dto.FavoritesDto;
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
	
	// 찜 관련 메서드들
	public boolean checkFavoriteStatus(@Param("postId") long postId, @Param("memberId") long memberId); // 찜 상태 확인
	public void insertFavorite(FavoritesDto favoritesDto); // 찜 추가
	public void deleteFavorite(@Param("postId") long postId, @Param("memberId") long memberId); // 찜 삭제
	public int getFavoriteCount(@Param("postId") long postId); // 찜 개수 조회
	
	// 경매 사진 조회
	public List<Map<String, Object>> getAuctionPhotos(long postId);
	
	//보증금 메서드
	public int countAuctionGuaranteeByPostAndMember(@Param("postId")long postId,@Param("memberId")long memberId); //게시글에 보증금 납부했는지
	//보증금 납부
	public void insertGuarantee(AuctionGuaranteeDTO AuctionGuaranteeDto); 
	//낙찰자가 아닌 사람들의 입찰자들의 리스트뽑기
	public List<AuctionGuaranteeDTO> findNonWinnerGuarantees(@Param("postID")long postId,@Param("winnerId")long winnerId);
	//환불
	public void updateRefundStatus(@Param("guaranteeID")long guaranteeId);
	//경매 시작가
	public int getStartPrice(@Param("postId") long postId);
	
	// 경매 삭제
	public void deleteAuction(@Param("postId") long postId);
	
	// 경매 삭제 전 연관된 used_items 데이터 삭제
	public void deleteUsedItemsByPostId(@Param("postId") long postId);
	
	// 경매 삭제 전 연관된 사진 데이터 삭제
	public void deletePhotosByPostId(@Param("postId") long postId);
	
	// 경매 삭제 전 연관된 favorites 데이터 삭제
	public void deleteFavoritesByPostId(@Param("postId") long postId);
	
	// 경매 삭제 전 연관된 chatroom 데이터 삭제
	public void deleteChatroomsByPostId(@Param("postId") long postId);
	
	// 입찰 기록 조회 (최근 5개, 닉네임 포함)
	public List<Map<String, Object>> getBidHistory(@Param("postId") long postId);
	
	// 조회수 증가
	public void incrementViewCount(@Param("postId") long postId);
	
}
