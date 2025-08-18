package boot.sagu.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import boot.sagu.dto.MemberRegionDto;
import boot.sagu.mapper.MemberRegionMapper;

@RestController
@RequestMapping("/api/member-region")
public class MemberRegionController {

    @Autowired
    private MemberRegionMapper memberRegionMapper;

    @PostMapping("/register")
    public ResponseEntity<String> registerMemberRegion(@RequestBody MemberRegionDto requestDto) {
        if (requestDto.getMemberId() == 0 || requestDto.getRegionId() == 0) {
            return ResponseEntity.badRequest().body("필수 정보(회원ID, 지역ID)가 누락되었습니다.");
        }

        try {
            // 해당 회원의 기존 주소 중 is_primary의 최댓값을 조회
            int maxIsPrimary = memberRegionMapper.findMaxIsPrimaryByMemberId(requestDto.getMemberId());

            // 새로운 is_primary 값을 계산 (최댓값 + 1)
            int newIsPrimary = maxIsPrimary + 1;
            requestDto.setIsPrimary(newIsPrimary);

            // 데이터베이스에 저장
            memberRegionMapper.insertMemberRegion(requestDto);
            
            return ResponseEntity.ok("회원의 주소 정보가 성공적으로 등록되었습니다.");
        } catch (Exception e) {
            System.err.println("DB 저장 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("DB 저장 중 오류가 발생했습니다.");
        }
    }
}