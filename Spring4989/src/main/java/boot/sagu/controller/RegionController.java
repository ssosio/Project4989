package boot.sagu.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;

import boot.sagu.dto.RegionDto;
import boot.sagu.mapper.RegionMapper;

@Component
public class RegionController implements CommandLineRunner {

    @Autowired
    private RegionMapper regionMapper;

    @Value("${kakao.rest.api.key}")
    private String kakaoApiKey;

    @Override
    public void run(String... args) throws Exception {
        // "강남구", "종로구" 등 원하는 지역 키워드 목록
        List<String> keywords = List.of("강남구", "종로구", "마포구", "성동구");

        for (String keyword : keywords) {
            // 1. 주소 검색 API 호출
            JsonNode addressData = searchAddress(keyword);
            
            if (addressData != null) {
                // 2. 주소-좌표 변환 API 호출
                JsonNode coordData = getCoordinates(addressData.get("address_name").asText());

                if (coordData != null) {
                    RegionDto region = new RegionDto();
                    region.setProvince("서울특별시"); // 예시
                    region.setCity(keyword);
                    region.setDistrict(addressData.get("address_name").asText());
                    region.setLatitude(coordData.get("y").asDouble());
                    region.setLongitude(coordData.get("x").asDouble());

                    // 3. DB에 저장
                    regionMapper.insertRegion(region);
                }
            }
            Thread.sleep(1000); // API 호출 제한을 피하기 위한 딜레이
        }
    }
    
 // 주소 검색 API 호출 메서드
    private JsonNode searchAddress(String query) {
        WebClient webClient = WebClient.create("https://dapi.kakao.com");
        
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            
            return webClient.get()
                    .uri("/v2/local/search/address.json?query=" + encodedQuery)
                    .header("Authorization", "KakaoAK " + kakaoApiKey)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
        } catch (Exception e) {
            System.err.println("주소 검색 실패: " + e.getMessage());
            return null;
        }
    }

    // 주소-좌표 변환 API 호출 메서드
    private JsonNode getCoordinates(String address) {
        WebClient webClient = WebClient.create("https://dapi.kakao.com");
        
        try {
            String encodedAddress = URLEncoder.encode(address, StandardCharsets.UTF_8);
            
            JsonNode response = webClient.get()
                    .uri("/v2/local/search/address.json?query=" + encodedAddress)
                    .header("Authorization", "KakaoAK " + kakaoApiKey)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
            
            // 응답에서 documents 배열의 첫 번째 요소가 좌표 정보를 담고 있음
            if (response != null && response.has("documents") && response.get("documents").size() > 0) {
                return response.get("documents").get(0);
            }
            return null;
        } catch (Exception e) {
            System.err.println("좌표 변환 실패: " + e.getMessage());
            return null;
        }
    }
}
