package boot.sagu.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import boot.sagu.dto.PhotoDto;
import boot.sagu.dto.PostsDto;
import jakarta.servlet.http.HttpSession;

public interface PostsServiceInter {
	public void insertPost(PostsDto pdto);
	public List<PostsDto> getAllPostData();
	public PostsDto getPostData(int post_id);
	public void insertPhoto(PhotoDto photoDto);
	public void insertPostWithPhoto(PostsDto pdto,List<MultipartFile> uploadFile,HttpSession session);
}
