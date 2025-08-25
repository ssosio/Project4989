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

}
