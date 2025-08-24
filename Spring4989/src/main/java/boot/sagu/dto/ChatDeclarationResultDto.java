package boot.sagu.dto;

import lombok.Data;

@Data
public class ChatDeclarationResultDto {
    private Integer declarationId;
    private Integer resultMemberId;
    private String reason;
}
