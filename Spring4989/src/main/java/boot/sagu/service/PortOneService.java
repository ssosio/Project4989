package boot.sagu.service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
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
	         Map<String, String> map = Map.of("imp_key", apiKey, "imp_secret", apiSecret);
	         ResponseEntity<Map> res = rest.postForEntity(
	                 "https://api.iamport.kr/users/getToken", map, Map.class);
	         Map resp = (Map) res.getBody().get("response");
	         return (String) resp.get("access_token");
	    }
	    
	    //결제금액 사전등록: 위변조 방지 
	    public void preparePayment(String merchantUid, int amount) {
	        String token = getAccessToken();
	        RestTemplate rest = new RestTemplate();
	        HttpHeaders headers = new HttpHeaders();
	        headers.set("Authorization", token); // Bearer 접두사 없이 토큰만 전달
	        headers.setContentType(MediaType.APPLICATION_JSON);

	        Map<String, Object> map = new HashMap<>();
	        map.put("merchant_uid", merchantUid);
	        map.put("amount", amount);

	        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(map, headers);
	        rest.postForEntity("https://api.iamport.kr/payments/prepare", entity, Map.class);
	    }

	    //프론트 결제창 호출 전 링크 생성 (사전등록 후 링크 반환)
	    public String requestPayment(String merchantUid, int amount, String name) {
	    	preparePayment(merchantUid, amount);
	        // 프론트에서 iamport.request_pay 호출 시 이 merchantUid와 amount를 사용
	        return "/payment-page?merchant_uid=" + merchantUid + "&amount=" + amount + "&name=" + name;
	    }
	    
	    //단건 결제 조회(imp_uid)-> 상태/금액/merchant_uid 검증 용도
	    public PortOnePayment getPayment(String impUid) {
	        String token = getAccessToken();
	        RestTemplate rest = new RestTemplate();
	        HttpHeaders headers = new HttpHeaders();
	        headers.set("Authorization", token);
	        HttpEntity<Void> entity = new HttpEntity<>(headers);

	        ResponseEntity<Map> res = rest.exchange(
	                "https://api.iamport.kr/payments/{imp_uid}",
	                HttpMethod.GET,
	                entity,
	                Map.class,
	                impUid
	        );
	        Map response = (Map) res.getBody().get("response");
	        PortOnePayment pay = new PortOnePayment();
	        pay.setImpUid((String) response.get("imp_uid"));
	        pay.setMerchantUid((String) response.get("merchant_uid"));
	        // amount는 정수형으로 넘어오므로 Number 변환
	        pay.setAmount(((Number) response.get("amount")).intValue());
	        pay.setStatus((String) response.get("status")); // paid, ready, cancelled 등
	        return pay;
	    }
	    
	    //결제 취소(환불). amount null이면 전액취소 
	    public void cancelPayment(String impUid, String reason, BigDecimal amount) {
	        String token = getAccessToken();
	        RestTemplate rest = new RestTemplate();
	        HttpHeaders headers = new HttpHeaders();
	        headers.set("Authorization", token);
	        headers.setContentType(MediaType.APPLICATION_JSON);

	        Map<String, Object> map = new HashMap<>();
	        map.put("imp_uid", impUid);
	        if (reason != null) map.put("reason", reason);
	        if (amount != null) map.put("amount", amount); // 부분취소 시 금액 명시

	        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(map, headers);
	        rest.postForEntity("https://api.iamport.kr/payments/cancel", entity, Map.class);
	    }
	    
	    //기존 사용처 호환용: 환불 사유 고정
	    /** 기존 사용처 호환용: 환불 사유 고정 */
	    public void refundPayment(String impUid, BigDecimal amount) {
	        cancelPayment(impUid, "보증금 환불", amount);
	    }
	    
	    // 아임포트 결제 단건 조회 결과 중 필요한 필드만 담는 DTO 
	    public static class PortOnePayment {
	        private String impUid;       // 결제건 고유 ID
	        private String merchantUid;  // 가맹점 주문번호
	        private String status;       // paid / ready / cancelled 등
	        private int amount;          // 결제 금액(정수)

	        public String getImpUid() { return impUid; }
	        public void setImpUid(String impUid) { this.impUid = impUid; }
	        public String getMerchantUid() { return merchantUid; }
	        public void setMerchantUid(String merchantUid) { this.merchantUid = merchantUid; }
	        public String getStatus() { return status; }
	        public void setStatus(String status) { this.status = status; }
	        public int getAmount() { return amount; }
	        public void setAmount(int amount) { this.amount = amount; }
	    }
}
