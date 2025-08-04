package boot.sagu.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import boot.sagu.dto.PostsDto;

@Mapper
public interface AuctionMapper {
	public List<PostsDto> getAuctionPosts(); // 경매글 리스트용
}
