package boot.sagu.mapper;

import java.util.List;
import java.util.Map;

import boot.sagu.dto.MemberDto;
import boot.sagu.dto.PostsDto;
import org.apache.ibatis.annotations.Mapper;
import org.springframework.web.bind.annotation.RequestParam;

@Mapper
public interface PostsMapperInter {
	public void insertPost(PostsDto pdto);
	public List<PostsDto> getAllPostData();
	public Map<String, Object> getPostData(@RequestParam("postId") Long postId);
	public List<Map<String, Object>> getPostListWithNick();
}