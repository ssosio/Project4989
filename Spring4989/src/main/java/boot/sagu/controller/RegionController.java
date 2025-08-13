package boot.sagu.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import boot.sagu.dto.RegionDto;
import boot.sagu.mapper.RegionMapper;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/region")
public class RegionController {

    @Autowired
    private RegionMapper regionMapper;

    // 대한민국 특별시/광역시 목록 (예외 처리를 위한 데이터)
    private static final List<String> SPECIAL_METRO_CITIES = Arrays.asList(
            "서울", "부산", "대구", "인천",
            "광주", "대전", "울산", "세종특별자치시"
    );

    @PostMapping("/register")
    public ResponseEntity<String> registerRegion(@RequestBody RegionDto requestDto) {
        // 1. 필수 정보 유효성 검사
        if (requestDto.getAddress() == null || requestDto.getAddress().isEmpty() ||
            requestDto.getLatitude() == 0 || requestDto.getLongitude() == 0) {
            return ResponseEntity.badRequest().body("필수 정보가 누락되었습니다.");
        }

        String address = requestDto.getAddress();
        String[] addressParts = address.split(" ");

        String province = null;
        String city = null;
        String district = null;
        String town = null;

        // 2. 주소 파싱 로직
        if (addressParts.length > 0) {
            String firstPart = addressParts[0];

            // 2-1. 특별시/광역시 예외 처리
            if (SPECIAL_METRO_CITIES.contains(firstPart)) {
                // 예: "서울특별시 강남구 압구정동"
                province = firstPart; // "서울특별시"
                // city는 null로 처리
                if (addressParts.length > 1) {
                    district = addressParts[1]; // "강남구"
                }
                if (addressParts.length > 2) {
                    town = addressParts[2]; // "압구정동"
                }
            }
            // 2-2. 일반 '도' 주소 처리
            else if(addressParts.length > 3){
                // 예: "경기 성남시 분당구 백현동"
                province = firstPart; // "경기"
                if (addressParts.length > 1) {
                    city = addressParts[1]; // "성남시"
                }
                if (addressParts.length > 2) {
                    district = addressParts[2]; // "분당구"
                }
                if (addressParts.length > 3) {
                    town = addressParts[3]; // "백현동"
                }
            }
            
            else {
            	 // 예: "경기 하남시 미사동"
                province = firstPart; // "경기"
                if (addressParts.length > 1) {
                    city = addressParts[1]; // "하남시"
                }
                if (addressParts.length > 2) {
                	town = addressParts[2]; // "미사동"
                }
            }
        }
        
        // 3. 파싱된 데이터로 DTO 생성 및 저장
        RegionDto region = new RegionDto();
        region.setProvince(province);
        region.setCity(city);
        region.setDistrict(district);
        region.setTown(town);
        region.setLatitude(requestDto.getLatitude());
        region.setLongitude(requestDto.getLongitude());

        try {
            System.out.println("Province: " + province);
            System.out.println("City: " + city);
            System.out.println("District: " + district);
            System.out.println("Town: " + town);

            regionMapper.insertRegion(region);
            return ResponseEntity.ok("주소 정보가 성공적으로 저장되었습니다.");
        } catch (Exception e) {
            System.err.println("DB 저장 오류: " + e.getMessage());
            e.printStackTrace(); 
            return ResponseEntity.status(500).body("DB 저장 중 오류가 발생했습니다.");
        }
    }
}