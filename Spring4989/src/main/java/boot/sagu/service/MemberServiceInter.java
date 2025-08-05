package boot.sagu.service;

import org.springframework.web.multipart.MultipartFile;

import boot.sagu.dto.MemberDto;

public interface MemberServiceInter {
    public void signup(MemberDto dto,MultipartFile profileImageFile);
    public MemberDto getMemberByLoginId(String loginId);
    boolean isLoginIdAvailable(String loginId);
}