package boot.sagu.service;

import java.util.List;
import java.util.Map;
import boot.sagu.dto.AuctionDto;
import boot.sagu.dto.FavoritesDto;
import boot.sagu.dto.MemberDto;
import boot.sagu.dto.PostsDto;

public interface AuctionServiceInter {
	List<PostsDto> getAuctionPosts();
	
	// 경매 상세 정보
	PostsDto getAuctionDetail(long postId);
	
	// 최고 입찰 정보
	AuctionDto getHighestBid(long postId);
	
	// 회원 닉네임 조회
	MemberDto getMemberNickname(long memberId);
	
	// 찜 관련
	boolean checkFavoriteStatus(long postId, long memberId);
	Map<String, Object> toggleFavorite(FavoritesDto favoritesDto);
	int getFavoriteCount(long postId);
	
	// 입찰 처리
	String placeBid(AuctionDto auctionDto);
	
	// 경매 종료
	String endAuction(long postId);
	
	// 자동 경매 종료 체크 (스케줄러용)
	void checkAndEndAuctions();
	
	// 경매 사진 조회
	List<Map<String, Object>> getAuctionPhotos(long postId);
}
