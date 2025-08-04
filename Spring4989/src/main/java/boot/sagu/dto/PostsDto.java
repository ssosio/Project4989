package boot.sagu.dto;

import java.sql.Timestamp;

import org.apache.ibatis.type.Alias;

import lombok.Data;

@Data
@Alias("posts")
public class PostsDto {

    private long post_id;
    private long member_id;
    private String title;
    private double price;
    private String trade_type; // ENUM: 'SALE', 'AUCTION', 'RENTAL'
    private String status;     // ENUM: 'ON_SALE', 'RESERVED', 'SOLD'
    private Timestamp auction_end_time;
    private Long winner_id;    // NULL 가능성 있음
    private int view_count;
    private Timestamp created_at;
    private Timestamp updated_at;
}
