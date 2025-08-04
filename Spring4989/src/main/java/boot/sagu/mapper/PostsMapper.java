package boot.sagu.mapper;

import java.util.List;
import boot.sagu.dto.PostsDto;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PostsMapper {
	public void insertPost(PostsDto pdto);
	public List<PostsDto> getAllPostData();
	public PostsDto getPostData(int post_id);
}