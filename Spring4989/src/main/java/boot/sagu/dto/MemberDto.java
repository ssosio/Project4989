package boot.sagu.dto;

import java.sql.Timestamp;

import org.apache.ibatis.type.Alias;

import lombok.Data;

@Data
@Alias("member")
public class MemberDto {
    private int memberId;
    private String loginId;
    private String password;
    private String nickname;
    private String email;
    private String phoneNumber;
    private String profileImageUrl;
    private double mannerScore;
    private String status;
    private String role;
    private Timestamp createdAt;
    private Timestamp updatedAt;
}