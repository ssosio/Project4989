package boot.sagu.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import boot.sagu.dto.EscrowOrderDTO;

@Mapper
public interface EscrowMapper {

	public int insertEscrowOrder(EscrowOrderDTO dto);
	public int markPaidByMerchantUid(@Param("merchantUid") String merchantUid, @Param("impUid") String impUid);
}
