package boot.sagu.mapper;

import java.util.List;
import java.util.Map;

import boot.sagu.dto.CarDto;
import boot.sagu.dto.ItemDto;
import boot.sagu.dto.PostsDto;
import boot.sagu.dto.RealEstateDto;
import boot.sagu.dto.ReportsDto;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.web.bind.annotation.RequestParam;

@Mapper
public interface PostsMapperInter {
	public void insertPost(PostsDto pdto);
	public List<PostsDto> getAllPostData();
	public Map<String, Object> getPostData(@RequestParam("postId") Long postId);
	public List<Map<String, Object>> getPostListWithNick();
	public void increaseViewCount(@RequestParam("postId") Long postId);
	
	//	좋아요	
	public int countFavorite(@Param("postId") Long postId);
	public int existsFavorite(@Param("postId") Long postId, @Param("memberId") Long memberId);
	public int insertFavorite(@Param("postId") Long postId, @Param("memberId") Long memberId);
	public int deleteFavorite(@Param("postId") Long postId, @Param("memberId") Long memberId);
	
	// 게시글 공통 수정 (posts)
    int updatePost(PostsDto post);

    // 자동차 서브 수정 (cars)
    int updateCar(CarDto car);

    // 부동산 서브 수정 (real_estates)
    int updateRealEstate(RealEstateDto realEstate);

    // 중고물품 서브 수정 (used_items)
    int updateItem(ItemDto item);
    
    // 권한 체크
    Long findOwnerId(@Param("postId") Long postId);

    // (선택) 경매 종료시간 보정
    int updateAuctionEndTimeToNowPlus24H(@Param("postId") Long postId);
    
    //삭제
    void deletePost(@Param("postId") Long postId);
	
	//신고
	public int insertReport(ReportsDto dto);
	
}