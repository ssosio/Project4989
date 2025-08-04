package boot.sagu.service;

import boot.sagu.dto.MemberDto;

public interface MemberServiceInter {
    public void signup(MemberDto dto);
    public MemberDto getMemberByLoginId(String loginId);
}