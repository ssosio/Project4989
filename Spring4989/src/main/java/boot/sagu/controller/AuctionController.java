package boot.sagu.controller;

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

}
