package boot.sagu.service;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Param;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import boot.sagu.dto.CarDto;
import boot.sagu.dto.ItemDto;
import boot.sagu.dto.PhotoDto;
import boot.sagu.dto.PostsDto;
import boot.sagu.dto.RealEstateDto;
import boot.sagu.dto.RegionDto;
import boot.sagu.dto.ReportsDto;
import jakarta.servlet.http.HttpSession;

public interface PostsServiceInter {
	public void insertPost(PostsDto pdto);
	public List<PostsDto> getAllPostData();
	public Map<String, Object> getPostData(@RequestParam("postId") Long postId);
	public void insertPhoto(PhotoDto photoDto);
	public void insertPostWithPhoto(PostsDto pdto,List<MultipartFile> uploadFile,HttpSession session,CarDto cdto,RealEstateDto rdto,ItemDto idto);
	public List<Map<String, Object>> getPostListWithNick();
	public void increaseViewCount(@RequestParam("postId") Long postId);
	
	//좋아요
	public int countFavorite(Long postId);
	public boolean isFavorited(Long postId, Long memberId);
	public boolean toggleFavorite(Long postId, Long memberId);
	
	void updatePostAll(PostsDto post,
            CarDto car,
            RealEstateDto realEstate,
            ItemDto item,
            List<MultipartFile> uploads,
            List<Long> deletePhotoIds,
            Long mainPhotoId,            // null이면 자동 보정
            HttpSession session,
            Long actorId);
	
	//삭제
    void deletePost(@Param("postId") Long postId,PostsDto post,Long actorId);

	//신고
	public int insertReport(ReportsDto dto);
	
	// 검색 메서드 추가
	public List<PostsDto> searchAll(Map<String, Object> searchParams);
	
	public int countSearchAll(Map<String, Object> searchParams);

}
