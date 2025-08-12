package boot.sagu.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import boot.sagu.dto.AuctionDto;
import boot.sagu.dto.FavoritesDto;
import boot.sagu.dto.MemberDto;
import boot.sagu.dto.PostsDto;
import boot.sagu.service.AuctionServiceInter;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5176", "http://localhost:5177"})
public class AuctionController {
	
	@Autowired
	private AuctionServiceInter auctionService;

	@Autowired
	private SimpMessagingTemplate messagingTemplate;

	// 방 인원수 관리는 WebSocketController에서 처리됨

	@GetMapping("/auction")
	public List<PostsDto> getAuctionList() {
	   return auctionService.getAuctionPosts();
	}

	@GetMapping("/auction/detail/{postId}")
	public PostsDto getAuctionDetail(@PathVariable("postId") long postId) {
	   return auctionService.getAuctionDetail(postId);
	}

	@GetMapping("/auction/highest-bid/{postId}")
	public AuctionDto getHighestBid(@PathVariable("postId") long postId) {
	   return auctionService.getHighestBid(postId);
	}

	@GetMapping("/auction/member/{memberId}")
	public MemberDto getMemberNickname(@PathVariable("memberId") long memberId) {
	   return auctionService.getMemberNickname(memberId);
	}

	// 찜 상태 확인
	@GetMapping("/auction/favorite/check/{postId}/{memberId}")
	public Map<String, Object> checkFavoriteStatus(@PathVariable("postId") long postId, @PathVariable("memberId") long memberId) {
	   Map<String, Object> response = new HashMap<>();
	   try {
	       boolean isFavorite = auctionService.checkFavoriteStatus(postId, memberId);
	       response.put("isFavorite", isFavorite);
	       response.put("success", true);
	   } catch (Exception e) {
	       response.put("success", false);
	       response.put("message", "찜 상태 확인 실패: " + e.getMessage());
	   }
	   return response;
	}

	// 찜 추가/삭제 토글
	@PostMapping("/auction/favorite/toggle")
	public Map<String, Object> toggleFavorite(@RequestBody FavoritesDto favoritesDto) {
	   return auctionService.toggleFavorite(favoritesDto);
	}

	// 찜 개수 조회
	@GetMapping("/auction/favorite/count/{postId}")
	public Map<String, Object> getFavoriteCount(@PathVariable("postId") long postId) {
	   Map<String, Object> response = new HashMap<>();
	   try {
	       int favoriteCount = auctionService.getFavoriteCount(postId);
	       response.put("success", true);
	       response.put("favoriteCount", favoriteCount);
	   } catch (Exception e) {
	       response.put("success", false);
	       response.put("message", "찜 개수 조회 실패: " + e.getMessage());
	   }
	   return response;
	}

	@PostMapping("/auction/bid")
	public String placeBid(@RequestBody AuctionDto auctionDto) {
	   return auctionService.placeBid(auctionDto);
	}

	// 수동 경매 종료 API
	@PostMapping("/auction/end/{postId}")
	public String endAuction(@PathVariable("postId") long postId) {
	   return auctionService.endAuction(postId);
	}

	// 방 입장/퇴장은 WebSocket으로 처리됨 (REST API 제거)
	
	@GetMapping("/auction/photos/{postId}")
	public List<Map<String, Object>> getAuctionPhotos(@PathVariable("postId") long postId) {
		
		return auctionService.getAuctionPhotos(postId);
	}
	
	// 경매 이미지 파일 직접 제공
	    @GetMapping("/auction/image/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable("filename") String filename) {
		try {
			// 파일 경로에서 이미지 파일 읽기
			Path filePath = Paths.get("src/main/webapp/save/" + filename);
			
			// 파일이 존재하는지 확인
			if (!Files.exists(filePath)) {
				return ResponseEntity.notFound().build();
			}
			
			Resource resource = new FileSystemResource(filePath.toFile());
			
			// 파일 확장자에 따른 Content-Type 설정
			String contentType = getContentType(filename);
			
			return ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(contentType))
				.body(resource);
				
		} catch (Exception e) {
			return ResponseEntity.internalServerError().build();
		}
	}
	
	// 파일 확장자에 따른 Content-Type 반환
	private String getContentType(String filename) {
		if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
			return "image/jpeg";
		} else if (filename.toLowerCase().endsWith(".png")) {
			return "image/png";
		} else if (filename.toLowerCase().endsWith(".gif")) {
			return "image/gif";
		} else {
			return "application/octet-stream";
		}
	}

}
