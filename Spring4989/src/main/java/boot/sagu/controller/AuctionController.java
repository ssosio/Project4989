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
import boot.sagu.dto.MemberDto;
import boot.sagu.dto.PostsDto;
import boot.sagu.mapper.AuctionMapper;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5176", "http://localhost:5177"})
public class AuctionController {
@Autowired
AuctionMapper auctionmapper;

@Autowired
private SimpMessagingTemplate messagingTemplate;

@GetMapping("/auction")
public List<PostsDto> getAuctionList() {
   return auctionmapper.getAuctionPosts();
}

@GetMapping("/auction/detail/{postId}")
public PostsDto getAuctionDetail(@PathVariable("postId") long postId) {
   PostsDto result = auctionmapper.getAuctionDetail(postId);
   if (result == null) {
       throw new RuntimeException("경매글을 찾을 수 없습니다: " + postId);
   }
   return result;
}

@GetMapping("/auction/highest-bid/{postId}")
public AuctionDto getHighestBid(@PathVariable("postId") long postId) {
   return auctionmapper.getHighestBid(postId);
}

@GetMapping("/auction/member/{memberId}")
public MemberDto getMemberNickname(@PathVariable("memberId") long memberId) {
   return auctionmapper.getMemberNickname(memberId);
}

@PostMapping("/auction/bid")
public String placeBid(@RequestBody AuctionDto auctionDto) {
   try {
       // 현재 최고가 조회
       AuctionDto currentHighestBid = auctionmapper.getHighestBid(auctionDto.getPostId());
       
       // 최고가가 있고, 입찰 금액이 최고가보다 낮거나 같은 경우
       if (currentHighestBid != null && currentHighestBid.getBidAmount() != null) {
           if (auctionDto.getBidAmount().compareTo(currentHighestBid.getBidAmount()) <= 0) {
               return "입찰가가 최고가보다 낮습니다.";
           }
       }
       
       auctionmapper.insertBid(auctionDto);
       
       // 소켓으로 실시간 입찰 정보 전송
       try {
           // 새로운 최고가 정보 조회
           AuctionDto newHighestBid = auctionmapper.getHighestBid(auctionDto.getPostId());
           
           // 입찰자 정보 조회
           MemberDto bidder = auctionmapper.getMemberNickname(auctionDto.getBidderId());
           
           // 소켓 메시지 생성
           Map<String, Object> socketMessage = new HashMap<>();
           socketMessage.put("type", "BID_UPDATE");
           socketMessage.put("bid", newHighestBid);
           
           // 입찰자 정보 추가
           Map<String, Object> bidderInfo = new HashMap<>();
           if (bidder != null) {
               bidderInfo.put("id", bidder.getMemberId());
               bidderInfo.put("nickname", bidder.getNickname());
           } else {
               bidderInfo.put("id", auctionDto.getBidderId());
               bidderInfo.put("nickname", "ID: " + auctionDto.getBidderId());
           }
           socketMessage.put("bidder", bidderInfo);
           
           // 소켓 메시지 전송
           messagingTemplate.convertAndSend("/topic/auction/" + auctionDto.getPostId(), socketMessage);
           
           System.out.println("입찰 소켓 메시지 전송 완료: " + socketMessage);
       } catch (Exception socketError) {
           System.err.println("소켓 메시지 전송 실패: " + socketError.getMessage());
           // 소켓 에러가 있어도 입찰은 성공으로 처리
       }
       
       return "입찰이 성공적으로 등록되었습니다.";
   } catch (Exception e) {
       return "입찰 등록에 실패했습니다: " + e.getMessage();
   }
}

// 수동 경매 종료 API
@PostMapping("/auction/end/{postId}")
public String endAuction(@PathVariable("postId") long postId) {
   try {
       // 경매 정보 조회
       PostsDto auction = auctionmapper.getAuctionDetail(postId);
       if (auction == null) {
           return "경매글을 찾을 수 없습니다.";
       }
       
       // 이미 종료된 경매인지 확인
       if ("SOLD".equals(auction.getStatus())) {
           return "이미 종료된 경매입니다.";
       }
       
       // 최고 입찰자 조회
       AuctionDto highestBid = auctionmapper.getHighestBid(postId);
       
       if (highestBid != null) {
           // winner_id 업데이트
           auctionmapper.updateWinnerId(postId, highestBid.getBidderId());
           
           // 경매 상태를 SOLD로 변경하고 종료시간을 현재시간으로 업데이트
           auctionmapper.updateAuctionStatusAndEndTime(postId, "SOLD");
           
           // 소켓으로 경매 종료 알림
           try {
               // 낙찰자 정보 조회
               MemberDto winner = auctionmapper.getMemberNickname(highestBid.getBidderId());
               
               // 소켓 메시지 생성
               Map<String, Object> socketMessage = new HashMap<>();
               socketMessage.put("type", "AUCTION_END");
               socketMessage.put("winnerId", highestBid.getBidderId());
               
               // 낙찰자 정보 추가
               Map<String, Object> winnerInfo = new HashMap<>();
               if (winner != null) {
                   winnerInfo.put("id", winner.getMemberId());
                   winnerInfo.put("nickname", winner.getNickname());
               } else {
                   winnerInfo.put("id", highestBid.getBidderId());
                   winnerInfo.put("nickname", "ID: " + highestBid.getBidderId());
               }
               socketMessage.put("winner", winnerInfo);
               
               // 소켓 메시지 전송
               messagingTemplate.convertAndSend("/topic/auction/" + postId, socketMessage);
               
               System.out.println("경매 종료 소켓 메시지 전송 완료: " + socketMessage);
           } catch (Exception socketError) {
               System.err.println("소켓 메시지 전송 실패: " + socketError.getMessage());
           }
           
           return "경매가 성공적으로 종료되었습니다. 낙찰자: ID " + highestBid.getBidderId();
       } else {
           // 입찰자가 없는 경우 상태와 종료시간 변경
           auctionmapper.updateAuctionStatusAndEndTime(postId, "SOLD");
           
           // 소켓으로 경매 종료 알림 (낙찰자 없음)
           try {
               Map<String, Object> socketMessage = new HashMap<>();
               socketMessage.put("type", "AUCTION_END");
               socketMessage.put("winnerId", null);
               socketMessage.put("winner", null);
               
               messagingTemplate.convertAndSend("/topic/auction/" + postId, socketMessage);
               
               System.out.println("경매 종료 소켓 메시지 전송 완료 (낙찰자 없음): " + socketMessage);
           } catch (Exception socketError) {
               System.err.println("소켓 메시지 전송 실패: " + socketError.getMessage());
           }
           
           return "경매가 종료되었습니다. (입찰자 없음)";
       }
   } catch (Exception e) {
       return "경매 종료 처리에 실패했습니다: " + e.getMessage();
   }
}


	@PostMapping("/auction/bid")
	public respon
}
