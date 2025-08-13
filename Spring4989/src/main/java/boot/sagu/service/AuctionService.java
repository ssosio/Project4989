package boot.sagu.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import boot.sagu.dto.AuctionDto;
import boot.sagu.dto.AuctionGuaranteeDTO;
import boot.sagu.dto.MemberDto;
import boot.sagu.dto.PostsDto;
import boot.sagu.mapper.AuctionMapper;

@Service
public class AuctionService implements AuctionServiceInter {
	
	@Autowired
	private AuctionMapper auctionMapper;
	
	@Autowired
	private SimpMessagingTemplate messagingTemplate;
	
	@Autowired
	private PortOneService portOneService;
	
	@Override
	public List<PostsDto> getAuctionPosts() {
		return auctionMapper.getAuctionPosts();
	}
	
	// 매 1분마다 실행 (경매 종료 체크)
	@Scheduled(fixedRate = 60000)
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
	public boolean isGuaranteePaid(long postId, long memberId) {
		return auctionMapper.countAuctionGuaranteeByPostAndMember(postId, memberId) > 0;
	}

	@Override
	public void insertGuarantee(AuctionGuaranteeDTO AuctionGuaranteeDto) {
		auctionMapper.insertGuarantee(AuctionGuaranteeDto);
	}

	@Override
	public List<AuctionGuaranteeDTO> findNonWinnerGuarantees(long postId, long winnerId) {
		return auctionMapper.findNonWinnerGuarantees(postId, winnerId);
	}

	@Override
	public void updateRefundStatus(long guaranteeId) {
		auctionMapper.updateRefundStatus(guaranteeId);
	}
	
	//경매 첫 입찰시 보증금 결제 요청을 생성한다
	public String createGuaranteePayment(long postId, long memberId, int startPrice) {
		int guaranteeAmount = Math.max(1, (int)Math.round(startPrice * 0.1));
		String merchanUid = "guarantee_" + postId + "_" + memberId;
		
		return portOneService.requestPayment(merchanUid, guaranteeAmount, merchanUid);
	}
	
	//낙찰 실패자 환불 일괄 처리(종료시 호출)
	public void refundNonWinners(long postId,long winnerId) {
		List<AuctionGuaranteeDTO> losers = findNonWinnerGuarantees(postId, winnerId);
		for(AuctionGuaranteeDTO loser : losers) {
			portOneService.refundPayment(loser.getImpUid(), loser.getAmount());
			updateRefundStatus(loser.getGuaranteeId());
		}
		
	}
}
