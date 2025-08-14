package boot.sagu.service;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import boot.sagu.dto.CarDto;
import boot.sagu.dto.FavoritesDto;
import boot.sagu.dto.ItemDto;
import boot.sagu.dto.PhotoDto;
import boot.sagu.dto.PostsDto;
import boot.sagu.dto.RealEstateDto;
import jakarta.servlet.http.HttpSession;

public interface PostsServiceInter {
	public void insertPost(PostsDto pdto);
	public List<PostsDto> getAllPostData();
	public Map<String, Object> getPostData(@RequestParam("postId") Long postId);
	public void insertPhoto(PhotoDto photoDto);
	public void insertPostWithPhoto(PostsDto pdto,List<MultipartFile> uploadFile,HttpSession session,CarDto cdto,RealEstateDto rdto,ItemDto idto);
	public List<Map<String, Object>> getPostListWithNick();
	public void increaseViewCount(@RequestParam("postId") Long postId);
	
	
	public int countFavorite(int postId);
	public boolean isFavorited(int postId, int memberId);
	public boolean toggleFavorite(int postId, int memberId);
	
	
}
