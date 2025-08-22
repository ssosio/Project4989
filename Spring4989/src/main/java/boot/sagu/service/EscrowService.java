package boot.sagu.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import boot.sagu.dto.AuctionDto; 
import boot.sagu.mapper.AuctionMapper;
import boot.sagu.mapper.EscrowMapper;
import boot.sagu.service.PortOneService.PortOnePayment;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class EscrowService {

	   private final PortOneService portOneService;
	    private final AuctionMapper auctionMapper;     // 최종가 조회
	    private final EscrowMapper escrowMapper;       // 에스크로 전표
	    private final AuctionService auctionService;

	    @Transactional
	    public void handleEscrowPaid(Long postId, Long buyerId, String impUid, String merchantUid) {
	        if (postId == null || buyerId == null || impUid == null || merchantUid == null) return;

	        // 1) 서버검증
	        PortOnePayment pay = portOneService.getPayment(impUid);
	        if (pay == null || !"paid".equalsIgnoreCase(pay.getStatus())) return;

	        // 2) 금액/머천트 검증: 최고가 기준
	        AuctionDto highest = auctionMapper.getHighestBid(postId);
	        if (highest == null || highest.getBidAmount() == null) return;
	        int finalPrice = highest.getBidAmount().intValue();

	        if (pay.getAmount() != finalPrice || !merchantUid.equals(pay.getMerchantUid())) {
	            portOneService.cancelPayment(impUid, "에스크로 검증 실패", null);
	            return;
	        }

	        // 3) 전표 상태 갱신
	        escrowMapper.markPaidByMerchantUid(merchantUid, impUid);

	        // 4) (정책에 따라) 여기서 바로 보증금 환불하고 싶으면 아래 호출
	        auctionService.finalizeWinnerGuarantee(postId, buyerId, "REFUND");
	    }
}
