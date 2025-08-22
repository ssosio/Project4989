package boot.sagu.controller;

import boot.sagu.dto.ReviewDto;
import boot.sagu.service.ReviewServiceInter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/review")
public class ReviewController {
    
    @Autowired
    private ReviewServiceInter reviewService;
    
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createReview(@RequestBody ReviewDto reviewDto) {
        Map<String, Object> response = new HashMap<>();
        
        System.out.println("=== 후기 작성 요청 시작 ===");
        System.out.println("받은 데이터: " + reviewDto);
        System.out.println("postId: " + reviewDto.getPostId());
        System.out.println("reviewerId: " + reviewDto.getReviewerId());
        System.out.println("reviewOppositeId: " + reviewDto.getReviewOppositeId());
        System.out.println("rating: " + reviewDto.getRating());
        System.out.println("comment: " + reviewDto.getComment());
        
        try {
            boolean success = reviewService.createReview(reviewDto);
            
            if (success) {
                System.out.println("✅ 후기 작성 성공");
                response.put("success", true);
                response.put("message", "후기가 성공적으로 작성되었습니다.");
            } else {
                System.out.println("❌ 후기 작성 실패");
                response.put("success", false);
                response.put("message", "후기 작성에 실패했습니다.");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ 후기 작성 중 예외 발생: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "후기 작성 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
