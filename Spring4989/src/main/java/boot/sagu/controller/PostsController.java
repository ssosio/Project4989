package boot.sagu.controller;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import boot.sagu.dto.PostsDto;
import boot.sagu.service.PostsService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/post")
public class PostsController {
	
	@Autowired
	private PostsService postService;
	
	String photoName;
	
	@GetMapping("/list")
	public List<PostsDto> list()
	{
		return postService.getAllPostData();
	}
	
	
	
	@PostMapping("/upload")
	public String fileUpload(@RequestParam("uploadFile") MultipartFile uploadFile) 
	{
		String fileName=uploadFile.getOriginalFilename();
		
		String path="";
		
		File file=new File(path+"\\"+photoName);
		
		SimpleDateFormat sdf=new SimpleDateFormat("yyyyMMddHHmmss");
		photoName=sdf.format(new Date())+uploadFile.getOriginalFilename();
		
		
		
		
		
		return photoName;
	}
	
	@PostMapping("/insert")
	public void insertPost(@RequestBody PostsDto pdto)
	{
		
	}

}
