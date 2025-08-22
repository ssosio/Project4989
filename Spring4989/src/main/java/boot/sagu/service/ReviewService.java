package boot.sagu.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import boot.sagu.dto.ReviewDto;
import boot.sagu.mapper.ReviewMapperInter;

@Service
public class ReviewService implements ReviewServiceInter {
    
    @Autowired
    private ReviewMapperInter reviewMapper;
    
    @Override
    public boolean createReview(ReviewDto reviewDto) {
        System.out.println("=== ReviewService.createReview 시작 ===");
        System.out.println("입력 데이터: " + reviewDto);
        
        try {
            int result = reviewMapper.insertReview(reviewDto);
            System.out.println("Mapper 결과: " + result);
            
            if (result > 0) {
                System.out.println("✅ 후기 삽입 성공");
                return true;
            } else {
                System.out.println("❌ 후기 삽입 실패: result = " + result);
                return false;
            }
        } catch (Exception e) {
            System.err.println("❌ ReviewService에서 예외 발생: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
