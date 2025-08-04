package boot.sagu.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import boot.sagu.dto.PostsDto;
import boot.sagu.service.PostsService;

@RestController
@CrossOrigin(origins = "http://localhost:5176/")
public class PostsController {
	
	@Autowired
	private PostsService postService;
	
	@PostMapping("/upload")
	public String fileUpload() {
		
		
		
		return null;
	}
	
	@PostMapping("/insert")
	public void insertPost(@RequestBody PostsDto dto)
	{
		
	}

}
