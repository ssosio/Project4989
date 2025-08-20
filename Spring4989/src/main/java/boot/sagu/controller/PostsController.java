package boot.sagu.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
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
import boot.sagu.dto.ReportsDto;
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
	
	@GetMapping("/cardetail")
	public CarDto getOneCarData(@RequestParam("postId") Long postId)
	{
		return carService.getOneCarData(postId);
	}
	
	@GetMapping("/itemdetail")
	public ItemDto getOneItemData(@RequestParam("postId") Long postId)
	{
		return itemService.getOneItemData(postId);
	}
	
	@GetMapping("/estatedetail")
	public RealEstateDto getOneEstateData(@RequestParam("postId") Long postId)
	{
		return estateService.getOneEstateData(postId);
	}
	
	@PostMapping("/viewcount")
	public void increaseViewCount(@RequestParam("postId") Long postId)
	{
		postService.increaseViewCount(postId);
	}

	
	@GetMapping("/count")
	 public Map<String, Object> count(@RequestParam("postId") Long postId) {
        int count = postService.countFavorite(postId);
        return Map.of("count", count);
    }
	
	@GetMapping("/checkfav")
	public Map<String, Boolean> isFavorited(@RequestParam("postId") Long postId,
			@RequestHeader("Authorization") String authorization)
	{
		String token = authorization.substring(7);
		long memberId=jwtUtil.extractMemberId(token);
		boolean favorited=postService.isFavorited(postId, (long)memberId);
		return Map.of("favorited",favorited);
	}
	
	@PostMapping("/toggle")
	public Map<String, Object> toggleFavorite(@RequestParam("postId") Long postId,
			@RequestHeader("Authorization") String authorization)
	{
		String token=authorization.substring(7);
		long memberId=jwtUtil.extractMemberId(token);
		boolean nowFavorited=postService.toggleFavorite(postId, (long)memberId);
		int count=postService.countFavorite(postId);
		return Map.of("favorited",nowFavorited,"count",count);
	}
	
	
	@PostMapping(value = "/update")
    public ResponseEntity<Void> updatePost(
            @ModelAttribute PostsDto post,                     // postId 필수
            @ModelAttribute CarDto car,
            @ModelAttribute RealEstateDto realEstate,
            @ModelAttribute ItemDto item,
            @RequestParam(value = "uploadFiles", required = false) List<MultipartFile> uploadFiles,
            @RequestParam(value = "deletePhotoIds", required = false) List<Long> deletePhotoIds,
            @RequestParam(value = "mainPhotoId", required = false) Long mainPhotoId,
            @RequestHeader("Authorization") String authorization,
            HttpSession session
    ) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        long actorId = jwtUtil.extractMemberId(authorization.substring(7));

        postService.updatePostAll(post, car, realEstate, item,
                                  uploadFiles, deletePhotoIds, mainPhotoId,
                                  session, actorId);
        return ResponseEntity.ok().build();
    }
	
	@DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable("postId") Long postId,
                                           @RequestHeader("Authorization") String authorization,
                                           @ModelAttribute PostsDto dto) {
        // JWT 검증 로직 넣을 수 있음 (작성자 본인인지 확인)
		long actorId=jwtUtil.extractMemberId(authorization.substring(7));
        postService.deletePost(postId, dto, actorId);
        return ResponseEntity.ok().build();
    }
	
	//신고
	@PostMapping("report")
	public ResponseEntity<?> insertReport(@ModelAttribute ReportsDto dto,
            @RequestHeader("Authorization") String authorization) 
	{
		long memberId = jwtUtil.extractMemberId(authorization.substring(7));
	    dto.setReporterId(memberId);

	    if ("POST".equals(dto.getTargetType())) {
	        // post FK 체크 후 저장
	    } else if ("MEMBER".equals(dto.getTargetType())) {
	        // member FK 체크 후 저장
	    } else {
	        return ResponseEntity.badRequest().build();
	    }

	    postService.insertReport(dto);
	    return ResponseEntity.ok().build();
	}
	
	//검색
	 @GetMapping("/search")
	    public Map<String, Object> search(
	        @RequestParam String keyword,
	        @RequestParam(defaultValue = "ALL") String postType, // ALL/CARS/ESTATE/ITEMS
	        @RequestParam(defaultValue = "1") int page,
	        @RequestParam(defaultValue = "10") int size
	    ) {
	        List<PostsDto> rows = postService.searchAll(keyword, postType, page, size);
	        int total = postService.countSearchAll(keyword, postType);

	        Map<String, Object> resp = new HashMap<>();
	        resp.put("rows", rows);
	        resp.put("total", total);
	        resp.put("page", page);
	        resp.put("size", size);
	        return resp;
	    }
	
}
