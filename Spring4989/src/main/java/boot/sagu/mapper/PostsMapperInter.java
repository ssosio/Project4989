package boot.sagu.mapper;

import java.util.List;
import java.util.Map;

import boot.sagu.dto.PostsDto;
import boot.sagu.dto.ReportsDto;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.web.bind.annotation.RequestParam;

@Mapper
public interface PostsMapperInter {
	public void insertPost(PostsDto pdto);
	public List<PostsDto> getAllPostData();
	public Map<String, Object> getPostData(@RequestParam("postId") Long postId);
	public List<Map<String, Object>> getPostListWithNick();
	public void increaseViewCount(@RequestParam("postId") Long postId);
	
	//	좋아요	
	public int countFavorite(@Param("postId") Long postId);
	public int existsFavorite(@Param("postId") Long postId, @Param("memberId") Long memberId);
	public int insertFavorite(@Param("postId") Long postId, @Param("memberId") Long memberId);
	public int deleteFavorite(@Param("postId") Long postId, @Param("memberId") Long memberId);
	
	//신고
	public void insertReport(ReportsDto dto);
	
}