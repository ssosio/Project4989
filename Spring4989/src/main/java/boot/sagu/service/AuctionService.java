package boot.sagu.service;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import boot.sagu.dto.AuctionDto;
import boot.sagu.dto.AuctionGuaranteeDTO;
import boot.sagu.dto.FavoritesDto;
import boot.sagu.dto.MemberDto;
import boot.sagu.dto.PostsDto;
import boot.sagu.mapper.AuctionMapper;
import boot.sagu.mapper.MemberMapper;
import boot.sagu.service.PortOneService.PortOnePayment;


@Service
public class AuctionService implements AuctionServiceInter {
	
	@Autowired
	private AuctionMapper auctionMapper;
	
	@Autowired
	private MemberMapper memberMapper;
	
	@Autowired
	private PasswordEncoder passwordEncoder;
	
	@Autowired
	private SimpMessagingTemplate messagingTemplate;
	
	@Autowired
	private PortOneService portOneService;
	
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
	   @Transactional
	   public String endAuction(long postId) {
		   try {
		        // 1) 경매 조회 & 이미 종료 여부
		        PostsDto auction = auctionMapper.getAuctionDetail(postId);
		        if (auction == null) return "경매글을 찾을 수 없습니다.";
		        if ("SOLD".equals(auction.getStatus())) return "이미 종료된 경매입니다.";

		        // 2) 최고 입찰자 조회
		        AuctionDto highestBid = auctionMapper.getHighestBid(postId);

		        if (highestBid != null) {
		            long winnerId = highestBid.getBidderId();

		            // 3) 낙찰자 지정 & SOLD + 종료시간 기록
		            auctionMapper.updateWinnerId(postId, winnerId);
		            auctionMapper.updateAuctionStatusAndEndTime(postId, "SOLD");

		            // 4) 비낙찰자 환불
		            List<AuctionGuaranteeDTO> losers = auctionMapper.findNonWinnerGuarantees(postId, winnerId);
		            for (AuctionGuaranteeDTO loser : losers) {
		                try {
		                    // PG 환불
		                    portOneService.refundPayment(loser.getImpUid(), loser.getAmount());
		                    // DB 상태 REFUNDED
		                    auctionMapper.updateGuaranteeStatus(loser.getGuaranteeId(), "REFUNDED");
		                } catch (Exception ex) {
		                	//실패 상태 기록
		                	auctionMapper.updateGuaranteeStatus(loser.getGuaranteeId(), "REFUND_FAILED");
		                    // 환불 실패는 로그만 남기고 다음 대상 처리 (재시도 큐/알림 붙이면 더 좋음)
		                    System.err.println("환불 실패 guaranteeId=" + loser.getGuaranteeId() + " : " + ex.getMessage());
		                }
		            }

		            // 5) 낙찰자 보증금 HOLD
		            AuctionGuaranteeDTO winnerG = auctionMapper.findGuarantee(postId, winnerId);
		            if (winnerG != null) {
		                auctionMapper.updateGuaranteeStatus(winnerG.getGuaranteeId(), "HOLD");
		            } else {
		                System.err.println("낙찰자 보증금 없음 postId=" + postId + ", winnerId=" + winnerId);
		            }

		            // 6) 소켓 알림 (헬퍼로 통일)
		            sendAuctionEndMessage(postId, winnerId);

		            return "경매가 성공적으로 종료되었습니다. 낙찰자: ID " + winnerId;
		        } else {
		            // 입찰자 없음 → SOLD + 종료시간만
		            auctionMapper.updateAuctionStatusAndEndTime(postId, "SOLD");

		            // 소켓 알림 (낙찰자 없음)
		            sendAuctionEndMessage(postId, null);

		            return "경매가 종료되었습니다. (입찰자 없음)";
		        }
		    } catch (Exception e) {
		        return "경매 종료 처리에 실패했습니다: " + e.getMessage();
		    }
	   }
	
	
	// 매 1분마다 실행 (경매 종료 체크)
		@Scheduled(fixedDelay = 60_000)
		public void checkAndEndAuctions() {
			   try {
			        for (PostsDto auction : auctionMapper.getEndedAuctions()) {
			            try {
			                String result = endAuction(auction.getPostId()); // 중앙 로직 1곳만 호출
			                System.out.println("[Scheduler] " + result);
			            } catch (Exception ex) {
			                System.err.println("[Scheduler] endAuction 실패 postId=" + auction.getPostId()
			                                   + " : " + ex.getMessage());
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
		
		//낙찰 거래 최종처리: 정상거래면 환불, 노쇼면 몰수
	@Transactional
	public void finalizeWinnerGuarantee(long postId, long winnerId, String action) {
	    AuctionGuaranteeDTO g = auctionMapper.findGuarantee(postId, winnerId);
	    if (g == null) return;
		    switch (action) {
		        case "REFUND":   // 정상 거래 완료 → 환불
		            portOneService.refundPayment(g.getImpUid(), g.getAmount());	
		            auctionMapper.updateGuaranteeStatus(g.getGuaranteeId(), "REFUNDED");
		            break;
		        case "FORFEIT":  // 노쇼/파기 → 몰수 (ENUM에 FORFEITED 있으면)
		            auctionMapper.updateGuaranteeStatus(g.getGuaranteeId(), "FORFEITED");
		            break;
	    }
	}
		
	@Override
	public List<Map<String, Object>> getAuctionPhotos(long postId) {
		return auctionMapper.getAuctionPhotos(postId);
	}
	

	//경매 첫 입찰시 보증금 결제 요청URL을 생성한다
	public String createGuaranteePayment(long postId, long memberId, int startPrice) {
		int guaranteeAmount = Math.max(1, (int)Math.round(startPrice * 0.1));
		String merchantUid = "guarantee_" + postId + "_" + memberId;
		
		return portOneService.requestPayment(merchantUid, guaranteeAmount, "경매보증금 결제");
	}
	
	// 결제 완료 후 보증금 저장
	public void saveGuarantee(long postId, long memberId, BigDecimal amount, String impUid,String merchantUid) {
		AuctionGuaranteeDTO dto = new AuctionGuaranteeDTO();
		dto.setPostId(postId);
		dto.setMemberId(memberId);
		dto.setAmount(amount);
		dto.setImpUid(impUid);
		dto.setMerchantUid(merchantUid);
		auctionMapper.insertGuarantee(dto);
	}
	
	//낙찰 실패자 환불 일괄 처리(종료시 호출)
	public void refundNonWinners(long postId,long winnerId) {
		List<AuctionGuaranteeDTO> losers = findNonWinnerGuarantees(postId, winnerId);
		for(AuctionGuaranteeDTO loser : losers) {
			portOneService.refundPayment(loser.getImpUid(), loser.getAmount());
			updateGuaranteeStatus(loser.getGuaranteeId(),"REFUNDED");
		}
		
	}


	
	//최초입찰시 보증금 없으면 결제링크 반환
	@Override
	public String placeBidWithGuarantee(AuctionDto auctionDto) {
		
		long postId = auctionDto.getPostId();
		long bidderId = auctionDto.getBidderId();
		
		boolean paid = auctionMapper.countAuctionGuaranteeByPostAndMember(postId, bidderId) > 0;
		if(!paid) {
			int startPrice = auctionMapper.getStartPrice(postId);
			int guaranteeAmount = Math.max(1, (int)Math.round(startPrice * 0.1));
			String merchantUid = "guarantee_" + postId + "_"+bidderId;
			
			// PortOneService.requestPayment 내부에서 prepare 호출 → 위변조 방지
			String link = portOneService.requestPayment(merchantUid, guaranteeAmount, "경매 보증금 결제");
			return "[NEED_GUARANTEE]"+ link; // 프론트 분기 위해 prefix 유지
		}
		// 이미 납부 → 기존 placeBid 재사용
		return placeBid(auctionDto);
	}
	
	//(웹훅) 결제 검증 후 보증금 저장: imp_uid 조회 → 상태/금액/merchant_uid 검증 → DB insert
	// 결제 검증 + 보증금 저장
	@Transactional
	public void handlePortOneWebhook(long postId, long memberId, String impUid, String merchantUidFromClient) {
	    PortOnePayment pay = portOneService.getPayment(impUid);
	    if (!"paid".equalsIgnoreCase(pay.getStatus())) {
	        throw new IllegalStateException("결제상태가 paid가 아님");
	    }
	    int startPrice = auctionMapper.getStartPrice(postId);
	    int expected = Math.max(1, (int)Math.round(startPrice * 0.1));
	    if (pay.getAmount() != expected || !pay.getMerchantUid().equals(merchantUidFromClient)) {
	    	 // 위변조 의심 → 즉시 취소 권장
	        portOneService.cancelPayment(impUid, "보증금 검증 실패", null);
	        throw new IllegalStateException("결제 검증 실패");
	    }

	    AuctionGuaranteeDTO dto = new AuctionGuaranteeDTO();
	    dto.setPostId(postId);
	    dto.setMemberId(memberId);
	    dto.setAmount(BigDecimal.valueOf(pay.getAmount()));
	    dto.setImpUid(impUid);
	    dto.setMerchantUid(pay.getMerchantUid());
	    dto.setStatus("PAID");
	    auctionMapper.insertGuarantee(dto);
	}
	
	
	@Override
	public int getStartPrice(long postId) {
		// TODO Auto-generated method stub
		return auctionMapper.getStartPrice(postId);
	}

	@Override
	public void insertBid(AuctionDto auctionDto) {
		auctionMapper.insertBid(auctionDto);
	}
	
	//보증금 납부여부 확인
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
	public void updateGuaranteeStatus(long guaranteeId,String status) {
		auctionMapper.updateGuaranteeStatus(guaranteeId,status);
	}
	
	
	// 결제 완료 후 보증금 저장
	public void saveGuarantee(long postId, long memberId, BigDecimal amount, String impUid) {
		AuctionGuaranteeDTO dto = new AuctionGuaranteeDTO();
		dto.setPostId(postId);
		dto.setMemberId(memberId);
		dto.setAmount(amount);
		dto.setImpUid(impUid);
		dto.setStatus("PAID");
		auctionMapper.insertGuarantee(dto);
	}
	
	
	// 비밀번호 확인 후 경매 삭제
	public void deleteAuction(long postId, String loginId, String rawPassword) {
		// 1. 비밀번호 확인
		MemberDto member = memberMapper.findByLoginId(loginId);
		if (member == null) {
			throw new RuntimeException("사용자를 찾을 수 없습니다.");
		}
		
		// 2. 비밀번호 검증
		if (!passwordEncoder.matches(rawPassword, member.getPassword())) {
			throw new RuntimeException("비밀번호가 일치하지 않습니다.");
		}
		
		// 3. 경매 작성자 확인
		PostsDto auction = auctionMapper.getAuctionDetail(postId);
		if (auction == null || auction.getMemberId() != member.getMemberId()) {
			throw new RuntimeException("삭제 권한이 없습니다.");
		}
		
		// 4. 연관된 used_items 데이터 먼저 삭제
		auctionMapper.deleteUsedItemsByPostId(postId);
		
		// 5. 연관된 favorites 데이터 삭제
		auctionMapper.deleteFavoritesByPostId(postId);
		
		// 6. 연관된 chatroom 데이터 삭제
		auctionMapper.deleteChatroomsByPostId(postId);
		
		// 7. 연관된 사진 데이터 삭제
		auctionMapper.deletePhotosByPostId(postId);
		
		// 8. 실제 이미지 파일 삭제
		deleteImageFiles(postId);
		
		// 9. 경매 삭제
		auctionMapper.deleteAuction(postId);
	}
	
	// 실제 이미지 파일 삭제
	private void deleteImageFiles(long postId) {
		try {
			// post_photos 테이블에서 해당 경매의 사진 정보 조회
			List<Map<String, Object>> photos = auctionMapper.getAuctionPhotos(postId);
			
			for (Map<String, Object> photo : photos) {
				String photoUrl = (String) photo.get("photo_url");
				if (photoUrl != null && !photoUrl.isEmpty()) {
					// 파일 시스템에서 이미지 파일 삭제
					deleteImageFile(photoUrl);
				}
			}
		} catch (Exception e) {
			// 파일 삭제 실패 시에도 로그만 남기고 계속 진행
			System.err.println("이미지 파일 삭제 중 오류 발생: " + e.getMessage());
		}
	}
	
	// 개별 이미지 파일 삭제
	private void deleteImageFile(String photoUrl) {
		try {
			// 서버의 save 폴더 경로
			String savePath = "src/main/webapp/save/";
			Path filePath = Paths.get(savePath + photoUrl);
			
			// 파일이 존재하면 삭제
			if (Files.exists(filePath)) {
				Files.delete(filePath);
				System.out.println("이미지 파일 삭제 완료: " + photoUrl);
			}
		} catch (Exception e) {
			System.err.println("이미지 파일 삭제 실패: " + photoUrl + ", 오류: " + e.getMessage());
		}
	}
	
	// 입찰 기록 조회 (최근 5개, 닉네임 포함)
	public List<Map<String, Object>> getBidHistory(long postId) {
		return auctionMapper.getBidHistory(postId);
	}
	
	// 조회수 증가 (중복 방지)
	private final Map<String, Long> lastViewTime = new ConcurrentHashMap<>();
	
	public void incrementViewCount(long postId) {
		try {
			String key = String.valueOf(postId);
			long currentTime = System.currentTimeMillis();
			
			// 같은 postId로 5초 이내에 조회수 증가 요청이 온 경우 무시
			Long lastTime = lastViewTime.get(key);
			if (lastTime != null && (currentTime - lastTime) < 5000) {
				System.out.println("조회수 증가 무시 (중복 요청): postId=" + postId);
				return;
			}
			
			auctionMapper.incrementViewCount(postId);
			lastViewTime.put(key, currentTime);
			System.out.println("조회수 증가 완료: postId=" + postId);
		} catch (Exception e) {
			System.err.println("조회수 증가 실패: postId=" + postId + ", 오류: " + e.getMessage());
		}
	}
}