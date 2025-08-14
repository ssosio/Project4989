package boot.sagu.mapper;

import java.util.List;
import java.util.Map;

import boot.sagu.dto.CarDto;
import boot.sagu.dto.ItemDto;
import boot.sagu.dto.PostsDto;
import boot.sagu.dto.RealEstateDto;

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
	
	public int countFavorite(@Param("postId") int postId);
	public int existsFavorite(@Param("postId") int postId, @Param("memberId") int memberId);
	public int insertFavorite(@Param("postId") int postId, @Param("memberId") int memberId);
	public int deleteFavorite(@Param("postId") int postId, @Param("memberId") int memberId);
	
}