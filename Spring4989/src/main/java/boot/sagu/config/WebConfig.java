package boot.sagu.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // 클라이언트가 요청하는 URL 경로
    // ⭐⭐ 수정: URL 경로를 /chatsave/**로 지정합니다.
    private String connectPath = "/chatsave/**";

    // ⭐⭐ 수정: 물리적 파일 저장 경로를 chatsave 폴더의 상위 폴더인 static 폴더로 지정합니다.
    // 이 경로는 File-Upload-Service의 UPLOAD_BASE_PATH와 일치해야 합니다.
    private String resourcePath = "file:///C:/SIST0217/Project4989/Spring4989/src/main/resources/static/chatsave/";

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // addResourceHandler의 경로와 addResourceLocations의 경로를 조합하여
        // "http://.../chatsave/..." 요청 시 static 폴더를 기준으로 파일을 찾게 됩니다.
        registry.addResourceHandler(connectPath)
                .addResourceLocations(resourcePath);
    }
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 모든 경로에 대해
                .allowedOrigins("http://localhost:5173") // 프론트엔드 주소 허용
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}