package boot.sagu.service;

import java.util.List;

import boot.sagu.dto.PostsDto;

public interface PostsServiceInter {
	public void insertPost(PostsDto pdto);
	public List<PostsDto> getAllPostData();
	public PostsDto getPostData(int post_id);
}
