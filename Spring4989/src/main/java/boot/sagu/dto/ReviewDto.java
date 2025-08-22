package boot.sagu.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReviewDto {
    private Long reviewId;
    private Long postId;
    private Long reviewerId;
    private Long reviewOppositeId;
    private Double rating;
    private String comment;
    private LocalDateTime createdAt;
    
    public ReviewDto() {}
    
    public ReviewDto(Long postId, Long reviewerId, Long reviewOppositeId, Double rating, String comment) {
        this.postId = postId;
        this.reviewerId = reviewerId;
        this.reviewOppositeId = reviewOppositeId;
        this.rating = rating;
        this.comment = comment;
    }
}
