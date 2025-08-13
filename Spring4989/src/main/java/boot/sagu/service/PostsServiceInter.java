package boot.sagu.service;

import java.util.List;

import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import boot.sagu.dto.CarDto;
import boot.sagu.dto.ItemDto;
import boot.sagu.dto.PhotoDto;
import boot.sagu.dto.PostsDto;
import boot.sagu.dto.RealEstateDto;
import jakarta.servlet.http.HttpSession;

public interface PostsServiceInter {
	public void insertPost(PostsDto pdto);
	public List<PostsDto> getAllPostData();
	public PostsDto getPostData(@RequestParam("postId") Long postId);
	public void insertPhoto(PhotoDto photoDto);
	public void insertPostWithPhoto(PostsDto pdto,List<MultipartFile> uploadFile,HttpSession session,CarDto cdto,RealEstateDto rdto,ItemDto idto);

	
}