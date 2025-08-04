package boot.sagu.mapper;

import java.util.List;
import boot.sagu.dto.PostsDto;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PostsMapper {
    List<PostsDto> getAuctionPosts(); // 경매글 리스트용
}