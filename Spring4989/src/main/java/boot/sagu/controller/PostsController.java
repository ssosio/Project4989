package boot.sagu.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import boot.sagu.dto.PostsDto;
import boot.sagu.service.PostsService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/post")
public class PostsController {
	
	@Autowired
	private PostsService postService;
	
	@GetMapping("/list")
	public List<PostsDto> list()
	{
		return postService.getAllPostData();
	}
	
	
	
	@PostMapping("/upload")
	public String fileUpload() {
		
		
		
		return null;
	}
	
	@PostMapping("/insert")
	public void insertPost(@RequestBody PostsDto dto)
	{
		
	}

}
