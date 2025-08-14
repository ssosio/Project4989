package boot.sagu.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
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
import boot.sagu.service.CarService;
import boot.sagu.service.EstateService;
import boot.sagu.service.ItemService;
import boot.sagu.service.MemberServiceInter;
import boot.sagu.service.PostsService;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/post")
public class PostsController {
	
	@Autowired
	private PostsService postService;
	
	@Autowired
	private JwtUtil jwtUtil;
	
	@Autowired
	private MemberServiceInter memberService;
	
	@Autowired
	CarService carService;
	
	@Autowired
	EstateService estateService;
	
	@Autowired
	ItemService itemService;
	
//	@GetMapping("/list")
//	public List<PostsDto> list()
//	{
//		return postService.getAllPostData();
//	}
	
	@GetMapping("/list")
	public List<Map<String, Object>> list() {
	    return postService.getPostListWithNick();
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
			@RequestParam(value = "uploadFiles", required = false) List<MultipartFile> uploadFiles,
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
	
	@GetMapping("/detail")
	public Map<String, Object> getPostDetail(@RequestParam("postId") Long postId) {
	    return postService.getPostData(postId);
	}
	
	
	@PostMapping("/viewcount")
	public void increaseViewCount(@RequestParam("postId") Long postId)
	{
		postService.increaseViewCount(postId);
	}

	
	@GetMapping("/count")
	 public Map<String, Object> count(@RequestParam("postId") int postId) {
        int count = postService.countFavorite(postId);
        return Map.of("count", count);
    }
	
	/*
	//	count + 내가 찜했는지
    @GetMapping("/status")
    public Map<String, Object> status(@RequestParam("postId") int postId,
                                      @AuthenticationPrincipal JwtUtil jwt) {
        // Jwt에 memberId 클레임이 있다고 가정 (문자/숫자 어떤 타입이어도 toString 후 파싱)
        int memberId = Integer.parseInt(String.valueOf(jwt.extractMemberId("memberId")));
        boolean favorited = postService.isFavorited(postId, memberId);
        int count = postService.countFavorite(postId);
        return Map.of("favorited", favorited, "count", count);
    }
    
    @PostMapping("/toggle")
    public Map<String, Object> toggle(@RequestParam("postId") int postId,
                                      @AuthenticationPrincipal JwtUtil jwt) {
        int memberId = Integer.parseInt(String.valueOf(jwt.extractMemberId("memberId")));
        boolean favoritedNow = postService.toggleFavorite(postId, memberId); // 토글 후 상태
        int count = postService.countFavorite(postId);
        return Map.of("favorited", favoritedNow, "count", count);
    }
	*/

}
