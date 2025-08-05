package boot.sagu.service;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import boot.sagu.dto.PhotoDto;
import boot.sagu.dto.PostsDto;
import boot.sagu.mapper.PhotoMapperInter;
import boot.sagu.mapper.PostsMapperInter;
import jakarta.servlet.http.HttpSession;

@Service
public class PostsService implements PostsServiceInter{
	
	@Autowired
	private PostsMapperInter postMapper;

	@Autowired
	private PhotoMapperInter photoMapper;
	
	@Override
	public void insertPost(PostsDto pdto) {
		// TODO Auto-generated method stub
		postMapper.insertPost(pdto);
		
	}

	@Override
	public List<PostsDto> getAllPostData() {
		// TODO Auto-generated method stub
		return postMapper.getAllPostData();
	}

	@Override
	public PostsDto getPostData(int post_id) {
		// TODO Auto-generated method stub
		return postMapper.getPostData(post_id);
	}



	@Override
	public void insertPhoto(PhotoDto photoDto) {
		// TODO Auto-generated method stub
		photoMapper.insertPhoto(photoDto);
	}

	@Override
	@Transactional
	public void insertPostWithPhoto(PostsDto pdto, List<MultipartFile> uploadFiles,HttpSession session) {
		// TODO Auto-generated method stub
		
		postMapper.insertPost(pdto);
		
		String path=session.getServletContext().getRealPath("/save");
		
		for(MultipartFile file:uploadFiles) {
			
			String fileName=file.getOriginalFilename();
			
			String saveName=new SimpleDateFormat("yyyyMMddHHmmss").format(new Date())+fileName;
			
			try {
				file.transferTo(new File(path+"\\"+saveName));
			} catch (IllegalStateException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			
			PhotoDto photo=new PhotoDto();
			photo.setPostId(pdto.getPostId());
			photo.setPhotoUrl(saveName);
			photoMapper.insertPhoto(photo);
			
		}
		
		
	}
	
}
