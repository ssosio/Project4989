package boot.sagu.service;

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
	
}
