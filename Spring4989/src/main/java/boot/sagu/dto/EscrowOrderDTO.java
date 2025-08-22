package boot.sagu.dto;

import java.math.BigDecimal;

import org.apache.ibatis.type.Alias;

import lombok.Data;

@Data
@Alias("Escrow")
public class EscrowOrderDTO {

	 private Long postId;
	 private Long buyerId;
	 private BigDecimal amount;
	 private String merchantUid;
	 private String status;
}
