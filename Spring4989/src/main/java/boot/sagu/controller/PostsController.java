package boot.sagu.controller;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import boot.sagu.config.JwtUtil;
import boot.sagu.dto.CarDto;
import boot.sagu.dto.ItemDto;
import boot.sagu.dto.MemberDto;
import boot.sagu.dto.PostsDto;
import boot.sagu.dto.RealEstateDto;
import boot.sagu.service.MemberServiceInter;
import boot.sagu.service.PostsService;
import jakarta.servlet.http.HttpSession;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/post")
public class PostsController {
	
	@Autowired
	private PostsService postService;
	
	@Autowired
	private JwtUtil jwtUtil;
	
	@Autowired
	private MemberServiceInter memberService;
	
	
	@GetMapping("/list")
	public List<PostsDto> list()
	{
		return postService.getAllPostData();
	}
	
	
	
	@PostMapping("/upload")
	public String fileUpload(@RequestParam("uploadFile") MultipartFile uploadFile,HttpSession session) 
	{
		
		return null;
	}
	
	@PostMapping("/insert")
	public void insertPostWithPhoto(@ModelAttribute PostsDto pdto,
			@ModelAttribute CarDto cdto,
			@ModelAttribute RealEstateDto rdto,
			@ModelAttribute ItemDto idto,
			@RequestParam("uploadFiles") List<MultipartFile> uploadFiles,
			@RequestHeader(value = "Authorization", required = false) String authorization,
		    HttpSession session)
	{
		// JWT 토큰에서 사용자 정보 추출
		if (authorization != null && authorization.startsWith("Bearer ")) {
			String token = authorization.substring(7);
			try {
				String loginId = jwtUtil.extractUsername(token);
				MemberDto member = memberService.getMemberByLoginId(loginId);
				pdto.setMemberId((long) member.getMemberId());
				System.out.println("로그인한 사용자 ID: " + member.getMemberId());
			} catch (Exception e) {
				System.out.println("JWT 토큰 처리 중 오류: " + e.getMessage());
				// 토큰이 유효하지 않으면 기본값 설정 (테스트용)
				pdto.setMemberId(1L); // 임시로 1번 사용자로 설정
			}
		} else {
			// Authorization 헤더가 없으면 기본값 설정 (테스트용)
			pdto.setMemberId(1L); // 임시로 1번 사용자로 설정
			System.out.println("Authorization 헤더가 없어서 기본 사용자 ID 설정: " + pdto.getMemberId());
		}
		
		postService.insertPostWithPhoto(pdto, uploadFiles, session, cdto, rdto, idto);
	}

}
