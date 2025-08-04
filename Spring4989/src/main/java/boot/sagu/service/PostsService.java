package boot.sagu.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import boot.sagu.dto.PostsDto;
import boot.sagu.mapper.PostsMapper;

@Service
public class PostsService implements PostsServiceInter{
	
	@Autowired
	private PostsMapper postMapper;

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
	
}
