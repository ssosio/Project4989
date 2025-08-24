package boot.sagu.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Timestamp;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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

import com.fasterxml.jackson.databind.ObjectMapper;

import boot.sagu.config.JwtUtil;
import boot.sagu.dto.AuctionDto;
import boot.sagu.dto.FavoritesDto;
import boot.sagu.dto.MemberDto;
import boot.sagu.dto.PortOneConfirmRequest;
import boot.sagu.dto.PostsDto;
import boot.sagu.service.AuctionService;
import boot.sagu.service.EscrowService;
import boot.sagu.service.PortOneService;

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
	
	// 클래스 필드에 추가
	@Autowired
	private EscrowService escrowService;
	
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


	// 입찰 시도 (교체본)
	@PostMapping("/auction/{postId}/bids")
	public ResponseEntity<?> placeBid(
	    @PathVariable("postId") long postId,
	    @RequestBody AuctionDto body,
	    @RequestHeader(value = "Authorization", required = false) String token
	) {
	    // 1) 바디 검증
	    if (body == null || body.getBidAmount() == null || body.getBidAmount().signum() <= 0) {
	        return ResponseEntity.badRequest().body(Map.of(
	            "status","ERROR","message","입찰 금액이 유효하지 않습니다."
	        ));
	    }
	    body.setPostId(postId);

	    // 2) 토큰 필수 + memberId는 토큰에서만
	    if (token == null || !token.startsWith("Bearer ")) {
	        return ResponseEntity.status(401).body(Map.of(
	            "status","ERROR","message","로그인이 필요합니다."
	        ));
	    }
	    long memberId;
	    try {
	        String jwt = token.substring(7);
	        // 프로젝트 내 다른 API처럼 memberId를 직접 추출해 일원화
	        memberId = jwtUtil.extractMemberId(jwt);
	        // 만약 extractMemberId가 없다면:
	        // String loginId = jwtUtil.extractUsername(jwt);
	        // memberId = memberService.findIdByLoginId(loginId); // 실제 매핑으로 대체
	    } catch (Exception e) {
	        return ResponseEntity.status(401).body(Map.of(
	            "status","ERROR","message","유효하지 않은 토큰입니다."
	        ));
	    }
	    body.setBidderId(memberId); // 클라에서 온 bidderId는 무시

	    // 3) 서버에서 입찰 시각 세팅
	    body.setBidTime(new java.sql.Timestamp(System.currentTimeMillis()));

	    // 4) 비즈니스 로직
	    try {
	        String res = auctionService.placeBidWithGuarantee(body);

	        if (res != null && res.startsWith("[NEED_GUARANTEE]")) {
	            int startPrice = auctionService.getStartPrice(postId);
	            int guaranteeAmount = Math.max(1, (int)Math.round(startPrice * 0.1));
	            String merchantUid = "guarantee_" + postId + "_" + memberId;

	            portOneService.ensurePreparedForAuction(merchantUid, guaranteeAmount, "경매 보증금");

	            return ResponseEntity.status(402).body(Map.of(
	                "status","NEED_GUARANTEE",
	                "guaranteeAmount", guaranteeAmount,
	                "merchantUid", merchantUid,
	                "message","보증금 결제가 필요합니다. 결제를 진행해주세요."
	            ));
	        }

	        return ResponseEntity.ok(Map.of(
	            "status","OK",
	            "message", (res == null || res.isBlank()) ? "입찰이 완료되었습니다." : res
	        ));
	    } catch (IllegalArgumentException iae) {
	        return ResponseEntity.badRequest().body(Map.of("status","ERROR","message", iae.getMessage()));
	    } catch (Exception e) {
	        return ResponseEntity.badRequest().body(Map.of(
	            "status","ERROR",
	            "message","입찰 처리 중 오류: " + e.getClass().getSimpleName() + " - " + (e.getMessage()==null?"":e.getMessage())
	        ));
	    }
	}

    
    //수동 종료(운영/관리자용)
    @PostMapping("/auction/{postId}/end")
    public ResponseEntity<?> end(@PathVariable long postId) {
        String msg = auctionService.endAuction(postId);
        return ResponseEntity.ok(Map.of("message", msg));
    }
    
    //낙찰 거래 최종처리(정상완료 환불 or 노쇼 몰수)
    @PostMapping("/auction/{postId}/winner/{winnerId}/finalize")
    public ResponseEntity<?> finalizeWinner(
            @PathVariable long postId,
            @PathVariable long winnerId,
            @RequestParam String action // "REFUND" or "FORFEIT"
    ) {
        auctionService.finalizeWinnerGuarantee(postId, winnerId, action);
        return ResponseEntity.ok(Map.of("status", "OK"));
    }
    
 // 컨트롤러: /api/auctions/portone/confirm
    @PostMapping(value = "/api/auctions/portone/confirm", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> confirmPayment(
            @RequestBody Map<String, Object> body,                 // ← Map으로 받아 camel/snake 모두 대응
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        try {
            // 1) JWT 필수 + 여기서 memberId를 신뢰
            if (authorization == null || !authorization.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("status","ERROR","message","로그인이 필요합니다."));
            }
            String jwt = authorization.substring(7);
            Integer mid = jwtUtil.extractMemberId(jwt);            // JwtUtil의 extractMemberId(Integer 반환)
            if (mid == null || mid <= 0) {
                return ResponseEntity.status(401).body(Map.of("status","ERROR","message","유효하지 않은 토큰입니다."));
            }
            long memberId = mid.longValue();

            // 2) camel/snake 모두 허용
            Long postId      = toLong(body.get("postId"), body.get("post_id"));
            String impUid     = toStr(body.get("impUid"), body.get("imp_uid"));
            String merchantUid= toStr(body.get("merchantUid"), body.get("merchant_uid"));

            if (postId == null || merchantUid == null) {
                return ResponseEntity.badRequest().body(Map.of("status","ERROR","message","postId 또는 merchantUid가 없습니다."));
            }

            // 3) 멱등성: 이미 저장된 imp_uid면 OK
            if (impUid != null && auctionService.existsGuaranteeByImpUid(impUid) > 0) {
                return ResponseEntity.ok(Map.of("status","OK","message","already confirmed"));
            }

            // 4) 서버 검증 + DB 저장 (금액/merchant_uid 검증 포함)
            auctionService.handlePortOneWebhook(postId, memberId, impUid, merchantUid);

            return ResponseEntity.ok(Map.of("status","OK"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "status","ERROR",
                "message","결제 검증 실패: " + (e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage())
            ));
        }
    }

    // 작은 유틸(컨트롤러 클래스 안에 private static으로 추가)
    private static Long toLong(Object... vals) {
        for (Object v : vals) {
            if (v == null) continue;
            if (v instanceof Number) return ((Number) v).longValue();
            try { return Long.parseLong(String.valueOf(v)); } catch (Exception ignored) {}
        }
        return null;
    }
    private static String toStr(Object... vals) {
        for (Object v : vals) if (v != null) return String.valueOf(v);
        return null;
    }

    
    //webhook처리
    @PostMapping(
      value = "/api/auctions/portone/webhook",
      consumes = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE }
    )
    public ResponseEntity<String> portoneWebhook(@RequestBody(required = false) Map<String, Object> body) {
      try {
        String impUid      = body == null ? null : String.valueOf(body.get("imp_uid"));
        String merchantUid = body == null ? null : String.valueOf(body.get("merchant_uid"));
        String status      = body == null ? null : String.valueOf(body.get("status"));	
        String customData  = body == null ? null : String.valueOf(body.get("custom_data"));

        // merchant_uid: guarantee_{postId}_{memberId} or escrow_{postId}_{memberId}
        Long postId = null, memberId = null;
        if (merchantUid != null && merchantUid.matches("^(guarantee|escrow)_\\d+_\\d+$")) {
          String[] t = merchantUid.split("_");
          postId = Long.valueOf(t[1]);
          memberId = Long.valueOf(t[2]);
        }
        
     // 컨트롤러 portoneWebhook(...) 내부 — merchantUid 파싱 직후 분기
        if (merchantUid != null && merchantUid.startsWith("escrow_")) {
            // postId/memberId 파싱 동일
            if (postId == null || memberId == null) {
                Matcher m = Pattern.compile("^escrow_(\\d+)_(\\d+)(?:_\\d+)?$").matcher(merchantUid);
                if (m.matches()) {
                    postId = postId == null ? Long.parseLong(m.group(1)) : postId;
                    memberId = memberId == null ? Long.parseLong(m.group(2)) : memberId;
                }
            }
            escrowService.handleEscrowPaid(postId, memberId, impUid, merchantUid); // 구현 아래
            return ResponseEntity.ok("ok");
        }
        // custom_data 보조(JSON 문자열일 수 있음)
        if ((postId == null || memberId == null) && customData != null && !customData.isBlank()) {
          try {
            Map<?,?> cd = new ObjectMapper().readValue(customData, Map.class);
            if (postId == null && cd.get("postId") != null)   postId   = Long.valueOf(String.valueOf(cd.get("postId")));
            if (memberId == null && cd.get("memberId") != null) memberId = Long.valueOf(String.valueOf(cd.get("memberId")));
          } catch (Exception ignore) {}
        }

        // 서비스 호출은 널 안전하게 처리 (내부에서 검증/로그)
        auctionService.handlePortOneWebhook(postId, memberId, impUid, merchantUid);

        // 재시도 방지: 빨리 200
        return ResponseEntity.ok("ok");
      } catch (Exception e) {
        // 어떤 예외가 나도 200으로 응답해 포트원 재시도 루프 방지(내부 로그로 추적)
        return ResponseEntity.ok("ok");
      }
    }



	// 내 게시글 타입별 개수 조회 (위쪽 필터용)
	@GetMapping("/auction/my-posts-counts/{memberId}")
	public ResponseEntity<Map<String, Object>> getMyPostsCounts(
			@PathVariable("memberId") long memberId,
			@RequestHeader(value = "Authorization", required = false) String token
	) {
		try {
			// JWT token validation (self-check)
			if (token != null && token.startsWith("Bearer ")) {
				String jwtToken = token.substring(7);
				long tokenMemberId = jwtUtil.extractMemberId(jwtToken);
				if (tokenMemberId != memberId) {
					return ResponseEntity.status(403).build(); // Only self can view
				}
			}
			
			System.out.println("내 게시글 개수 조회 요청: memberId=" + memberId);
			
			Map<String, Object> counts = auctionService.getMyPostsCounts(memberId);
			
			System.out.println("내 게시글 개수 조회 성공: " + counts);
			return ResponseEntity.ok(counts);
		} catch (Exception e) {
			System.out.println("내 게시글 개수 조회 실패: " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity.status(500).build();
		}
	}

	// 내 게시글 조회 (마이페이지 거래내역용)
	@GetMapping("/auction/my-posts/{memberId}")
	public ResponseEntity<List<Map<String, Object>>> getMyPosts(
			@PathVariable("memberId") long memberId,
			@RequestParam(value = "type", required = false) String type, // all, auction, general, giveaway
			@RequestParam(value = "status", required = false) String status, // all, active, reserved, completed, bidding, cancelled
			@RequestHeader(value = "Authorization", required = false) String token
	) {
		try {
			// JWT token validation (self-check)
			if (token != null && token.startsWith("Bearer ")) {
				String jwtToken = token.substring(7);
				long tokenMemberId = jwtUtil.extractMemberId(jwtToken);
				if (tokenMemberId != memberId) {
					return ResponseEntity.status(403).build(); // Only self can view
				}
			}
			
			System.out.println("내 게시글 조회 요청: memberId=" + memberId + ", type=" + type + ", status=" + status);
			
			List<Map<String, Object>> myPosts = auctionService.getMyPosts(memberId, type, status);
			
			System.out.println("내 게시글 조회 성공: " + myPosts.size() + "개 게시글");
			return ResponseEntity.ok(myPosts);
		} catch (Exception e) {
			System.out.println("내 게시글 조회 실패: " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity.status(500).build();
		}
	}

	// 경매 게시글만 조회
	@GetMapping("/auction/my-auction-posts/{memberId}")
	public ResponseEntity<List<Map<String, Object>>> getMyAuctionPosts(
			@PathVariable("memberId") long memberId,
			@RequestParam(value = "status", required = false) String status,
			@RequestHeader(value = "Authorization", required = false) String token
	) {
		try {
			// JWT token validation (self-check)
			if (token != null && token.startsWith("Bearer ")) {
				String jwtToken = token.substring(7);
				long tokenMemberId = jwtUtil.extractMemberId(jwtToken);
				if (tokenMemberId != memberId) {
					return ResponseEntity.status(403).build();
				}
			}
			
			System.out.println("내 경매 게시글 조회 요청: memberId=" + memberId + ", status=" + status);
			
			List<Map<String, Object>> auctionPosts = auctionService.getMyAuctionPosts(memberId, status);
			
			System.out.println("내 경매 게시글 조회 성공: " + auctionPosts.size() + "개 게시글");
			return ResponseEntity.ok(auctionPosts);
		} catch (Exception e) {
			System.out.println("내 경매 게시글 조회 실패: " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity.status(500).build();
		}
	}

	// 일반거래 게시글만 조회
	@GetMapping("/auction/my-general-posts/{memberId}")
	public ResponseEntity<List<Map<String, Object>>> getMyGeneralPosts(
			@PathVariable("memberId") long memberId,
			@RequestParam(value = "status", required = false) String status,
			@RequestHeader(value = "Authorization", required = false) String token
	) {
		try {
			// JWT token validation (self-check)
			if (token != null && token.startsWith("Bearer ")) {
				String jwtToken = token.substring(7);
				long tokenMemberId = jwtUtil.extractMemberId(jwtToken);
				if (tokenMemberId != memberId) {
					return ResponseEntity.status(403).build();
				}
			}
			
			System.out.println("내 일반거래 게시글 조회 요청: memberId=" + memberId + ", status=" + status);
			
			List<Map<String, Object>> generalPosts = auctionService.getMyGeneralPosts(memberId, status);
			
			System.out.println("내 일반거래 게시글 조회 성공: " + generalPosts.size() + "개 게시글");
			return ResponseEntity.ok(generalPosts);
		} catch (Exception e) {
			System.out.println("내 일반거래 게시글 조회 실패: " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity.status(500).build();
		}
	}

	// 나눔 게시글만 조회
	@GetMapping("/auction/my-giveaway-posts/{memberId}")
	public ResponseEntity<List<Map<String, Object>>> getMyGiveawayPosts(
			@PathVariable("memberId") long memberId,
			@RequestParam(value = "status", required = false) String status,
			@RequestHeader(value = "Authorization", required = false) String token
	) {
		try {
			// JWT token validation (self-check)
			if (token != null && token.startsWith("Bearer ")) {
				String jwtToken = token.substring(7);
				long tokenMemberId = jwtUtil.extractMemberId(jwtToken);
				if (tokenMemberId != memberId) {
					return ResponseEntity.status(403).build();
				}
			}
			
			System.out.println("내 나눔 게시글 조회 요청: memberId=" + memberId + ", status=" + status);
			
			List<Map<String, Object>> giveawayPosts = auctionService.getMyGiveawayPosts(memberId, status);
			
			System.out.println("내 나눔 게시글 조회 성공: " + giveawayPosts.size() + "개 게시글");
			return ResponseEntity.ok(giveawayPosts);
		} catch (Exception e) {
			System.out.println("내 나눔 게시글 조회 실패: " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity.status(500).build();
		}
	}

	// 유찰 게시글만 조회 (경매에서만 발생)
	@GetMapping("/auction/my-cancelled-auction-posts/{memberId}")
	public ResponseEntity<List<Map<String, Object>>> getMyCancelledAuctionPosts(
			@PathVariable("memberId") long memberId,
			@RequestHeader(value = "Authorization", required = false) String token
	) {
		try {
			// JWT token validation (self-check)
			if (token != null && token.startsWith("Bearer ")) {
				String jwtToken = token.substring(7);
				long tokenMemberId = jwtUtil.extractMemberId(jwtToken);
				if (tokenMemberId != memberId) {
					return ResponseEntity.status(403).build();
				}
			}
			
			System.out.println("내 유찰 게시글 조회 요청: memberId=" + memberId);
			
			List<Map<String, Object>> cancelledPosts = auctionService.getMyCancelledAuctionPosts(memberId);
			
			System.out.println("내 유찰 게시글 조회 성공: " + cancelledPosts.size() + "개 게시글");
			return ResponseEntity.ok(cancelledPosts);
		} catch (Exception e) {
			System.out.println("내 유찰 게시글 조회 실패: " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity.status(500).build();
		}
	}
}
