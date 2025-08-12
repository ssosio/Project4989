package boot.sagu.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import boot.sagu.dto.AuctionDto;
import boot.sagu.dto.FavoritesDto;
import boot.sagu.dto.MemberDto;
import boot.sagu.dto.PostsDto;
import boot.sagu.mapper.AuctionMapper;

@Service
public class AuctionService implements AuctionServiceInter {
	
	@Autowired
	private AuctionMapper auctionMapper;
	
	@Autowired
	private SimpMessagingTemplate messagingTemplate;
	
	@Override
	public List<PostsDto> getAuctionPosts() {
		return auctionMapper.getAuctionPosts();
	}
	
	@Override
	public PostsDto getAuctionDetail(long postId) {
		PostsDto result = auctionMapper.getAuctionDetail(postId);
		if (result == null) {
			throw new RuntimeException("경매글을 찾을 수 없습니다: " + postId);
		}
		return result;
	}
	
	@Override
	public AuctionDto getHighestBid(long postId) {
		return auctionMapper.getHighestBid(postId);
	}
	
	@Override
	public MemberDto getMemberNickname(long memberId) {
		return auctionMapper.getMemberNickname(memberId);
	}
	
	@Override
	public boolean checkFavoriteStatus(long postId, long memberId) {
		return auctionMapper.checkFavoriteStatus(postId, memberId);
	}
	
	@Override
	public Map<String, Object> toggleFavorite(FavoritesDto favoritesDto) {
		Map<String, Object> response = new HashMap<>();
		try {
			// 현재 찜 상태 확인
			boolean isFavorite = auctionMapper.checkFavoriteStatus(favoritesDto.getPostId(), favoritesDto.getMemberId());
			
			if (isFavorite) {
				// 찜 삭제
				auctionMapper.deleteFavorite(favoritesDto.getPostId(), favoritesDto.getMemberId());
				response.put("action", "removed");
				response.put("message", "찜이 삭제되었습니다.");
			} else {
				// 찜 추가
				auctionMapper.insertFavorite(favoritesDto);
				response.put("action", "added");
				response.put("message", "찜에 추가되었습니다.");
			}
			
			response.put("success", true);
			response.put("isFavorite", !isFavorite);
		} catch (Exception e) {
			response.put("success", false);
			response.put("message", "찜 처리 실패: " + e.getMessage());
		}
		return response;
	}
	
	@Override
	public int getFavoriteCount(long postId) {
		return auctionMapper.getFavoriteCount(postId);
	}
	
	@Override
	public String placeBid(AuctionDto auctionDto) {
		try {
			// 현재 최고가 조회
			AuctionDto currentHighestBid = auctionMapper.getHighestBid(auctionDto.getPostId());
			
			// 최고가가 있고, 입찰 금액이 최고가보다 낮거나 같은 경우
			if (currentHighestBid != null && currentHighestBid.getBidAmount() != null) {
				if (auctionDto.getBidAmount().compareTo(currentHighestBid.getBidAmount()) <= 0) {
					return "입찰가가 최고가보다 낮습니다.";
				}
			}
			
			auctionMapper.insertBid(auctionDto);
			
			// 소켓으로 실시간 입찰 정보 전송
			try {
				// 새로운 최고가 정보 조회
				AuctionDto newHighestBid = auctionMapper.getHighestBid(auctionDto.getPostId());
				
				// 입찰자 정보 조회
				MemberDto bidder = auctionMapper.getMemberNickname(auctionDto.getBidderId());
				
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
	
	@Override
	public String endAuction(long postId) {
		try {
			// 경매 정보 조회
			PostsDto auction = auctionMapper.getAuctionDetail(postId);
			if (auction == null) {
				return "경매글을 찾을 수 없습니다.";
			}
			
			// 이미 종료된 경매인지 확인
			if ("SOLD".equals(auction.getStatus())) {
				return "이미 종료된 경매입니다.";
			}
			
			// 최고 입찰자 조회
			AuctionDto highestBid = auctionMapper.getHighestBid(postId);
			
			if (highestBid != null) {
				// winner_id 업데이트
				auctionMapper.updateWinnerId(postId, highestBid.getBidderId());
				
				// 경매 상태를 SOLD로 변경하고 종료시간을 현재시간으로 업데이트
				auctionMapper.updateAuctionStatusAndEndTime(postId, "SOLD");
				
				// 소켓으로 경매 종료 알림
				try {
					// 낙찰자 정보 조회
					MemberDto winner = auctionMapper.getMemberNickname(highestBid.getBidderId());
					
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
				auctionMapper.updateAuctionStatusAndEndTime(postId, "SOLD");
				
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
	
	// 매 1분마다 실행 (경매 종료 체크)
	@Scheduled(fixedRate = 60000)
	@Override
	public void checkAndEndAuctions() {
		try {
			// 종료된 경매 목록 조회
			List<PostsDto> endedAuctions = auctionMapper.getEndedAuctions();
			
			for (PostsDto auction : endedAuctions) {
				// 최고 입찰자 조회
				AuctionDto highestBid = auctionMapper.getHighestBid(auction.getPostId());
				
				if (highestBid != null) {
					// winner_id 업데이트
					auctionMapper.updateWinnerId(auction.getPostId(), highestBid.getBidderId());
					
					// 경매 상태를 SOLD로 변경
					auctionMapper.updateAuctionStatus(auction.getPostId(), "SOLD");
					
					// 소켓으로 경매 종료 알림 (낙찰자 있음)
					sendAuctionEndMessage(auction.getPostId(), highestBid.getBidderId());
					
					System.out.println("경매 종료 처리 완료: PostId=" + auction.getPostId() + 
									", WinnerId=" + highestBid.getBidderId());
				} else {
					// 입찰자가 없는 경우 상태만 변경
					auctionMapper.updateAuctionStatus(auction.getPostId(), "SOLD");
					
					// 소켓으로 경매 종료 알림 (낙찰자 없음)
					sendAuctionEndMessage(auction.getPostId(), null);
					
					System.out.println("경매 종료 처리 완료 (입찰자 없음): PostId=" + auction.getPostId());
				}
			}
		} catch (Exception e) {
			System.err.println("경매 종료 처리 중 오류 발생: " + e.getMessage());
		}
	}
	
	// 경매 종료 소켓 메시지 전송
	private void sendAuctionEndMessage(long postId, Long winnerId) {
		try {
			Map<String, Object> socketMessage = new HashMap<>();
			socketMessage.put("type", "AUCTION_END");
			socketMessage.put("winnerId", winnerId);
			
			if (winnerId != null) {
				// 낙찰자 정보 조회
				MemberDto winner = auctionMapper.getMemberNickname(winnerId);
				Map<String, Object> winnerInfo = new HashMap<>();
				if (winner != null) {
					winnerInfo.put("id", winner.getMemberId());
					winnerInfo.put("nickname", winner.getNickname());
				} else {
					winnerInfo.put("id", winnerId);
					winnerInfo.put("nickname", "ID: " + winnerId);
				}
				socketMessage.put("winner", winnerInfo);
			} else {
				socketMessage.put("winner", null);
			}
			
			// 소켓 메시지 전송
			messagingTemplate.convertAndSend("/topic/auction/" + postId, socketMessage);
			
			System.out.println("자동 경매 종료 소켓 메시지 전송 완료: " + socketMessage);
		} catch (Exception socketError) {
			System.err.println("자동 경매 종료 소켓 메시지 전송 실패: " + socketError.getMessage());
		}
	}
	
	@Override
	public List<Map<String, Object>> getAuctionPhotos(long postId) {
		return auctionMapper.getAuctionPhotos(postId);
	}
}
