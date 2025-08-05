package boot.sagu.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import boot.sagu.dto.AuctionDto;
import boot.sagu.dto.PostsDto;


@Mapper
public interface AuctionMapper {
	public List<PostsDto> getAuctionPosts(); // 경매글 리스트용
	public PostsDto getAuctionDetail(long postId); // 경매글 상세 조회용
	public void insertBid(AuctionDto auctionDto); // 입찰 정보 저장용
	public AuctionDto getHighestBid(long postId); // 최고가 조회용
}
