package boot.sagu.dto;

import org.apache.ibatis.type.Alias;

import lombok.Data;

@Data
@Alias("item")
public class ItemDto {

   private Long itemId;
   private Long postId;
   private int categoryId;
   private String conditions;
   private int location;
   private String detail_location;
   private double latitude;
   private double longitude;
   private String categoryName; // 카테고리 이름 (JOIN으로 가져올 필드)
   
   // 수동으로 getter/setter 추가 (Lombok 문제 해결용)
   public String getCategoryName() {
       return categoryName;
   }
   
   public void setCategoryName(String categoryName) {
       this.categoryName = categoryName;
   }
   
   public String getDetail_location() {
       return detail_location;
   }
   
   public void setDetail_location(String detail_location) {
       this.detail_location = detail_location;
   }
}
