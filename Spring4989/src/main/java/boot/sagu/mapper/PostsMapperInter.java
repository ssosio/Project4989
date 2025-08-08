package boot.sagu.mapper;

import java.util.List;
import boot.sagu.dto.PostsDto;
import org.apache.ibatis.annotations.Mapper;
import org.springframework.web.bind.annotation.RequestParam;

@Mapper
public interface PostsMapperInter {
	public void insertPost(PostsDto pdto);
	public List<PostsDto> getAllPostData();
	public PostsDto getPostData(@RequestParam("postId") Long postId);
}