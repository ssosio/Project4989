package boot.sagu.service;

import java.util.List;
import boot.sagu.dto.PostsDto;

public interface AuctionServiceInter {
	List<PostsDto> getAuctionPosts();
}
