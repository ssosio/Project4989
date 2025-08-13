package boot.sagu.service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class PortOneService {

	 @Value("${portone.api-key}")
	    private String apiKey;

	    @Value("${portone.api-secret}")
	    private String apiSecret;

	    private String getAccessToken() {
	        RestTemplate rest = new RestTemplate();
	        Map<String, String> body = Map.of("imp_key", apiKey, "imp_secret", apiSecret);
	        ResponseEntity<Map> res = rest.postForEntity("https://api.iamport.kr/users/getToken", body, Map.class);
	        return (String) ((Map) res.getBody().get("response")).get("access_token");
	    }

	    public String requestPayment(String merchantUid, int amount, String name) {
	        // 프론트에서 iamport.request_pay 호출 시 이 merchantUid와 amount를 사용
	        return "/payment-page?merchant_uid=" + merchantUid + "&amount=" + amount + "&name=" + name;
	    }

	    public void refundPayment(String impUid, BigDecimal amount) {
	        String token = getAccessToken();
	        RestTemplate rest = new RestTemplate();
	        HttpHeaders headers = new HttpHeaders();
	        headers.set("Authorization", token);
	        headers.setContentType(MediaType.APPLICATION_JSON);

	        Map<String, Object> body = new HashMap<>();
	        body.put("imp_uid", impUid);
	        body.put("amount", amount);

	        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
	        rest.postForEntity("https://api.iamport.kr/payments/cancel", entity, Map.class);
	    }
}
