package boot.sagu.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import boot.sagu.dto.AuctionDto;
import boot.sagu.dto.FavoritesDto;
import boot.sagu.dto.MemberDto;
import boot.sagu.dto.PostsDto;
import boot.sagu.service.AuctionService;
import boot.sagu.service.PortOneService;
import boot.sagu.config.JwtUtil;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5176", "http://localhost:5177"})
public class AuctionController {
	
	
	@Autowired
	private PortOneService portOneService;
	
	@Autowired
	private AuctionService auctionService;

	@Autowired
	private SimpMessagingTemplate messagingTemplate;
	
	@Autowired
	private JwtUtil jwtUtil;
	
	// 경매 방별 현재 접속 사용자 관리 (postId -> Set<sessionId>)
	private final Map<String, Set<String>> auctionRoomUsers = new ConcurrentHashMap<>();

	@GetMapping("/auction")
	public List<PostsDto> getAuctionList() {
	   return auctionService.getAuctionPosts();
	}

	@GetMapping("/auction/detail/{postId}")
	public PostsDto getAuctionDetail(@PathVariable("postId") long postId) {
	   // 조회수 증가
	   auctionService.incrementViewCount(postId);
	   return auctionService.getAuctionDetail(postId);
	}

	@GetMapping("/auction/highest-bid/{postId}")
	public AuctionDto getHighestBid(@PathVariable("postId") long postId) {
	   return auctionService.getHighestBid(postId);
	}
	
	// 입찰 기록 조회 (최근 5개)
	@GetMapping("/auction/bid-history/{postId}")
	public List<Map<String, Object>> getBidHistory(@PathVariable("postId") long postId) {
	   return auctionService.getBidHistory(postId);
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

	//수동 경매 종료 API
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

 	
 	//
	@PostMapping("/{postID}/bid")
	public ResponseEntity<?> placeBId(@PathVariable Long postId,
									@RequestParam Long memberId,
									@RequestParam int bidAmount){
		
		if(!auctionService.isGuaranteePaid(postId, memberId)) {
			int startPrice = auctionService.getStartPrice(postId);
			String paymentUrl = auctionService.createGuaranteePayment(postId, memberId, startPrice);
			
			return ResponseEntity.ok(Map.of(
					"paymentRequired",true,
					"paymentUrl",paymentUrl));
		}

		//이미 납부했으면 바로 입찰 처리
		
		return null;
	}
	
	// 경매 삭제 (비밀번호 확인 포함)
	@DeleteMapping("/auction/delete/{postId}")
	public ResponseEntity<?> deleteAuction(
		@PathVariable("postId") long postId,
		@RequestBody Map<String, String> request,
		@RequestHeader("Authorization") String token
	) {
		try {
			// JWT 토큰에서 사용자 정보 추출
			String loginId = jwtUtil.extractUsername(token.replace("Bearer ", ""));
			String password = request.get("password");
			
			// 경매 삭제 (비밀번호 확인 포함)
			auctionService.deleteAuction(postId, loginId, password);
			
			return ResponseEntity.ok().body(Map.of("message", "경매가 삭제되었습니다."));
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
		}
	}
	
	// 현재 방 인원수 조회
	@GetMapping("/auction/room/count/{postId}")
	public Map<String, Object> getRoomUserCount(@PathVariable("postId") String postId) {
		Map<String, Object> response = new HashMap<>();
		try {
			Set<String> users = auctionRoomUsers.getOrDefault(postId, new HashSet<>());
			response.put("success", true);
			response.put("userCount", users.size());
		} catch (Exception e) {
			response.put("success", false);
			response.put("userCount", 0);
			response.put("message", "방 인원수 조회 실패: " + e.getMessage());
		}
		return response;
	}
	
	// 방 입장 (세션 ID로 사용자 추가)
	@PostMapping("/auction/room/join/{postId}")
	public Map<String, Object> joinRoom(@PathVariable("postId") String postId, @RequestBody Map<String, String> request) {
		Map<String, Object> response = new HashMap<>();
		try {
			String sessionId = request.get("sessionId");
			if (sessionId == null || sessionId.trim().isEmpty()) {
				response.put("success", false);
				response.put("message", "세션 ID가 필요합니다.");
				return response;
			}
			
			// 방에 사용자 추가 (Set이므로 중복 자동 제거)
			Set<String> users = auctionRoomUsers.computeIfAbsent(postId, k -> ConcurrentHashMap.newKeySet());
			boolean wasAdded = users.add(sessionId);
			
			int userCount = users.size();
			response.put("success", true);
			response.put("userCount", userCount);
			response.put("isNewUser", wasAdded); // 새로운 사용자인지 여부
			response.put("message", wasAdded ? "방에 입장했습니다." : "이미 방에 접속 중입니다.");
		} catch (Exception e) {
			response.put("success", false);
			response.put("message", "방 입장 실패: " + e.getMessage());
		}
		return response;
	}
	
	// 방 퇴장 (세션 ID로 사용자 제거) - POST 방식
	@PostMapping("/auction/room/leave/{postId}")
	public Map<String, Object> leaveRoom(@PathVariable("postId") String postId, @RequestBody Map<String, String> request) {
		Map<String, Object> response = new HashMap<>();
		try {
			String sessionId = request.get("sessionId");
			if (sessionId == null || sessionId.trim().isEmpty()) {
				response.put("success", false);
				response.put("message", "세션 ID가 필요합니다.");
				return response;
			}
			
			// 방에서 사용자 제거
			Set<String> users = auctionRoomUsers.get(postId);
			if (users != null) {
				users.remove(sessionId);
				if (users.isEmpty()) {
					auctionRoomUsers.remove(postId); // 빈 방은 제거
				}
			}
			
			int userCount = users != null ? users.size() : 0;
			response.put("success", true);
			response.put("userCount", userCount);
			response.put("message", "방에서 퇴장했습니다.");
		} catch (Exception e) {
			response.put("success", false);
			response.put("message", "방 퇴장 실패: " + e.getMessage());
		}
		return response;
	}
	
	// 방 퇴장 (GET 방식) - sendBeacon용
	@GetMapping("/auction/room/leave/{postId}/{sessionId}")
	public Map<String, Object> leaveRoomGet(@PathVariable("postId") String postId, @PathVariable("sessionId") String sessionId) {
		Map<String, Object> response = new HashMap<>();
		try {
			// 방에서 사용자 제거
			Set<String> users = auctionRoomUsers.get(postId);
			if (users != null) {
				users.remove(sessionId);
				if (users.isEmpty()) {
					auctionRoomUsers.remove(postId); // 빈 방은 제거
				}
			}
			
			int userCount = users != null ? users.size() : 0;
			response.put("success", true);
			response.put("userCount", userCount);
			response.put("message", "방에서 퇴장했습니다.");
		} catch (Exception e) {
			response.put("success", false);
			response.put("message", "방 퇴장 실패: " + e.getMessage());
		}
		return response;
	}
	
	// 특정 세션이 방에 있는지 확인
	@GetMapping("/auction/room/check/{postId}/{sessionId}")
	public Map<String, Object> checkUserInRoom(@PathVariable("postId") String postId, @PathVariable("sessionId") String sessionId) {
		Map<String, Object> response = new HashMap<>();
		try {
			Set<String> users = auctionRoomUsers.getOrDefault(postId, new HashSet<>());
			boolean isInRoom = users.contains(sessionId);
			
			response.put("success", true);
			response.put("isInRoom", isInRoom);
			response.put("userCount", users.size());
		} catch (Exception e) {
			response.put("success", false);
			response.put("isInRoom", false);
			response.put("userCount", 0);
			response.put("message", "확인 실패: " + e.getMessage());
		}
		return response;
	}
}
