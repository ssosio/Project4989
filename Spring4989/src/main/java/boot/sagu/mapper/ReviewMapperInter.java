package boot.sagu.mapper;

import boot.sagu.dto.ReviewDto;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ReviewMapperInter {
    int insertReview(ReviewDto reviewDto);
}
