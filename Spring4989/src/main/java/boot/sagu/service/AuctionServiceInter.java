package boot.sagu.service;

import java.util.List;


import boot.sagu.dto.AuctionGuaranteeDTO;
import boot.sagu.dto.PostsDto;


public interface AuctionServiceInter {
	
	List<PostsDto> getAuctionPosts();
	
	
	
	
	public int countAuctionGuaranteeByPostAndMember(long postId,long memberId); //게시글에 보증금 납부했는지
	public void insertGuarantee(AuctionGuaranteeDTO AuctionGuaranteeDto); //보증금 납부
	public List<AuctionGuaranteeDTO> findNonWinnerGuarantees(long postId,long winnerId);//낙찰자가 아닌 사람들의 입찰자들의 리스트뽑기
	public void updateRefundStatus(long guaranteeId); //환불
}
